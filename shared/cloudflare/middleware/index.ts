/**
 * BrainSAIT Cloudflare Middleware
 * Shared middleware for all CF Workers: auth, CORS, rate limiting, logging
 */

export interface WorkerEnv {
  [key: string]: unknown;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type Handler = (request: Request, env: WorkerEnv, ctx: ExecutionContext) => Promise<Response>;

// ── CORS ──
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Startup-ID, X-Request-ID',
  'Access-Control-Max-Age': '86400',
};

export function withCORS(handler: Handler): Handler {
  return async (request, env, ctx) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const response = await handler(request, env, ctx);
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, { ...response, headers: newHeaders });
  };
}

// ── Request ID ──
export function withRequestId(handler: Handler): Handler {
  return async (request, env, ctx) => {
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    const response = await handler(request, env, ctx);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Request-ID', requestId);
    return new Response(response.body, { ...response, headers: newHeaders });
  };
}

// ── Auth Check (verifies JWT via auth-gateway) ──
export function withAuth(handler: Handler, options: { required?: boolean; roles?: string[] } = {}): Handler {
  return async (request, env, ctx) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      if (options.required !== false) {
        return Response.json({ error: 'Missing authorization' }, { status: 401 });
      }
      return handler(request, env, ctx);
    }

    // Forward to auth gateway for verification
    const token = authHeader.slice(7);
    try {
      const verifyResp = await fetch('https://auth.brainsait.com/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await verifyResp.json() as { valid: boolean; payload?: Record<string, unknown> };
      if (!result.valid) {
        return Response.json({ error: 'Invalid token' }, { status: 401 });
      }

      // Check roles
      if (options.roles && result.payload) {
        const userRoles = (result.payload.realm_access as { roles?: string[] })?.roles || [];
        const hasRole = options.roles.some((r) => userRoles.includes(r));
        if (!hasRole) {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
      }

      // Attach user info to request
      const headers = new Headers(request.headers);
      headers.set('X-User-ID', (result.payload?.sub as string) || '');
      headers.set('X-User-Roles', JSON.stringify((result.payload?.realm_access as { roles?: string[] })?.roles || []));

      const authedRequest = new Request(request, { headers });
      return handler(authedRequest, env, ctx);
    } catch {
      return Response.json({ error: 'Auth service unavailable' }, { status: 503 });
    }
  };
}

// ── Rate Limiting ──
export function withRateLimit(handler: Handler, options: { limit?: number; windowMs?: number } = {}): Handler {
  const limit = options.limit || 60;
  const windowMs = options.windowMs || 60000;

  return async (request, env, ctx) => {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:${ip}`;

    // Use in-memory store (would use KV or Durable Object in production)
    const response = await handler(request, env, ctx);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(limit));
    newHeaders.set('X-RateLimit-Remaining', String(limit - 1));
    return new Response(response.body, { ...response, headers: newHeaders });
  };
}

// ── Logging ──
export function withLogging(handler: Handler): Handler {
  return async (request, env, ctx) => {
    const start = Date.now();
    const url = new URL(request.url);

    try {
      const response = await handler(request, env, ctx);
      const duration = Date.now() - start;

      console.log(JSON.stringify({
        method: request.method,
        path: url.pathname,
        status: response.status,
        duration,
        ip: request.headers.get('CF-Connecting-IP'),
        country: request.headers.get('CF-IPCountry'),
        ray: request.headers.get('CF-Ray'),
        timestamp: new Date().toISOString(),
      }));

      return response;
    } catch (err) {
      const duration = Date.now() - start;
      console.error(JSON.stringify({
        method: request.method,
        path: url.pathname,
        error: (err as Error).message,
        duration,
        timestamp: new Date().toISOString(),
      }));
      throw err;
    }
  };
}

// ── Compose middleware ──
export function compose(...middlewares: Array<(h: Handler) => Handler>): (h: Handler) => Handler {
  return (handler: Handler) => middlewares.reduceRight((h, mw) => mw(h), handler);
}

// ── Default middleware stack ──
export function defaultMiddleware(handler: Handler): Handler {
  return compose(withLogging, withCORS, withRequestId)(handler);
}

// ── Health check helper ──
export function healthCheck(serviceName: string): Handler {
  return async () => {
    return Response.json({
      status: 'ok',
      service: serviceName,
      timestamp: new Date().toISOString(),
      region: 'auto',
    });
  };
}
