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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'event-bridge', timestamp: new Date().toISOString() });
    }

    // GitHub webhook endpoint
    if (url.pathname === '/webhooks/github' && request.method === 'POST') {
      return handleGitHubWebhook(request, env);
    }

    // Generic event ingestion
    if (url.pathname === '/api/v1/events' && request.method === 'POST') {
      return handleGenericEvent(request, env);
    }

    // Event query
    if (url.pathname.startsWith('/api/v1/events/') && request.method === 'GET') {
      const eventId = url.pathname.split('/').pop()!;
      const event = await env.EVENT_LOG.get(eventId);
      if (!event) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json(JSON.parse(event));
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },

  // Queue consumer for processing events
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const event = message.body as Record<string, string>;
        await processEvent(event, env);
        message.ack();
      } catch (err) {
        message.retry();
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

  // Verify signature
  const secret = await env.WEBHOOK_SECRETS.get('github-webhook-secret');
  if (secret) {
    const body = await request.clone().arrayBuffer();
    const isValid = await verifySignature(signature, body, secret);
    if (!isValid) {
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const payload = await request.json<GitHubWebhookEvent>();

  // Build normalized event
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

  // Store in KV (7-day TTL)
  await env.EVENT_LOG.put(deliveryId, JSON.stringify(event), { expirationTtl: 604800 });

  // Route to appropriate queue
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

  // Always notify
  await env.NOTIFICATION_QUEUE.send({
    type: `github.${eventType}.${payload.action || 'received'}`,
    source: 'event-bridge',
    data: event,
  });

  // Analytics
  env.EVENT_ANALYTICS.writeDataPoint({
    blobs: [eventType, payload.repository?.full_name || 'unknown', payload.sender?.login || 'unknown'],
    doubles: [Date.now()],
    indexes: [deliveryId],
  });

  return Response.json({ status: 'queued', deliveryId });
}

async function handleGenericEvent(request: Request, env: Env): Promise<Response> {
  const event = await request.json<Record<string, string>>();
  const eventId = crypto.randomUUID();

  const normalized = {
    id: eventId,
    ...event,
    timestamp: new Date().toISOString(),
  };

  await env.EVENT_LOG.put(eventId, JSON.stringify(normalized), { expirationTtl: 604800 });
  await env.GITHUB_EVENTS.send(normalized);

  return Response.json({ status: 'queued', eventId });
}

async function processEvent(event: Record<string, string>, env: Env): Promise<void> {
  // Store in D1 for querying
  await env.DB.prepare(
    'INSERT INTO events (id, type, source, repo, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(event.id, event.type, event.source, event.repo || '', JSON.stringify(event.payload), event.timestamp)
    .run();
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
