import dataHubProxy from '../../../../workers/data-hub-proxy/src/index.ts';
import notificationRouter from '../../../../workers/notification-router/src/index.ts';

type StoredRow = Record<string, unknown>;

class MockKVNamespace {
  private readonly store = new Map<string, string>();

  async get(key: string, type?: 'text' | 'json'): Promise<unknown> {
    const value = this.store.get(key);
    if (value === undefined) {
      return null;
    }

    if (type === 'json') {
      return JSON.parse(value) as unknown;
    }

    return value;
  }

  async put(key: string, value: string, _options?: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<{ keys: Array<{ name: string }> }> {
    const prefix = options?.prefix ?? '';
    const limit = options?.limit ?? Number.POSITIVE_INFINITY;

    const keys = [...this.store.keys()]
      .filter((key) => key.startsWith(prefix))
      .slice(0, limit)
      .map((name) => ({ name }));

    return { keys };
  }
}

class MockD1Statement {
  private params: unknown[] = [];

  constructor(
    private readonly db: MockD1Database,
    private readonly sql: string,
  ) {}

  bind(...params: unknown[]): MockD1Statement {
    this.params = params;
    return this;
  }

  async run(): Promise<{ success: boolean }> {
    this.db.run(this.sql, this.params);
    return { success: true };
  }

  async all(): Promise<{ results: StoredRow[] }> {
    return { results: this.db.all(this.sql, this.params) };
  }

  async first(): Promise<StoredRow | null> {
    return this.db.first(this.sql, this.params);
  }
}

class MockD1Database {
  private readonly tables = {
    chat_messages: [] as StoredRow[],
    content_subscriptions: [] as StoredRow[],
    email_automations: [] as StoredRow[],
    notification_history: [] as StoredRow[],
  };

  async exec(_sql: string): Promise<{ count: number; duration: number }> {
    return { count: 0, duration: 0 };
  }

  prepare(sql: string): MockD1Statement {
    return new MockD1Statement(this, sql);
  }

  run(sql: string, params: unknown[]): void {
    const normalized = normalizeSql(sql);

    if (normalized.includes('insert into chat_messages')) {
      this.tables.chat_messages.push({
        id: params[0],
        room_id: params[1],
        sender_id: params[2],
        sender_name: params[3],
        direction: params[4],
        message: params[5],
        created_at: params[6],
        attachment_name: params[7],
        attachment_url: params[8],
      });
      return;
    }

    if (normalized.includes('insert into email_automations')) {
      this.tables.email_automations.push({
        id: params[0],
        name: params[1],
        trigger_event: params[2],
        subject: params[3],
        recipients_json: params[4],
        template_preview: params[5],
        enabled: params[6],
        last_triggered_at: params[7],
        created_at: params[8],
      });
      return;
    }

    if (normalized.includes('update email_automations set last_triggered_at')) {
      const [lastTriggeredAt, id] = params;
      const automation = this.tables.email_automations.find((row) => row.id === id);
      if (automation) {
        automation.last_triggered_at = lastTriggeredAt;
      }
      return;
    }

    if (normalized.includes('insert or replace into notification_history')) {
      const row = {
        id: params[0],
        channel: params[1],
        subject: params[2],
        status: params[3],
        created_at: params[4],
        metadata_json: params[5],
      };
      this.tables.notification_history = this.tables.notification_history.filter((entry) => entry.id !== row.id);
      this.tables.notification_history.unshift(row);
      return;
    }

    if (normalized.includes('insert into content_subscriptions')) {
      this.tables.content_subscriptions.unshift({
        id: params[0],
        source: params[1],
        target: params[2],
        contract_ref: params[3],
        data_types_json: params[4],
        status: params[5],
        created_at: params[6],
      });
    }
  }

  all(sql: string, params: unknown[]): StoredRow[] {
    const normalized = normalizeSql(sql);

    if (normalized.includes('from chat_messages')) {
      return [...this.tables.chat_messages]
        .filter((row) => row.room_id === params[0])
        .sort(compareCreatedAtAsc);
    }

    if (normalized.includes('from email_automations')) {
      return [...this.tables.email_automations].sort(compareCreatedAtDesc);
    }

    if (normalized.includes('from notification_history')) {
      const limit = Number(params[0] ?? this.tables.notification_history.length);
      return [...this.tables.notification_history]
        .sort(compareCreatedAtDesc)
        .slice(0, limit);
    }

    if (normalized.includes('from content_subscriptions where source =')) {
      return [...this.tables.content_subscriptions]
        .filter((row) => row.source === params[0])
        .sort(compareCreatedAtDesc);
    }

    if (normalized.includes('from content_subscriptions')) {
      return [...this.tables.content_subscriptions].sort(compareCreatedAtDesc);
    }

    return [];
  }

  first(sql: string, params: unknown[]): StoredRow | null {
    const normalized = normalizeSql(sql);

    if (normalized.includes('from email_automations where id =')) {
      return this.tables.email_automations.find((row) => row.id === params[0]) ?? null;
    }

    return null;
  }
}

class MockR2Bucket {
  async get(): Promise<null> {
    return null;
  }

  async put(): Promise<void> {}

  async list(): Promise<{ objects: Array<{ key: string; size: number; uploaded: Date }> }> {
    return { objects: [] };
  }
}

class MockDurableObjectStub {
  readonly broadcasts: Array<Record<string, unknown>> = [];

  async fetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof init?.body === 'string') {
      this.broadcasts.push(JSON.parse(init.body) as Record<string, unknown>);
    }

    return Response.json({ ok: true });
  }
}

class MockDurableObjectNamespace {
  private readonly stubs = new Map<string, MockDurableObjectStub>();

  idFromName(name: string): DurableObjectId {
    return name as unknown as DurableObjectId;
  }

  get(id: DurableObjectId): DurableObjectStub {
    const key = String(id as unknown as string);
    if (!this.stubs.has(key)) {
      this.stubs.set(key, new MockDurableObjectStub());
    }

    return this.stubs.get(key) as unknown as DurableObjectStub;
  }

  getStub(name: string): MockDurableObjectStub {
    const id = this.idFromName(name);
    return this.get(id) as unknown as MockDurableObjectStub;
  }
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

function compareCreatedAtAsc(left: StoredRow, right: StoredRow): number {
  return String(left.created_at).localeCompare(String(right.created_at));
}

function compareCreatedAtDesc(left: StoredRow, right: StoredRow): number {
  return String(right.created_at).localeCompare(String(left.created_at));
}

function createNotificationEnv() {
  return {
    CHANNEL_CONFIG: new MockKVNamespace(),
    DB: new MockD1Database(),
    NOTIFICATION_LOG: new MockKVNamespace(),
    RETRY_QUEUE: { send: jest.fn(async () => undefined) },
    WS_SESSIONS: new MockDurableObjectNamespace(),
  } as unknown as Parameters<typeof notificationRouter.fetch>[1] & { WS_SESSIONS: MockDurableObjectNamespace };
}

function createDataHubEnv() {
  return {
    CACHE_TTL: '300',
    CONTRACT_FILES: new MockR2Bucket(),
    CONTRACT_REGISTRY: new MockKVNamespace(),
    DATA_ANALYTICS: { writeDataPoint: jest.fn() },
    DATA_STORE: new MockR2Bucket(),
    DATA_SYNC_QUEUE: { send: jest.fn(async () => undefined) },
    DB: new MockD1Database(),
    HASURA_URL: 'https://example.com/graphql',
    NOTIFICATION_QUEUE: { send: jest.fn(async () => undefined) },
    SCHEMA_CACHE: new MockKVNamespace(),
    SUBSCRIPTION_MAP: new MockKVNamespace(),
  } as unknown as Parameters<typeof dataHubProxy.fetch>[1] & { DATA_ANALYTICS: { writeDataPoint: jest.Mock } };
}

describe('notification router integration', () => {
  it('supports chat message preflight, posting, persistence, and websocket fan-out', async () => {
    const env = createNotificationEnv();

    const optionsResponse = await notificationRouter.fetch(
      new Request('https://notifications.brainsait.org/api/v1/chat/rooms/mentor-circle/messages', { method: 'OPTIONS' }),
      env,
    );

    expect(optionsResponse.status).toBe(204);
    expect(['https://notifications.brainsait.org', 'https://brainsait.org']).toContain(
      optionsResponse.headers.get('Access-Control-Allow-Origin'),
    );
    expect(optionsResponse.headers.get('Access-Control-Allow-Methods')).toContain('POST');

    const postResponse = await notificationRouter.fetch(
      new Request('https://notifications.brainsait.org/api/v1/chat/rooms/mentor-circle/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Shared launch checklist approved.',
          senderId: 'current-user',
          senderName: 'QA Founder',
        }),
      }),
      env,
    );

    expect(postResponse.status).toBe(201);
    expect(['https://notifications.brainsait.org', 'https://brainsait.org']).toContain(
      postResponse.headers.get('Access-Control-Allow-Origin'),
    );

    const created = await postResponse.json<Record<string, unknown>>();
    expect(created.roomId).toBe('mentor-circle');
    expect(created.direction).toBe('outgoing');
    expect(created.message).toBe('Shared launch checklist approved.');

    const roomStub = env.WS_SESSIONS.getStub('mentor-circle');
    expect(roomStub.broadcasts).toHaveLength(1);
    expect(roomStub.broadcasts[0]).toMatchObject({
      type: 'chat.message',
      payload: { id: created.id },
    });

    const listResponse = await notificationRouter.fetch(
      new Request('https://notifications.brainsait.org/api/v1/chat/rooms/mentor-circle/messages'),
      env,
    );
    const messages = await listResponse.json<Array<Record<string, unknown>>>();

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          message: 'Shared launch checklist approved.',
          roomId: 'mentor-circle',
        }),
      ]),
    );
  });

  it('triggers email automations and records notification history', async () => {
    const env = createNotificationEnv();

    const triggerResponse = await notificationRouter.fetch(
      new Request('https://notifications.brainsait.org/api/v1/email/automations/automation-course-reminder/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: 'mentor-circle', requestedBy: 'integration-test' }),
      }),
      env,
    );

    expect(triggerResponse.status).toBe(200);
    expect(['https://notifications.brainsait.org', 'https://brainsait.org']).toContain(
      triggerResponse.headers.get('Access-Control-Allow-Origin'),
    );

    const triggerPayload = await triggerResponse.json<Record<string, unknown>>();
    expect(triggerPayload.status).toBe('queued');
    expect(typeof triggerPayload.id).toBe('string');

    const roomStub = env.WS_SESSIONS.getStub('mentor-circle');
    expect(roomStub.broadcasts).toHaveLength(1);
    expect(roomStub.broadcasts[0]).toMatchObject({
      type: 'email.automation.triggered',
      payload: {
        id: triggerPayload.id,
        channel: 'email',
      },
    });

    const historyResponse = await notificationRouter.fetch(
      new Request('https://notifications.brainsait.org/api/v1/history?limit=10'),
      env,
    );
    const history = await historyResponse.json<Array<Record<string, unknown>>>();

    expect(history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: triggerPayload.id,
          channel: 'email',
          status: 'queued',
          metadata: expect.objectContaining({
            automationId: 'automation-course-reminder',
          }),
        }),
      ]),
    );
  });
});

describe('data hub integration', () => {
  it('supports subscription preflight and persists new content subscriptions', async () => {
    const env = createDataHubEnv();
    const source = 'brainsait://courses/collective-brainpower';

    const optionsResponse = await dataHubProxy.fetch(
      new Request('https://data-hub.brainsait.org/api/v1/subscriptions', { method: 'OPTIONS' }),
      env,
    );

    expect(optionsResponse.status).toBe(204);
    expect(['https://data-hub.brainsait.org', 'https://brainsait.org']).toContain(
      optionsResponse.headers.get('Access-Control-Allow-Origin'),
    );
    expect(optionsResponse.headers.get('Access-Control-Allow-Methods')).toContain('POST');

    const createResponse = await dataHubProxy.fetch(
      new Request('https://data-hub.brainsait.org/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          target: 'brainsait-incubator',
          contractRef: 'collective-brainpower-share',
          dataTypes: ['course-assets', 'resource-library'],
        }),
      }),
      env,
    );

    expect(createResponse.status).toBe(200);
    expect(['https://data-hub.brainsait.org', 'https://brainsait.org']).toContain(
      createResponse.headers.get('Access-Control-Allow-Origin'),
    );

    const created = await createResponse.json<Record<string, unknown>>();
    expect(created).toMatchObject({
      status: 'pending',
      source,
      target: 'brainsait-incubator',
      contractRef: 'collective-brainpower-share',
    });
    expect(env.DATA_ANALYTICS.writeDataPoint).toHaveBeenCalledTimes(1);

    const subscribersResponse = await dataHubProxy.fetch(
      new Request(`https://data-hub.brainsait.org/api/v1/subscriptions/${encodeURIComponent(source)}`),
      env,
    );
    const subscribersPayload = await subscribersResponse.json<Record<string, unknown>>();
    const subscribers = subscribersPayload.subscribers as Array<Record<string, unknown>>;

    expect(subscribers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          source,
          target: 'brainsait-incubator',
          contractRef: 'collective-brainpower-share',
        }),
      ]),
    );

    const listResponse = await dataHubProxy.fetch(
      new Request('https://data-hub.brainsait.org/api/v1/subscriptions'),
      env,
    );
    const subscriptions = await listResponse.json<Array<Record<string, unknown>>>();

    expect(subscriptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          source,
          target: 'brainsait-incubator',
          contractRef: 'collective-brainpower-share',
        }),
      ]),
    );
  });
});