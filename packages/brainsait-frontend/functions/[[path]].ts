// Cloudflare Pages Functions: HTTPS enforcement, security headers, API proxy.

interface Env {
  API_BASE_URL?: string;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

interface PagesFunctionContext {
  request: Request;
  env: Env;
  params: Record<string, string | undefined>;
}

const PROXY_TIMEOUT_MS = 30_000;
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

/** Headers to strip when proxying to/from the origin. */
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
]);

/** Security headers applied to every response. */
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options':    'nosniff',
  'X-Frame-Options':           'SAMEORIGIN',
  'X-XSS-Protection':          '1; mode=block',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://api.brainsait.org https://partners-api.brainsait.org " +
    "https://data-hub.brainsait.org https://events.brainsait.org " +
    "wss://notifications.brainsait.org; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
};

function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers,
  });
}

function buildProxyHeaders(original: Headers): Headers {
  const headers = new Headers();
  for (const [key, value] of original.entries()) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  // Always forward Authorization and Cookie
  const auth   = original.get('Authorization');
  const cookie = original.get('Cookie');
  if (auth)   headers.set('Authorization', auth);
  if (cookie) headers.set('Cookie', cookie);
  return headers;
}

export const onRequest = async (context: PagesFunctionContext): Promise<Response> => {
  const { request, env } = context;
  const url = new URL(request.url);

  // ── 1. Enforce HTTPS — redirect any plain-HTTP request ────────────────────
  if (url.protocol === 'http:') {
    const httpsUrl = `https://${url.host}${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: {
        'Location': httpsUrl,
        'Strict-Transport-Security': SECURITY_HEADERS['Strict-Transport-Security'],
      },
    });
  }

  // ── 2. API proxy ───────────────────────────────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    const apiBase = (env.API_BASE_URL ?? 'https://api.brainsait.org').replace(/\/$/, '');
    const proxyUrl = `${apiBase}${url.pathname}${url.search}`;

    // Block excessively large uploads
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
      return addSecurityHeaders(new Response(JSON.stringify({ error: 'Request body too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    const proxyRequest = new Request(proxyUrl, {
      method:  request.method,
      headers: buildProxyHeaders(request.headers),
      body:    ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      // @ts-expect-error — Cloudflare-specific duplex option
      duplex: 'half',
    });

    // Race against a timeout
    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('upstream timeout')), PROXY_TIMEOUT_MS)
    );

    let originResponse: Response;
    try {
      originResponse = await Promise.race([fetch(proxyRequest), timeoutPromise]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'upstream error';
      return addSecurityHeaders(new Response(JSON.stringify({ error: msg }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    // Build response — strip hop-by-hop headers from origin
    const responseHeaders = new Headers();
    for (const [key, value] of originResponse.headers.entries()) {
      if (!HOP_BY_HOP.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }
    // Forward Set-Cookie headers for auth flows
    const setCookie = originResponse.headers.get('set-cookie');
    if (setCookie) responseHeaders.set('Set-Cookie', setCookie);

    // Add security headers to API responses too
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      responseHeaders.set(key, value);
    }

    return new Response(originResponse.body, {
      status:     originResponse.status,
      statusText: originResponse.statusText,
      headers:    responseHeaders,
    });
  }

  // ── 3. Static asset / Next.js page fallthrough ────────────────────────────
  const assetResponse = await env.ASSETS.fetch(request);
  return addSecurityHeaders(assetResponse);
};
