/**
 * BrainSAIT Communication Hub
 * Multi-channel notification & messaging service
 * Routes events from GitHub, Data Hub, and startups to Slack/Discord/Email/WebSocket
 */
import express from 'express';
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';
import { NatsConnection, connect, StringCodec } from 'nats';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

// Channel configs (from DB or env)
interface ChannelConfig {
  type: 'slack' | 'discord' | 'email' | 'webhook' | 'websocket';
  target: string;
  filters: string[];
  enabled: boolean;
}

// ── Redis for pub/sub & persistence ──
let redis: ReturnType<typeof createClient>;
let nats: NatsConnection;
const sc = StringCodec();

async function init() {
  redis = createClient({ url: REDIS_URL });
  await redis.connect();
  nats = await connect({ servers: NATS_URL });

  // Subscribe to NATS events
  const sub = nats.subscribe('incubator.>');
  for await (const msg of sub) {
    const event = JSON.parse(sc.decode(msg.data));
    await routeEvent(event);
  }
}

// ── Event Router ──
async function routeEvent(event: {
  type: string;
  source: string;
  data: Record<string, unknown>;
  channels?: string[];
}) {
  console.log(`[comm-hub] Routing event: ${event.type} from ${event.source}`);

  // Store event in Redis (7-day TTL)
  await redis.setEx(
    `event:${event.source}:${Date.now()}`,
    604800,
    JSON.stringify(event)
  );

  // Route to configured channels
  const channels = await getChannelsForEvent(event);
  for (const channel of channels) {
    try {
      await dispatchToChannel(channel, event);
    } catch (err) {
      console.error(`[comm-hub] Failed to dispatch to ${channel.type}:`, err);
    }
  }

  // WebSocket broadcast
  broadcastWS(event);
}

async function getChannelsForEvent(event: Record<string, unknown>): Promise<ChannelConfig[]> {
  const config = await redis.get(`channels:${event.source}`);
  return config ? JSON.parse(config) : [];
}

async function dispatchToChannel(channel: ChannelConfig, event: Record<string, unknown>) {
  switch (channel.type) {
    case 'slack':
      await fetch(channel.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSlackMessage(event)),
      });
      break;
    case 'discord':
      await fetch(channel.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDiscordMessage(event)),
      });
      break;
    case 'webhook':
      await fetch(channel.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      break;
    case 'websocket':
      // Handled by broadcastWS
      break;
  }
}

function buildSlackMessage(event: Record<string, unknown>) {
  const emoji = event.type === 'pipeline_success' ? '✅' : event.type === 'pipeline_failure' ? '❌' : '📢';
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${event.type}* — ${event.source}\n\`\`\`${JSON.stringify(event.data, null, 2)}\`\`\``,
        },
      },
    ],
  };
}

function buildDiscordMessage(event: Record<string, unknown>) {
  const color = event.type === 'pipeline_success' ? 0x00cc00 : event.type === 'pipeline_failure' ? 0xff0000 : 0x0052cc;
  return {
    embeds: [
      {
        title: `${event.type}`,
        description: `Source: ${event.source}`,
        color,
        fields: Object.entries(event.data || {}).map(([k, v]) => ({
          name: k,
          value: String(v).substring(0, 100),
          inline: true,
        })),
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ── WebSocket for real-time dashboard updates ──
const wss = new WebSocketServer({ port: 8080 });
const wsClients = new Set();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

function broadcastWS(event: Record<string, unknown>) {
  const msg = JSON.stringify(event);
  wsClients.forEach((client: any) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ── REST API ──

// Send event
app.post('/api/v1/events', async (req, res) => {
  const event = req.body;
  nats.publish(`incubator.${event.source}.${event.type}`, sc.encode(JSON.stringify(event)));
  res.json({ status: 'queued' });
});

// Notify specific startup
app.post('/api/v1/notify', async (req, res) => {
  const { startup, event, data } = req.body;
  nats.publish(`incubator.startups.${startup}`, sc.encode(JSON.stringify({ type: event, data })));
  res.json({ status: 'notified', startup });
});

// Broadcast to all startups
app.post('/api/v1/broadcast', async (req, res) => {
  nats.publish('incubator.broadcast', sc.encode(JSON.stringify(req.body)));
  res.json({ status: 'broadcast' });
});

// Configure channels for a startup
app.put('/api/v1/channels/:startup', async (req, res) => {
  await redis.set(`channels:${req.params.startup}`, JSON.stringify(req.body.channels));
  res.json({ status: 'configured', startup: req.params.startup });
});

// Get recent events
app.get('/api/v1/events', async (req, res) => {
  const keys = await redis.keys('event:*');
  const events = await Promise.all(
    keys.slice(-100).map((k) => redis.get(k))
  );
  res.json(events.filter(Boolean).map(JSON.parse));
});

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'comm-hub', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[comm-hub] Listening on port ${PORT}`);
  init().catch(console.error);
});
