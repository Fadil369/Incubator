/**
 * BrainSAIT Durable Objects
 * Rate Limiter, Chat Room, AI Usage Tracker, Session Manager
 */

// ═══════════════════════════════════════════════════════════
// Rate Limiter — Per-IP, per-startup rate limiting
// ═══════════════════════════════════════════════════════════
export class RateLimiter {
  private state: DurableObjectState;
  private requests: Map<string, number[]>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.requests = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const { key, limit = 60, windowMs = 60000 } = await request.json() as { key: string; limit?: number; windowMs?: number };

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or initialize request timestamps
    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      return Response.json({
        allowed: false,
        remaining: 0,
        retryAfter,
        limit,
      }, { status: 429 });
    }

    timestamps.push(now);
    this.requests.set(key, timestamps);

    return Response.json({
      allowed: true,
      remaining: limit - timestamps.length,
      limit,
      resetAt: new Date(now + windowMs).toISOString(),
    });
  }
}

// ═══════════════════════════════════════════════════════════
// Chat Room — Real-time WebSocket chat for startup teams
// ═══════════════════════════════════════════════════════════
export class ChatRoom {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, { user: string; startup: string }>;
  private messages: Array<{ user: string; text: string; timestamp: string }>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
    this.messages = [];
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      await this.handleSession(pair[1], request);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // REST: Get messages
    if (url.pathname === '/messages') {
      return Response.json(this.messages.slice(-100));
    }

    // REST: Get participants
    if (url.pathname === '/participants') {
      const participants = Array.from(this.sessions.values());
      return Response.json(participants);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  private async handleSession(ws: WebSocket, request: Request): Promise<void> {
    ws.accept();
    const url = new URL(request.url);
    const user = url.searchParams.get('user') || 'anonymous';
    const startup = url.searchParams.get('startup') || 'unknown';

    this.sessions.set(ws, { user, startup });

    // Send message history
    ws.send(JSON.stringify({ type: 'history', messages: this.messages.slice(-50) }));

    // Broadcast join
    this.broadcast({ type: 'join', user, startup, timestamp: new Date().toISOString() }, ws);

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data as string);
      if (data.type === 'message') {
        const msg = { user, text: data.text, startup, timestamp: new Date().toISOString() };
        this.messages.push(msg);
        if (this.messages.length > 1000) this.messages = this.messages.slice(-500);
        this.broadcast({ type: 'message', ...msg });
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
      this.broadcast({ type: 'leave', user, startup, timestamp: new Date().toISOString() });
    });
  }

  private broadcast(message: Record<string, unknown>, exclude?: WebSocket): void {
    const msg = JSON.stringify(message);
    for (const [ws] of this.sessions) {
      if (ws !== exclude) {
        try { ws.send(msg); } catch { this.sessions.delete(ws); }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// AI Usage Tracker — Per-startup AI usage accounting
// ═══════════════════════════════════════════════════════════
export class AIUsageTracker {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const body = await request.json() as { startup?: string; model?: string; tokens?: number; action?: string };

    if (body.action === 'record') {
      const key = `usage:${body.startup}:${new Date().toISOString().slice(0, 7)}`;
      const current = (await this.state.storage.get<number>(key)) || 0;
      await this.state.storage.put(key, current + (body.tokens || 0));
      return Response.json({ recorded: true, total: current + (body.tokens || 0) });
    }

    if (body.action === 'query') {
      const key = `usage:${body.startup}:${new Date().toISOString().slice(0, 7)}`;
      const total = (await this.state.storage.get<number>(key)) || 0;
      return Response.json({ startup: body.startup, month: new Date().toISOString().slice(0, 7), total_tokens: total });
    }

    if (body.action === 'reset') {
      await this.state.storage.deleteAll();
      return Response.json({ reset: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  }
}

// ═══════════════════════════════════════════════════════════
// Session Manager — Persistent session storage
// ═══════════════════════════════════════════════════════════
export class SessionManager {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('id');

    if (request.method === 'GET' && sessionId) {
      const session = await this.state.storage.get(sessionId);
      if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });
      return Response.json(session);
    }

    if (request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      const id = (body.id as string) || crypto.randomUUID();
      await this.state.storage.put(id, { ...body, updatedAt: new Date().toISOString() });
      return Response.json({ id, status: 'created' });
    }

    if (request.method === 'DELETE' && sessionId) {
      await this.state.storage.delete(sessionId);
      return Response.json({ status: 'deleted' });
    }

    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
