import {
  incubatorChatMessages as seedChatMessages,
  incubatorChatRooms as seedChatRooms,
  incubatorEmailAutomations as seedEmailAutomations,
  type CollaborationMessage as ChatMessage,
  type CollaborationRoom as ChatRoom,
  type EmailAutomationConfig as EmailAutomation,
} from '../../../packages/brainsait-shared/src/constants/incubator';

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
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  channels?: string[];
}

interface ChannelConfig {
  type: string;
  target: string;
  filters: string[];
  enabled: boolean;
}

interface NotificationHistoryItem {
  id: string;
  channel: string;
  subject: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const ALLOWED_ORIGINS = new Set([
  'https://brainsait.org',
  'https://partners.brainsait.org',
  'https://incubator.brainsait.org',
  'https://portal.elfadil.com',
  'http://localhost:3000',
  'http://localhost:3001',
]);

function buildCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://brainsait.org',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hub-signature-256, x-github-event, x-github-delivery',
  };
}

const corsHeaders = buildCorsHeaders({ headers: new Headers({ Origin: 'https://brainsait.org' }) } as Request);

let notificationSchemaReady = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
    }

    const cors = (r: Response) => withCors(r, request);
    const url = new URL(request.url);

    if (url.pathname === '/ws' || url.pathname.startsWith('/ws/')) {
      return handleWebSocket(request, env, url);
    }

    let response: Response;

    if (url.pathname === '/health') {
      response = Response.json({ status: 'ok', service: 'notification-router' });
      return cors(response);
    }

    if (url.pathname.startsWith('/api/v1/channels/') && request.method === 'PUT') {
      const startup = url.pathname.split('/')[4];
      const config = await request.text();
      await env.CHANNEL_CONFIG.put(`channels:${startup}`, config);
      response = Response.json({ status: 'configured', startup });
      return cors(response);
    }

    if (url.pathname.startsWith('/api/v1/channels/') && request.method === 'GET') {
      const startup = url.pathname.split('/')[4];
      const config = await env.CHANNEL_CONFIG.get(`channels:${startup}`);
      response = Response.json(JSON.parse(config || '[]'));
      return cors(response);
    }

    if (url.pathname === '/api/v1/send' && request.method === 'POST') {
      const cl = parseInt(request.headers.get('Content-Length') || '0');
      if (cl > 524_288) { // 512 KB max
        response = Response.json({ error: 'Payload too large' }, { status: 413 });
        return cors(response);
      }
      const event = await request.json<NotificationEvent>();
      if (!event.type || typeof event.type !== 'string' || event.type.length > 100) {
        response = Response.json({ error: 'Invalid event: type must be a string ≤100 chars' }, { status: 400 });
        return cors(response);
      }
      await routeNotification(event, env);
      response = Response.json({ status: 'sent' });
      return cors(response);
    }

    if (url.pathname === '/api/v1/broadcast' && request.method === 'POST') {
      const cl = parseInt(request.headers.get('Content-Length') || '0');
      if (cl > 524_288) {
        response = Response.json({ error: 'Payload too large' }, { status: 413 });
        return cors(response);
      }
      const event = await request.json<NotificationEvent>();
      const list = await env.CHANNEL_CONFIG.list({ prefix: 'channels:' });
      for (const key of list.keys) {
        const startup = key.name.replace('channels:', '');
        await routeNotification({ ...event, target: startup }, env);
      }
      response = Response.json({ status: 'broadcast', targets: list.keys.length });
      return cors(response);
    }

    if (url.pathname === '/api/v1/chat/rooms' && request.method === 'GET') {
      response = await listChatRooms(env);
      return cors(response);
    }

    if (url.pathname.startsWith('/api/v1/chat/rooms/') && url.pathname.endsWith('/messages') && request.method === 'GET') {
      const roomId = url.pathname.split('/')[5];
      response = await listChatMessages(roomId, env);
      return cors(response);
    }

    if (url.pathname.startsWith('/api/v1/chat/rooms/') && url.pathname.endsWith('/messages') && request.method === 'POST') {
      const roomId = url.pathname.split('/')[5];
      response = await createChatMessage(roomId, request, env);
      return cors(response);
    }

    if (url.pathname === '/api/v1/email/automations' && request.method === 'GET') {
      response = await listEmailAutomations(env);
      return cors(response);
    }

    if (url.pathname === '/api/v1/email/automations' && request.method === 'POST') {
      response = await createEmailAutomation(request, env);
      return cors(response);
    }

    if (url.pathname.startsWith('/api/v1/email/automations/') && url.pathname.endsWith('/trigger') && request.method === 'POST') {
      const automationId = url.pathname.split('/')[5];
      response = await triggerEmailAutomation(automationId, request, env);
      return cors(response);
    }

    if (url.pathname === '/api/v1/history' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      response = await listNotificationHistory(limit, env);
      return cors(response);
    }

    return cors(Response.json({ error: 'Not found' }, { status: 404 }));
  },

  async queue(batch: MessageBatch<NotificationEvent>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      try {
        await routeNotification(msg.body, env);
        msg.ack();
      } catch {
        if (msg.attempts < 3) {
          await env.RETRY_QUEUE.send(msg.body);
        }
        msg.retry();
      }
    }
  },
};

async function listChatRooms(env: Env): Promise<Response> {
  const storedRooms = await listJsonByPrefix<ChatRoom>(env.CHANNEL_CONFIG, 'chat-room:');
  const merged = mergeById(seedChatRooms, storedRooms).sort((left, right) => left.name.localeCompare(right.name));
  return Response.json(merged);
}

async function listChatMessages(roomId: string, env: Env): Promise<Response> {
  await ensureNotificationSchema(env);

  const seed = seedChatMessages.filter((message) => message.roomId === roomId);
  const result = await env.DB.prepare(
    `SELECT id, room_id, sender_id, sender_name, direction, message, created_at, attachment_name, attachment_url
       FROM chat_messages
      WHERE room_id = ?
      ORDER BY created_at ASC`
  ).bind(roomId).all();

  const stored = (result.results as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    roomId: String(row.room_id),
    senderId: String(row.sender_id),
    senderName: String(row.sender_name),
    direction: row.direction === 'incoming' ? 'incoming' : 'outgoing',
    message: String(row.message),
    createdAt: String(row.created_at),
    attachmentName: row.attachment_name ? String(row.attachment_name) : undefined,
    attachmentUrl: row.attachment_url ? String(row.attachment_url) : undefined,
  })) as ChatMessage[];

  return Response.json(sortByCreatedAtAsc(mergeById(seed, stored)));
}

async function createChatMessage(roomId: string, request: Request, env: Env): Promise<Response> {
  await ensureNotificationSchema(env);

  const body = await request.json<Record<string, unknown>>();
  const messageText = typeof body.message === 'string' ? body.message.trim() : '';
  if (!messageText) {
    return Response.json({ error: 'Missing message' }, { status: 400 });
  }

  const senderId = typeof body.senderId === 'string' ? body.senderId : 'current-user';
  const created: ChatMessage = {
    id: `message-${crypto.randomUUID()}`,
    roomId,
    senderId,
    senderName: typeof body.senderName === 'string' ? body.senderName : 'You',
    direction: senderId === 'current-user' ? 'outgoing' : 'incoming',
    message: messageText,
    createdAt: new Date().toISOString(),
  };

  await env.DB.prepare(
    `INSERT INTO chat_messages (id, room_id, sender_id, sender_name, direction, message, created_at, attachment_name, attachment_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    created.id,
    created.roomId,
    created.senderId,
    created.senderName,
    created.direction,
    created.message,
    created.createdAt,
    created.attachmentName || null,
    created.attachmentUrl || null,
  ).run();

  await env.NOTIFICATION_LOG.put(`chat-message:${roomId}:${created.id}`, JSON.stringify(created), { expirationTtl: 604800 });
  await persistHistory(env, {
    id: `history-${created.id}`,
    channel: 'chat',
    subject: `Message in ${roomId}`,
    status: 'delivered',
    createdAt: created.createdAt,
    metadata: {
      roomId,
      senderName: created.senderName,
    },
  });
  await broadcastWS({ type: 'chat.message', payload: created }, env, roomId);

  return Response.json(created, { status: 201 });
}

async function listEmailAutomations(env: Env): Promise<Response> {
  await ensureNotificationSchema(env);

  const result = await env.DB.prepare(
    `SELECT id, name, trigger_event, subject, recipients_json, template_preview, enabled, last_triggered_at, created_at
       FROM email_automations
      ORDER BY created_at DESC`
  ).all();

  const stored = (result.results as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    triggerEvent: String(row.trigger_event),
    subject: String(row.subject),
    recipients: JSON.parse(String(row.recipients_json)) as string[],
    templatePreview: String(row.template_preview),
    enabled: Boolean(row.enabled),
    lastTriggeredAt: row.last_triggered_at ? String(row.last_triggered_at) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  })) as EmailAutomation[];

  const kvStored = await listJsonByPrefix<EmailAutomation>(env.CHANNEL_CONFIG, 'email-automation:');
  return Response.json(sortByCreatedAtDesc(mergeById(seedEmailAutomations, [...stored, ...kvStored])));
}

async function createEmailAutomation(request: Request, env: Env): Promise<Response> {
  await ensureNotificationSchema(env);

  const body = await request.json<Record<string, unknown>>();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const triggerEvent = typeof body.triggerEvent === 'string' ? body.triggerEvent.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const templatePreview = typeof body.templatePreview === 'string' ? body.templatePreview.trim() : '';
  const recipients = Array.isArray(body.recipients)
    ? body.recipients.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim())
    : [];

  if (!name || !triggerEvent || !subject || !templatePreview || recipients.length === 0) {
    return Response.json({ error: 'name, triggerEvent, subject, templatePreview, and recipients are required' }, { status: 400 });
  }

  const automation: EmailAutomation = {
    id: `automation-${crypto.randomUUID()}`,
    name,
    triggerEvent,
    subject,
    recipients,
    templatePreview,
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  await env.DB.prepare(
    `INSERT INTO email_automations (id, name, trigger_event, subject, recipients_json, template_preview, enabled, last_triggered_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    automation.id,
    automation.name,
    automation.triggerEvent,
    automation.subject,
    JSON.stringify(automation.recipients),
    automation.templatePreview,
    automation.enabled ? 1 : 0,
    automation.lastTriggeredAt || null,
    automation.createdAt,
  ).run();

  await env.CHANNEL_CONFIG.put(`email-automation:${automation.id}`, JSON.stringify(automation));

  return Response.json(automation, { status: 201 });
}

async function triggerEmailAutomation(automationId: string, request: Request, env: Env): Promise<Response> {
  await ensureNotificationSchema(env);

  const payload = await request.json<Record<string, unknown>>();
  const automation = await getAutomationById(automationId, env);
  if (!automation) {
    return Response.json({ error: 'Automation not found' }, { status: 404 });
  }

  const triggeredAt = new Date().toISOString();
  await env.DB.prepare('UPDATE email_automations SET last_triggered_at = ? WHERE id = ?').bind(triggeredAt, automationId).run();

  const historyItem: NotificationHistoryItem = {
    id: `history-${crypto.randomUUID()}`,
    channel: 'email',
    subject: automation.subject,
    status: 'queued',
    createdAt: triggeredAt,
    metadata: {
      automationId,
      triggerEvent: automation.triggerEvent,
      payload,
    },
  };

  await persistHistory(env, historyItem);
  await broadcastWS({ type: 'email.automation.triggered', payload: historyItem }, env, typeof payload.roomId === 'string' ? payload.roomId : 'global');

  return Response.json({ status: 'queued', id: historyItem.id });
}

async function listNotificationHistory(limit: number, env: Env): Promise<Response> {
  await ensureNotificationSchema(env);

  const dbRows = await env.DB.prepare(
    `SELECT id, channel, subject, status, created_at, metadata_json
       FROM notification_history
      ORDER BY created_at DESC
      LIMIT ?`
  ).bind(limit).all();

  const dbHistory = (dbRows.results as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    channel: String(row.channel),
    subject: String(row.subject),
    status: String(row.status),
    createdAt: String(row.created_at),
    metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) as Record<string, unknown> : undefined,
  })) as NotificationHistoryItem[];

  const kvList = await env.NOTIFICATION_LOG.list({ limit: limit * 3 });
  const kvHistory: NotificationHistoryItem[] = [];
  for (const key of kvList.keys) {
    const raw = await env.NOTIFICATION_LOG.get(key.name);
    if (!raw) {
      continue;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized = normalizeHistoryRecord(parsed);
      if (normalized) {
        kvHistory.push(normalized);
      }
    } catch {
      continue;
    }
  }

  const merged = sortByCreatedAtDesc(mergeById(dbHistory, kvHistory)).slice(0, limit);
  return Response.json(merged);
}

async function routeNotification(event: NotificationEvent, env: Env): Promise<void> {
  const target = event.target || event.source;
  const configStr = await env.CHANNEL_CONFIG.get(`channels:${target}`);
  const config = configStr ? JSON.parse(configStr) as ChannelConfig[] : [];
  const channels = event.channels || config.filter((channel) => channel.enabled && matchesFilter(event.type, channel.filters)).map((channel) => channel.type);
  const payload = event.data && Object.keys(event.data).length > 0 ? event.data : event.payload || {};

  const notificationId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const record: Record<string, unknown> = {
    id: notificationId,
    ...event,
    timestamp,
    createdAt: timestamp,
    status: channels.length > 0 ? 'processing' : 'skipped',
  };

  for (const channelType of channels) {
    const channel = config.find((item) => item.type === channelType);
    if (!channel && channelType !== 'websocket') {
      continue;
    }

    try {
      switch (channelType) {
        case 'slack':
          if (channel) {
            await sendSlack(channel.target, event, payload);
          }
          break;
        case 'discord':
          if (channel) {
            await sendDiscord(channel.target, event, payload);
          }
          break;
        case 'websocket':
          await broadcastWS({ type: event.type, payload }, env);
          break;
        case 'email':
          await persistHistory(env, {
            id: `history-${notificationId}`,
            channel: 'email',
            subject: event.type,
            status: 'queued',
            createdAt: timestamp,
            metadata: payload,
          });
          break;
        case 'webhook':
          if (channel) {
            await fetch(channel.target, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event),
            });
          }
          break;
      }
      record.status = 'delivered';
    } catch (error) {
      record.status = 'failed';
      record.error = (error as Error).message;
    }
  }

  await env.NOTIFICATION_LOG.put(notificationId, JSON.stringify(record), { expirationTtl: 604800 });
  await persistHistory(env, {
    id: `history-${notificationId}`,
    channel: channels[0] || 'notification',
    subject: event.type,
    status: String(record.status),
    createdAt: timestamp,
    metadata: {
      source: event.source,
      target,
      payload,
    },
  });
}

async function sendSlack(webhookUrl: string, event: NotificationEvent, payload: Record<string, unknown>): Promise<void> {
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
            text: `${emoji} *${event.type}*\nSource: ${event.source}\n\`\`\`${JSON.stringify(payload, null, 2).substring(0, 2000)}\`\`\``,
          },
        },
      ],
    }),
  });
}

async function sendDiscord(webhookUrl: string, event: NotificationEvent, payload: Record<string, unknown>): Promise<void> {
  const color = event.type.includes('success') ? 0x00cc00 : event.type.includes('fail') ? 0xff0000 : 0x0052cc;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: event.type,
        description: `Source: ${event.source}`,
        color,
        fields: Object.entries(payload).slice(0, 10).map(([key, value]) => ({
          name: key,
          value: String(value).substring(0, 100),
          inline: true,
        })),
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}

async function broadcastWS(event: unknown, env: Env, roomId = 'global'): Promise<void> {
  const id = env.WS_SESSIONS.idFromName(roomId);
  const stub = env.WS_SESSIONS.get(id);
  await stub.fetch('https://internal/broadcast', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

async function handleWebSocket(request: Request, env: Env, url: URL): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return withCors(Response.json({ error: 'Expected WebSocket' }, { status: 400 }));
  }

  const roomId = url.pathname === '/ws' ? 'global' : decodeURIComponent(url.pathname.split('/').pop() || 'global');
  const id = env.WS_SESSIONS.idFromName(roomId);
  const stub = env.WS_SESSIONS.get(id);
  return stub.fetch(request);
}

function matchesFilter(eventType: string, filters: string[]): boolean {
  if (filters.includes('*')) {
    return true;
  }
  return filters.some((filter) => eventType.includes(filter));
}

async function ensureNotificationSchema(env: Env): Promise<void> {
  if (notificationSchemaReady) {
    return;
  }

  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      direction TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      attachment_name TEXT,
      attachment_url TEXT
    );

    CREATE TABLE IF NOT EXISTS email_automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger_event TEXT NOT NULL,
      subject TEXT NOT NULL,
      recipients_json TEXT NOT NULL,
      template_preview TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_triggered_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_history (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      metadata_json TEXT
    );
  `);

  notificationSchemaReady = true;
}

async function getAutomationById(id: string, env: Env): Promise<EmailAutomation | undefined> {
  await ensureNotificationSchema(env);

  const dbRow = await env.DB.prepare(
    `SELECT id, name, trigger_event, subject, recipients_json, template_preview, enabled, last_triggered_at, created_at
       FROM email_automations
      WHERE id = ?`
  ).bind(id).first<Record<string, unknown>>();

  if (dbRow) {
    return {
      id: String(dbRow.id),
      name: String(dbRow.name),
      triggerEvent: String(dbRow.trigger_event),
      subject: String(dbRow.subject),
      recipients: JSON.parse(String(dbRow.recipients_json)) as string[],
      templatePreview: String(dbRow.template_preview),
      enabled: Boolean(dbRow.enabled),
      lastTriggeredAt: dbRow.last_triggered_at ? String(dbRow.last_triggered_at) : undefined,
      createdAt: dbRow.created_at ? String(dbRow.created_at) : undefined,
    };
  }

  const stored = await env.CHANNEL_CONFIG.get(`email-automation:${id}`);
  if (stored) {
    return JSON.parse(stored) as EmailAutomation;
  }

  return seedEmailAutomations.find((automation) => automation.id === id);
}

async function persistHistory(env: Env, item: NotificationHistoryItem): Promise<void> {
  await ensureNotificationSchema(env);

  await env.DB.prepare(
    `INSERT OR REPLACE INTO notification_history (id, channel, subject, status, created_at, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    item.id,
    item.channel,
    item.subject,
    item.status,
    item.createdAt,
    item.metadata ? JSON.stringify(item.metadata) : null,
  ).run();

  await env.NOTIFICATION_LOG.put(`history:${item.id}`, JSON.stringify(item), { expirationTtl: 604800 });
}

async function listJsonByPrefix<T>(namespace: KVNamespace, prefix: string): Promise<T[]> {
  const list = await namespace.list({ prefix, limit: 200 });
  const items: T[] = [];
  for (const key of list.keys) {
    const raw = await namespace.get(key.name);
    if (!raw) {
      continue;
    }
    try {
      items.push(JSON.parse(raw) as T);
    } catch {
      continue;
    }
  }
  return items;
}

function mergeById<T extends { id: string }>(...groups: T[][]): T[] {
  const merged = new Map<string, T>();
  for (const group of groups) {
    for (const item of group) {
      merged.set(item.id, item);
    }
  }
  return Array.from(merged.values());
}

function sortByCreatedAtAsc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => (left.createdAt || '').localeCompare(right.createdAt || ''));
}

function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''));
}

function normalizeHistoryRecord(record: Record<string, unknown>): NotificationHistoryItem | null {
  if (typeof record.id !== 'string') {
    return null;
  }

  if (typeof record.channel === 'string' && typeof record.subject === 'string' && typeof record.status === 'string') {
    return {
      id: record.id,
      channel: record.channel,
      subject: record.subject,
      status: record.status,
      createdAt: typeof record.createdAt === 'string'
        ? record.createdAt
        : typeof record.timestamp === 'string'
          ? record.timestamp
          : new Date().toISOString(),
      metadata: record.metadata && typeof record.metadata === 'object' ? record.metadata as Record<string, unknown> : undefined,
    };
  }

  if (typeof record.type === 'string' && typeof record.status === 'string') {
    return {
      id: record.id,
      channel: 'notification',
      subject: record.type,
      status: record.status,
      createdAt: typeof record.timestamp === 'string' ? record.timestamp : new Date().toISOString(),
      metadata: record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : undefined,
    };
  }

  return null;
}

function withCors(response: Response, request?: Request): Response {
  const headers = new Headers(response.headers);
  const origin = request ? buildCorsHeaders(request) : corsHeaders;
  for (const [key, value] of Object.entries(origin)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
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
      const message = JSON.stringify(event);
      for (const session of this.sessions) {
        session.send(message);
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
