import dataHubProxy from '../../../../workers/data-hub-proxy/src/index';
import notificationRouter from '../../../../workers/notification-router/src/index';
class MockKVNamespace {
    store = new Map();
    async get(key, type) {
        const value = this.store.get(key);
        if (value === undefined) {
            return null;
        }
        if (type === 'json') {
            return JSON.parse(value);
        }
        return value;
    }
    async put(key, value, _options) {
        this.store.set(key, value);
    }
    async list(options) {
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
    db;
    sql;
    params = [];
    constructor(db, sql) {
        this.db = db;
        this.sql = sql;
    }
    bind(...params) {
        this.params = params;
        return this;
    }
    async run() {
        this.db.run(this.sql, this.params);
        return { success: true };
    }
    async all() {
        return { results: this.db.all(this.sql, this.params) };
    }
    async first() {
        return this.db.first(this.sql, this.params);
    }
}
class MockD1Database {
    tables = {
        chat_messages: [],
        content_subscriptions: [],
        email_automations: [],
        notification_history: [],
    };
    async exec(_sql) {
        return { count: 0, duration: 0 };
    }
    prepare(sql) {
        return new MockD1Statement(this, sql);
    }
    run(sql, params) {
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
    all(sql, params) {
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
    first(sql, params) {
        const normalized = normalizeSql(sql);
        if (normalized.includes('from email_automations where id =')) {
            return this.tables.email_automations.find((row) => row.id === params[0]) ?? null;
        }
        return null;
    }
}
class MockR2Bucket {
    async get() {
        return null;
    }
    async put() { }
    async list() {
        return { objects: [] };
    }
}
class MockDurableObjectStub {
    broadcasts = [];
    async fetch(_input, init) {
        if (typeof init?.body === 'string') {
            this.broadcasts.push(JSON.parse(init.body));
        }
        return Response.json({ ok: true });
    }
}
class MockDurableObjectNamespace {
    stubs = new Map();
    idFromName(name) {
        return name;
    }
    get(id) {
        const key = String(id);
        if (!this.stubs.has(key)) {
            this.stubs.set(key, new MockDurableObjectStub());
        }
        return this.stubs.get(key);
    }
    getStub(name) {
        const id = this.idFromName(name);
        return this.get(id);
    }
}
function normalizeSql(sql) {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}
function compareCreatedAtAsc(left, right) {
    return String(left.created_at).localeCompare(String(right.created_at));
}
function compareCreatedAtDesc(left, right) {
    return String(right.created_at).localeCompare(String(left.created_at));
}
function createNotificationEnv() {
    return {
        CHANNEL_CONFIG: new MockKVNamespace(),
        DB: new MockD1Database(),
        NOTIFICATION_LOG: new MockKVNamespace(),
        RETRY_QUEUE: { send: jest.fn(async () => undefined) },
        WS_SESSIONS: new MockDurableObjectNamespace(),
    };
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
    };
}
describe('notification router integration', () => {
    it('supports chat message preflight, posting, persistence, and websocket fan-out', async () => {
        const env = createNotificationEnv();
        const optionsResponse = await notificationRouter.fetch(new Request('https://notifications.brainsait.org/api/v1/chat/rooms/mentor-circle/messages', { method: 'OPTIONS' }), env);
        expect(optionsResponse.status).toBe(204);
        expect(optionsResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(optionsResponse.headers.get('Access-Control-Allow-Methods')).toContain('POST');
        const postResponse = await notificationRouter.fetch(new Request('https://notifications.brainsait.org/api/v1/chat/rooms/mentor-circle/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Shared launch checklist approved.',
                senderId: 'current-user',
                senderName: 'QA Founder',
            }),
        }), env);
        expect(postResponse.status).toBe(201);
        expect(postResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
        const created = await postResponse.json();
        expect(created.roomId).toBe('mentor-circle');
        expect(created.direction).toBe('outgoing');
        expect(created.message).toBe('Shared launch checklist approved.');
        const roomStub = env.WS_SESSIONS.getStub('mentor-circle');
        expect(roomStub.broadcasts).toHaveLength(1);
        expect(roomStub.broadcasts[0]).toMatchObject({
            type: 'chat.message',
            payload: { id: created.id },
        });
        const listResponse = await notificationRouter.fetch(new Request('https://notifications.brainsait.org/api/v1/chat/rooms/mentor-circle/messages'), env);
        const messages = await listResponse.json();
        expect(messages).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: created.id,
                message: 'Shared launch checklist approved.',
                roomId: 'mentor-circle',
            }),
        ]));
    });
    it('triggers email automations and records notification history', async () => {
        const env = createNotificationEnv();
        const triggerResponse = await notificationRouter.fetch(new Request('https://notifications.brainsait.org/api/v1/email/automations/automation-course-reminder/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: 'mentor-circle', requestedBy: 'integration-test' }),
        }), env);
        expect(triggerResponse.status).toBe(200);
        expect(triggerResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
        const triggerPayload = await triggerResponse.json();
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
        const historyResponse = await notificationRouter.fetch(new Request('https://notifications.brainsait.org/api/v1/history?limit=10'), env);
        const history = await historyResponse.json();
        expect(history).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: triggerPayload.id,
                channel: 'email',
                status: 'queued',
                metadata: expect.objectContaining({
                    automationId: 'automation-course-reminder',
                }),
            }),
        ]));
    });
});
describe('data hub integration', () => {
    it('supports subscription preflight and persists new content subscriptions', async () => {
        const env = createDataHubEnv();
        const source = 'brainsait://courses/collective-brainpower';
        const optionsResponse = await dataHubProxy.fetch(new Request('https://data-hub.brainsait.org/api/v1/subscriptions', { method: 'OPTIONS' }), env);
        expect(optionsResponse.status).toBe(204);
        expect(optionsResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(optionsResponse.headers.get('Access-Control-Allow-Methods')).toContain('POST');
        const createResponse = await dataHubProxy.fetch(new Request('https://data-hub.brainsait.org/api/v1/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source,
                target: 'brainsait-incubator',
                contractRef: 'collective-brainpower-share',
                dataTypes: ['course-assets', 'resource-library'],
            }),
        }), env);
        expect(createResponse.status).toBe(200);
        expect(createResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
        const created = await createResponse.json();
        expect(created).toMatchObject({
            status: 'pending',
            source,
            target: 'brainsait-incubator',
            contractRef: 'collective-brainpower-share',
        });
        expect(env.DATA_ANALYTICS.writeDataPoint).toHaveBeenCalledTimes(1);
        const subscribersResponse = await dataHubProxy.fetch(new Request(`https://data-hub.brainsait.org/api/v1/subscriptions/${encodeURIComponent(source)}`), env);
        const subscribersPayload = await subscribersResponse.json();
        const subscribers = subscribersPayload.subscribers;
        expect(subscribers).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: created.id,
                source,
                target: 'brainsait-incubator',
                contractRef: 'collective-brainpower-share',
            }),
        ]));
        const listResponse = await dataHubProxy.fetch(new Request('https://data-hub.brainsait.org/api/v1/subscriptions'), env);
        const subscriptions = await listResponse.json();
        expect(subscriptions).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: created.id,
                source,
                target: 'brainsait-incubator',
                contractRef: 'collective-brainpower-share',
            }),
        ]));
    });
});
//# sourceMappingURL=incubatorWorkers.integration.test.js.map