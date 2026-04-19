/**
 * BrainSAIT Notification Router
 * Routes events to Slack, Discord, Email, WebSocket
 */
export interface Env {
  CHANNEL_CONFIG: KVNamespace;
  NOTIFICATION_LOG: KVNamespace;
  DB: D1Database;
  RETRY_QUEUE: Queue;
  WS_SESSIONS: DurableObjectNamespace;
}

interface NotificationEvent {
  type: string;
  source: string;
  target?: string;
  data: Record<string, unknown>;
  channels?: string[];
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'notification-router' });
    }

    // Configure channels for a startup
    if (url.pathname.startsWith('/api/v1/channels/') && request.method === 'PUT') {
      const startup = url.pathname.split('/')[3];
      const config = await request.text();
      await env.CHANNEL_CONFIG.put(`channels:${startup}`, config);
      return Response.json({ status: 'configured', startup });
    }

    // Get channel config
    if (url.pathname.startsWith('/api/v1/channels/') && request.method === 'GET') {
      const startup = url.pathname.split('/')[3];
      const config = await env.CHANNEL_CONFIG.get(`channels:${startup}`);
      return Response.json(JSON.parse(config || '[]'));
    }

    // Send notification directly
    if (url.pathname === '/api/v1/send' && request.method === 'POST') {
      const event = await request.json<NotificationEvent>();
      await routeNotification(event, env);
      return Response.json({ status: 'sent' });
    }

    // Broadcast to all
    if (url.pathname === '/api/v1/broadcast' && request.method === 'POST') {
      const event = await request.json<NotificationEvent>();
      const list = await env.CHANNEL_CONFIG.list();
      for (const key of list.keys) {
        const startup = key.name.replace('channels:', '');
        await routeNotification({ ...event, target: startup }, env);
      }
      return Response.json({ status: 'broadcast', targets: list.keys.length });
    }

    // WebSocket upgrade for real-time
    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return Response.json({ error: 'Expected WebSocket' }, { status: 400 });
      }
      const id = env.WS_SESSIONS.idFromName('global');
      const stub = env.WS_SESSIONS.get(id);
      return stub.fetch(request);
    }

    // Notification history
    if (url.pathname === '/api/v1/history' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const list = await env.NOTIFICATION_LOG.list({ limit });
      const items = [];
      for (const key of list.keys) {
        const data = await env.NOTIFICATION_LOG.get(key.name);
        if (data) items.push(JSON.parse(data));
      }
      return Response.json(items);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },

  async queue(batch: MessageBatch<NotificationEvent>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await routeNotification(msg.body, env);
        msg.ack();
      } catch (err) {
        if (msg.attempts < 3) {
          await env.RETRY_QUEUE.send(msg.body);
        }
        msg.retry();
      }
    }
  },
};

async function routeNotification(event: NotificationEvent, env: Env): Promise<void> {
  const target = event.target || event.source;
  const configStr = await env.CHANNEL_CONFIG.get(`channels:${target}`);
  const config = configStr ? JSON.parse(configStr) as Array<{ type: string; target: string; filters: string[]; enabled: boolean }> : [];

  // Default channels for the event
  const channels = event.channels || config.filter((c) => c.enabled && matchesFilter(event.type, c.filters)).map((c) => c.type);

  const notificationId = crypto.randomUUID();
  const record = { id: notificationId, ...event, timestamp: new Date().toISOString(), status: 'processing' };

  // Dispatch to each channel
  for (const channelType of channels) {
    const channel = config.find((c) => c.type === channelType);
    if (!channel) continue;

    try {
      switch (channelType) {
        case 'slack':
          await sendSlack(channel.target, event);
          break;
        case 'discord':
          await sendDiscord(channel.target, event);
          break;
        case 'websocket':
          await broadcastWS(event, env);
          break;
        case 'email':
          // Email via external service
          break;
        case 'webhook':
          await fetch(channel.target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          });
          break;
      }
      record.status = 'delivered';
    } catch (err) {
      record.status = 'failed';
      record.error = (err as Error).message;
    }
  }

  await env.NOTIFICATION_LOG.put(notificationId, JSON.stringify(record), { expirationTtl: 604800 });
}

async function sendSlack(webhookUrl: string, event: NotificationEvent): Promise<void> {
  const emoji = event.type.includes('success') || event.type.includes('complete') ? '✅'
    : event.type.includes('fail') || event.type.includes('error') ? '❌'
    : event.type.includes('deploy') ? '🚀' : '📢';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${event.type}*\nSource: ${event.source}\n\`\`\`${JSON.stringify(event.data, null, 2).substring(0, 2000)}\`\`\``,
          },
        },
      ],
    }),
  });
}

async function sendDiscord(webhookUrl: string, event: NotificationEvent): Promise<void> {
  const color = event.type.includes('success') ? 0x00cc00 : event.type.includes('fail') ? 0xff0000 : 0x0052cc;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: event.type,
        description: `Source: ${event.source}`,
        color,
        fields: Object.entries(event.data || {}).slice(0, 10).map(([k, v]) => ({
          name: k,
          value: String(v).substring(0, 100),
          inline: true,
        })),
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}

async function broadcastWS(event: NotificationEvent, env: Env): Promise<void> {
  const id = env.WS_SESSIONS.idFromName('global');
  const stub = env.WS_SESSIONS.get(id);
  await stub.fetch('https://internal/broadcast', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

function matchesFilter(eventType: string, filters: string[]): boolean {
  if (filters.includes('*')) return true;
  return filters.some((f) => eventType.includes(f));
}

// Durable Object for WebSocket sessions
export class WebSocketSession {
  sessions: Set<WebSocket>;
  constructor(private state: DurableObjectState) {
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    if (request.url.endsWith('/broadcast')) {
      const event = await request.json();
      const msg = JSON.stringify(event);
      for (const ws of this.sessions) {
        ws.send(msg);
      }
      return Response.json({ broadcast: this.sessions.size });
    }

    const pair = new WebSocketPair();
    this.sessions.add(pair[1]);
    pair[1].accept();
    pair[1].addEventListener('close', () => this.sessions.delete(pair[1]));
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
}
