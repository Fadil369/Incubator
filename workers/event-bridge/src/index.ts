/**
 * BrainSAIT Event Bridge
 * Receives GitHub webhooks, validates, routes to CF Queues
 */
export interface Env {
  WEBHOOK_SECRETS: KVNamespace;
  EVENT_LOG: KVNamespace;
  GITHUB_EVENTS: Queue;
  PIPELINE_EVENTS: Queue;
  NOTIFICATION_QUEUE: Queue;
  DB: D1Database;
  EVENT_ANALYTICS: AnalyticsEngineDataset;
  ALLOWED_REPOS: string;
}

interface GitHubWebhookEvent {
  action?: string;
  repository?: { full_name: string; name: string };
  sender?: { login: string; type: string };
  [key: string]: unknown;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://brainsait.org',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hub-signature-256, x-github-event, x-github-delivery',
};

const ALLOWED_ORIGINS = new Set([
  'https://brainsait.org',
  'https://partners.brainsait.org',
  'https://incubator.brainsait.org',
  'https://portal.elfadil.com',
  'http://localhost:3000',
  'http://localhost:3001',
]);

// Dynamic CORS helper — reflects the request origin if it is in the allow-list
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://brainsait.org',
  };
}

let eventSchemaReady = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    const cors = (r: Response) => withCors(r, request);
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return cors(Response.json({ status: 'ok', service: 'event-bridge', timestamp: new Date().toISOString() }));
    }

    if (url.pathname === '/webhooks/github' && request.method === 'POST') {
      return cors(await handleGitHubWebhook(request, env));
    }

    if (url.pathname === '/api/v1/events' && request.method === 'POST') {
      return cors(await handleGenericEvent(request, env));
    }

    if (url.pathname === '/api/v1/github/automation' && request.method === 'POST') {
      return cors(await handlePortalAutomation(request, env));
    }

    if (url.pathname.startsWith('/api/v1/events/') && request.method === 'GET') {
      const eventId = url.pathname.split('/').pop()!;
      const event = await env.EVENT_LOG.get(eventId);
      if (!event) return cors(Response.json({ error: 'Not found' }, { status: 404 }));
      return cors(Response.json(JSON.parse(event)));
    }

    return cors(Response.json({ error: 'Not found' }, { status: 404 }));
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const event = message.body as Record<string, unknown>;
        await processEvent(event, env);
        message.ack();
      } catch {
        // Cap retries at 3 to prevent infinite retry loops
        if ((message as unknown as { attempts: number }).attempts >= 3) {
          message.ack(); // Dead-letter — acknowledge to drop after max retries
        } else {
          message.retry();
        }
      }
    }
  },
};

async function handleGitHubWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-hub-signature-256');
  const eventType = request.headers.get('x-github-event');
  const deliveryId = request.headers.get('x-github-delivery');

  if (!signature || !eventType || !deliveryId) {
    return Response.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  const secret = await env.WEBHOOK_SECRETS.get('github-webhook-secret');
  if (secret) {
    const body = await request.clone().arrayBuffer();
    const isValid = await verifySignature(signature, body, secret);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const payload = await request.json<GitHubWebhookEvent>();

  const event = {
    id: deliveryId,
    type: eventType,
    action: payload.action,
    source: 'github',
    repo: payload.repository?.full_name,
    sender: payload.sender?.login,
    timestamp: new Date().toISOString(),
    payload,
  };

  await env.EVENT_LOG.put(deliveryId, JSON.stringify(event), { expirationTtl: 604800 });

  switch (eventType) {
    case 'push':
    case 'pull_request':
    case 'release':
    case 'workflow_run':
      await env.PIPELINE_EVENTS.send(event);
      break;
    case 'issues':
    case 'issue_comment':
    case 'project_card':
      await env.GITHUB_EVENTS.send(event);
      break;
    default:
      await env.GITHUB_EVENTS.send(event);
  }

  await env.NOTIFICATION_QUEUE.send({
    type: `github.${eventType}.${payload.action || 'received'}`,
    source: 'event-bridge',
    data: event,
  });

  env.EVENT_ANALYTICS.writeDataPoint({
    blobs: [eventType, payload.repository?.full_name || 'unknown', payload.sender?.login || 'unknown'],
    doubles: [Date.now()],
    indexes: [deliveryId],
  });

  return Response.json({ status: 'queued', deliveryId });
}

async function handleGenericEvent(request: Request, env: Env): Promise<Response> {
  // Enforce max payload size (1 MB)
  const contentLength = parseInt(request.headers.get('Content-Length') || '0');
  if (contentLength > 1_048_576) {
    return Response.json({ error: 'Payload too large' }, { status: 413 });
  }

  const event = await request.json<Record<string, unknown>>();
  const eventId = crypto.randomUUID();

  // Validate required fields
  if (!event.type || typeof event.type !== 'string') {
    return Response.json({ error: 'Event type required' }, { status: 400 });
  }

  const normalized = {
    id: eventId,
    ...event,
    timestamp: new Date().toISOString(),
  };

  await env.EVENT_LOG.put(eventId, JSON.stringify(normalized), { expirationTtl: 604800 });
  await env.GITHUB_EVENTS.send(normalized);

  return Response.json({ status: 'queued', eventId });
}

async function processEvent(event: Record<string, unknown>, env: Env): Promise<void> {
  await ensureEventSchema(env);

  await env.DB.prepare(
    'INSERT INTO events (id, type, source, repo, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(
      typeof event.id === 'string' ? event.id : crypto.randomUUID(),
      typeof event.type === 'string' ? event.type : 'unknown',
      typeof event.source === 'string' ? event.source : 'unknown',
      typeof event.repo === 'string' ? event.repo : '',
      JSON.stringify(event.payload ?? event),
      typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString(),
    )
    .run();
}

async function handlePortalAutomation(request: Request, env: Env): Promise<Response> {
  const body = await request.json<Record<string, unknown>>();

  const eventType = body.type;
  const startup = body.startup;
  if (typeof eventType !== 'string' || !eventType) {
    return Response.json({ error: 'Missing required field: type' }, { status: 400 });
  }
  if (typeof startup !== 'string' || !startup) {
    return Response.json({ error: 'Missing required field: startup' }, { status: 400 });
  }

  const safePayload: Record<string, unknown> = {
    type: eventType,
    startup,
    source: 'incubator-portal',
    ...(typeof body.repo === 'string' ? { repo: body.repo } : {}),
    ...(typeof body.action === 'string' ? { action: body.action } : {}),
    ...(body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)
      ? { meta: body.meta }
      : {}),
  };

  const eventId = crypto.randomUUID();
  const event = {
    id: eventId,
    type: `portal.automation.${eventType}`,
    source: 'incubator-portal',
    timestamp: new Date().toISOString(),
    payload: safePayload,
  };

  await env.EVENT_LOG.put(eventId, JSON.stringify(event), { expirationTtl: 604800 });
  await env.PIPELINE_EVENTS.send(event);

  env.EVENT_ANALYTICS.writeDataPoint({
    blobs: [eventType, 'portal', startup],
    doubles: [Date.now()],
    indexes: [eventId],
  });

  return Response.json({ status: 'queued', eventId });
}

async function verifySignature(signature: string, body: ArrayBuffer, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, body);
  const hash = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return signature === `sha256=${hash}`;
}

async function ensureEventSchema(env: Env): Promise<void> {
  if (eventSchemaReady) {
    return;
  }

  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      source TEXT NOT NULL,
      repo TEXT,
      payload TEXT,
      created_at TEXT NOT NULL
    );
  `);

  eventSchemaReady = true;
}

function withCors(response: Response, request?: Request): Response {
  const headers = new Headers(response.headers);
  const origin = request ? getCorsHeaders(request) : corsHeaders;
  for (const [key, value] of Object.entries(origin)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
