/**
 * BrainSAIT App Router — Cloudflare Worker
 *
 * Routes incoming requests to app.brainsait.org/* to the correct
 * Cloudflare Pages origin based on URL path prefix, while preserving the
 * full path and query string (each Pages app is built with its own basePath).
 *
 * Route table:
 *   /incubator  → https://incubator.pages.dev
 *   /givc       → https://givc.pages.dev
 *   /doctor     → https://doctor.pages.dev
 *   /api        → https://api-gateway.brainsait.org
 *   (default)   → https://masterlinc.pages.dev
 *
 * A unique x-request-id header is set on every proxied request and echoed
 * back in the response so all downstream services share the same correlation
 * identifier for logging and tracing.
 */

interface Route {
  prefix: string;
  origin: string;
}

const ROUTES: Route[] = [
  { prefix: '/incubator', origin: 'https://incubator.pages.dev' },
  { prefix: '/givc',      origin: 'https://givc.pages.dev' },
  { prefix: '/doctor',    origin: 'https://doctor.pages.dev' },
  { prefix: '/api',       origin: 'https://api-gateway.brainsait.org' },
];

const DEFAULT_ORIGIN = 'https://masterlinc.pages.dev';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Resolve the target origin for this path.
    let targetOrigin = DEFAULT_ORIGIN;
    for (const route of ROUTES) {
      if (path === route.prefix || path.startsWith(route.prefix + '/')) {
        targetOrigin = route.origin;
        break;
      }
    }

    // Build the upstream URL — keep the full path and query intact so that
    // each Next.js app (built with its own basePath) receives exactly the
    // path it expects.
    const targetUrl = new URL(request.url);
    const parsed = new URL(targetOrigin);
    targetUrl.protocol = parsed.protocol;
    targetUrl.host = parsed.host;

    // Propagate or create a request-id for end-to-end tracing.
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.set('x-request-id', requestId);
    upstreamHeaders.set('x-forwarded-host', url.host);

    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
      redirect: 'manual',
    });

    // Echo the request-id back in the response so clients can correlate logs.
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set('x-request-id', requestId);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  },
} satisfies ExportedHandler;
