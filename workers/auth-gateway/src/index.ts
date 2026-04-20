/**
 * BrainSAIT Auth Gateway
 * JWT verification, session management, Keycloak proxy
 */

const ALLOWED_ORIGINS = [
  'https://brainsait.org',
  'https://partners.brainsait.org',
  'https://portal.elfadil.com',
  'https://incubator.brainsait.org',
];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export interface Env {
  JWKS_CACHE: KVNamespace;
  SESSION_STORE: KVNamespace;
  STARTUP_ROLES: KVNamespace;
  DB: D1Database;
  AUTH_ANALYTICS: AnalyticsEngineDataset;
  KEYCLOAK_URL: string;
  REALM: string;
  CLIENT_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // Health
    if (url.pathname === '/health') {
      return withCors(Response.json({ status: 'ok', service: 'auth-gateway' }), request);
    }

    // OIDC Discovery
    if (url.pathname === '/.well-known/openid-configuration') {
      return withCors(await proxyToKeycloak(`${env.KEYCLOAK_URL}/realms/${env.REALM}/.well-known/openid-configuration`, env), request);
    }

    // JWKS endpoint (cached)
    if (url.pathname === '/jwks' || url.pathname === '/protocol/openid-connect/certs') {
      return withCors(await getJWKS(env), request);
    }

    // Token verification
    if (url.pathname === '/api/v1/verify' && request.method === 'POST') {
      return withCors(await verifyToken(request, env), request);
    }

    // Login redirect
    if (url.pathname === '/login') {
      const redirectUri = url.searchParams.get('redirect_uri') || 'https://brainsait.com';
      const state = crypto.randomUUID();
      await env.SESSION_STORE.put(`state:${state}`, redirectUri, { expirationTtl: 300 });
      const loginUrl = `${env.KEYCLOAK_URL}/realms/${env.REALM}/protocol/openid-connect/auth?client_id=${env.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid profile email&state=${state}`;
      return Response.redirect(loginUrl, 302);
    }

    // Token exchange
    if (url.pathname === '/callback' && request.method === 'POST') {
      return withCors(await handleCallback(request, env), request);
    }

    // Session info
    if (url.pathname === '/api/v1/session' && request.method === 'GET') {
      return withCors(await getSession(request, env), request);
    }

    // Logout
    if (url.pathname === '/logout') {
      const sessionId = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (sessionId) await env.SESSION_STORE.delete(`session:${sessionId}`);
      const logoutUrl = `${env.KEYCLOAK_URL}/realms/${env.REALM}/protocol/openid-connect/logout`;
      return Response.redirect(logoutUrl, 302);
    }

    // Startup roles
    if (url.pathname.startsWith('/api/v1/roles/') && request.method === 'GET') {
      const startup = url.pathname.split('/')[3];
      const roles = await env.STARTUP_ROLES.get(startup ?? '');
      return withCors(Response.json({ startup, roles: roles ? JSON.parse(roles) : [] }), request);
    }

    return withCors(Response.json({ error: 'Not found' }, { status: 404 }), request);
  },
};

async function getJWKS(env: Env): Promise<Response> {
  const cached = await env.JWKS_CACHE.get('jwks');
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  const resp = await fetch(`${env.KEYCLOAK_URL}/realms/${env.REALM}/protocol/openid-connect/certs`);
  const body = await resp.text();
  await env.JWKS_CACHE.put('jwks', body, { expirationTtl: 3600 });

  return new Response(body, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
}

async function verifyToken(request: Request, env: Env): Promise<Response> {
  const { token } = await request.json() as { token: string };

  try {
    const payload = await verifyJWT(token, env);
    env.AUTH_ANALYTICS.writeDataPoint({
      blobs: ['verify', payload.sub || 'unknown'],
      doubles: [Date.now()],
      indexes: [payload.sub || 'anonymous'],
    });
    return Response.json({ valid: true, payload });
  } catch (err) {
    return Response.json({ valid: false, error: (err as Error).message }, { status: 401 });
  }
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const { code, state } = await request.json() as { code: string; state: string };

  const redirectUri = await env.SESSION_STORE.get(`state:${state}`);
  if (!redirectUri) return Response.json({ error: 'Invalid state' }, { status: 400 });
  await env.SESSION_STORE.delete(`state:${state}`);

  // Exchange code for tokens
  const tokenResp = await fetch(`${env.KEYCLOAK_URL}/realms/${env.REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.CLIENT_ID,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokens = await tokenResp.json() as Record<string, string>;
  if (!tokenResp.ok) {
    return Response.json({ error: 'Token exchange failed', details: tokens }, { status: 401 });
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const payload = JSON.parse(base64urlDecode(tokens.access_token.split('.')[1]));
  await env.SESSION_STORE.put(`session:${sessionId}`, JSON.stringify({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    user: payload,
    createdAt: Date.now(),
  }), { expirationTtl: parseInt(tokens.expires_in || '3600') });

  return Response.json({ sessionId, user: payload, redirectUri });
}

async function getSession(request: Request, env: Env): Promise<Response> {
  const sessionId = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!sessionId) return Response.json({ error: 'No session' }, { status: 401 });

  const session = await env.SESSION_STORE.get(`session:${sessionId}`);
  if (!session) return Response.json({ error: 'Session expired' }, { status: 401 });

  const data = JSON.parse(session);
  return Response.json({ user: data.user, createdAt: data.createdAt });
}

function base64urlDecode(str: string): string {
  // Convert base64url to base64 by replacing URL-safe chars and re-padding
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  return atob(padded);
}

async function verifyJWT(token: string, env: Env): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const payload = JSON.parse(base64urlDecode(parts[1]));

  // Check expiration
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }

  // Verify signature using cached JWKS
  const jwksStr = await env.JWKS_CACHE.get('jwks');
  if (!jwksStr) throw new Error('JWKS not available');

  const jwks = JSON.parse(jwksStr);
  const header = JSON.parse(base64urlDecode(parts[0]));
  const key = jwks.keys?.find((k: Record<string, string>) => k.kid === header.kid);
  if (!key) throw new Error('Signing key not found');

  // Import key and verify
  const cryptoKey = await crypto.subtle.importKey(
    'jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(parts[0] + '.' + parts[1]);
  const signature = Uint8Array.from(base64urlDecode(parts[2]), c => c.charCodeAt(0));

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid signature');

  return payload;
}

async function proxyToKeycloak(url: string, env: Env): Promise<Response> {
  const cached = await env.JWKS_CACHE.get(`kc:${url}`);
  if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json' } });

  const resp = await fetch(url);
  const body = await resp.text();
  await env.JWKS_CACHE.put(`kc:${url}`, body, { expirationTtl: 600 });
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
}
