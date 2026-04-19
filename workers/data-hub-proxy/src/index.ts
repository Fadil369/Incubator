/**
 * BrainSAIT Data Hub Proxy
 * GraphQL proxy with caching, contract validation, subscription management
 */
export interface Env {
  SCHEMA_CACHE: KVNamespace;
  CONTRACT_REGISTRY: KVNamespace;
  SUBSCRIPTION_MAP: KVNamespace;
  DB: D1Database;
  DATA_STORE: R2Bucket;
  CONTRACT_FILES: R2Bucket;
  DATA_SYNC_QUEUE: Queue;
  NOTIFICATION_QUEUE: Queue;
  DATA_ANALYTICS: AnalyticsEngineDataset;
  HASURA_URL: string;
  CACHE_TTL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'data-hub-proxy' });
    }

    // ── Schema Registry ──
    if (url.pathname === '/api/v1/schemas' && request.method === 'GET') {
      return listSchemas(env);
    }
    if (url.pathname.startsWith('/api/v1/schemas/') && request.method === 'GET') {
      const startup = url.pathname.split('/')[3];
      return getSchema(startup, env);
    }
    if (url.pathname.startsWith('/api/v1/schemas/') && request.method === 'POST') {
      const startup = url.pathname.split('/')[3];
      return upsertSchema(startup, request, env);
    }

    // ── Contract Management ──
    if (url.pathname === '/api/v1/contracts' && request.method === 'GET') {
      return listContracts(env);
    }
    if (url.pathname.startsWith('/api/v1/contracts/') && request.method === 'GET') {
      const name = url.pathname.split('/')[3];
      return getContract(name, env);
    }
    if (url.pathname.startsWith('/api/v1/contracts/') && request.method === 'POST') {
      const startup = url.pathname.split('/')[3];
      return uploadContract(startup, request, env);
    }
    if (url.pathname.startsWith('/api/v1/contracts/') && url.pathname.endsWith('/validate')) {
      const name = url.pathname.split('/')[3];
      return validateContract(name, request, env);
    }

    // ── Subscriptions ──
    if (url.pathname === '/api/v1/subscriptions' && request.method === 'GET') {
      return listSubscriptions(env);
    }
    if (url.pathname === '/api/v1/subscriptions' && request.method === 'POST') {
      return createSubscription(request, env);
    }
    if (url.pathname.startsWith('/api/v1/subscriptions/') && request.method === 'GET') {
      const startup = url.pathname.split('/')[3];
      return getSubscribers(startup, env);
    }

    // ── Data Catalog ──
    if (url.pathname === '/api/v1/catalog' && request.method === 'GET') {
      return getCatalog(env);
    }
    if (url.pathname === '/api/v1/catalog/rebuild' && request.method === 'POST') {
      return rebuildCatalog(env);
    }

    // ── GraphQL Proxy to Hasura ──
    if (url.pathname === '/graphql' || url.pathname === '/api/v1/graphql') {
      return proxyGraphQL(request, env);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const event = msg.body as Record<string, string>;
      // Sync schema changes to subscribers
      if (event.type === 'schema_updated') {
        const subscribers = await env.SUBSCRIPTION_MAP.get(event.source);
        if (subscribers) {
          for (const sub of JSON.parse(subscribers)) {
            await env.NOTIFICATION_QUEUE.send({
              type: 'schema_updated',
              target: sub,
              source: event.source,
              data: event,
            });
          }
        }
      }
      msg.ack();
    }
  },
};

async function listSchemas(env: Env): Promise<Response> {
  const list = await env.CONTRACT_REGISTRY.list();
  const schemas = [];
  for (const key of list.keys) {
    const data = await env.CONTRACT_REGISTRY.get(key.name);
    if (data) schemas.push(JSON.parse(data));
  }
  return Response.json(schemas);
}

async function getSchema(startup: string, env: Env): Promise<Response> {
  const cached = await env.SCHEMA_CACHE.get(`schema:${startup}`);
  if (!cached) return Response.json({ error: 'Schema not found' }, { status: 404 });
  return Response.json(JSON.parse(cached));
}

async function upsertSchema(startup: string, request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const schema = JSON.parse(body);

  // Validate schema structure
  if (!schema.name || !schema.version) {
    return Response.json({ error: 'Schema must have name and version' }, { status: 400 });
  }

  // Store
  await env.SCHEMA_CACHE.put(`schema:${startup}`, body);
  await env.CONTRACT_REGISTRY.put(`${startup}/${schema.name}`, JSON.stringify({
    startup,
    name: schema.name,
    version: schema.version,
    updatedAt: new Date().toISOString(),
  }));

  // Store in D1
  await env.DB.prepare(
    'INSERT OR REPLACE INTO schemas (startup, name, version, schema_json, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(startup, schema.name, schema.version, body, new Date().toISOString()).run();

  // Sync to subscribers
  await env.DATA_SYNC_QUEUE.send({ type: 'schema_updated', source: startup, schema: schema.name });

  return Response.json({ status: 'synced', startup, schema: schema.name, version: schema.version });
}

async function listContracts(env: Env): Promise<Response> {
  const list = await env.CONTRACT_FILES.list({ prefix: 'contracts/' });
  const contracts = list.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
  }));
  return Response.json(contracts);
}

async function getContract(name: string, env: Env): Promise<Response> {
  const obj = await env.CONTRACT_FILES.get(`contracts/${name}.contract.json`);
  if (!obj) return Response.json({ error: 'Contract not found' }, { status: 404 });
  const body = await obj.text();
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
}

async function uploadContract(startup: string, request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const contract = JSON.parse(body);

  // HIPAA validation
  const validation = validateHIPAA(contract);
  if (!validation.valid) {
    return Response.json({ error: 'HIPAA validation failed', details: validation.errors }, { status: 422 });
  }

  const key = `contracts/${startup}/${contract.name || 'default'}.contract.json`;
  await env.CONTRACT_FILES.put(key, body, {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { startup, version: contract.version || '1.0.0' },
  });

  return Response.json({ status: 'uploaded', key, hipaa_valid: true });
}

async function validateContract(name: string, request: Request, env: Env): Promise<Response> {
  const data = await request.json();
  const contract = await env.CONTRACT_FILES.get(`contracts/${name}.contract.json`);
  if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

  const schema = JSON.parse(await contract.text());
  const errors: string[] = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) errors.push(`Missing required field: ${field}`);
    }
  }

  return Response.json({ valid: errors.length === 0, errors });
}

async function createSubscription(request: Request, env: Env): Promise<Response> {
  const { source, contract } = await request.json() as { source: string; contract: string };
  const existing = await env.SUBSCRIPTION_MAP.get(source);
  const subs = existing ? JSON.parse(existing) : [];

  const target = (request as unknown as { cf?: { colo?: string } }).cf?.colo || 'unknown';
  subs.push({ target, contract, createdAt: new Date().toISOString() });
  await env.SUBSCRIPTION_MAP.put(source, JSON.stringify(subs));

  return Response.json({ status: 'subscribed', source, contract });
}

async function getSubscribers(startup: string, env: Env): Promise<Response> {
  const subs = await env.SUBSCRIPTION_MAP.get(startup);
  return Response.json({ startup, subscribers: subs ? JSON.parse(subs) : [] });
}

async function listSubscriptions(env: Env): Promise<Response> {
  const list = await env.SUBSCRIPTION_MAP.list();
  const subs: Record<string, unknown> = {};
  for (const key of list.keys) {
    subs[key.name] = JSON.parse(await env.SUBSCRIPTION_MAP.get(key.name) || '[]');
  }
  return Response.json(subs);
}

async function getCatalog(env: Env): Promise<Response> {
  const list = await env.CONTRACT_REGISTRY.list();
  const catalog = [];
  for (const key of list.keys) {
    const data = await env.CONTRACT_REGISTRY.get(key.name);
    if (data) catalog.push(JSON.parse(data));
  }
  return Response.json({ catalog, total: catalog.length });
}

async function rebuildCatalog(env: Env): Promise<Response> {
  const schemas = await env.SCHEMA_CACHE.list();
  const catalog = [];
  for (const key of schemas.keys) {
    const data = await env.SCHEMA_CACHE.get(key.name);
    if (data) {
      const schema = JSON.parse(data);
      catalog.push({ key: key.name, name: schema.name, version: schema.version });
    }
  }
  await env.CONTRACT_REGISTRY.put('_catalog', JSON.stringify({ catalog, rebuiltAt: new Date().toISOString() }));
  return Response.json({ status: 'rebuilt', entries: catalog.length });
}

async function proxyGraphQL(request: Request, env: Env): Promise<Response> {
  const cacheKey = `gql:${await hashRequest(request)}`;
  const cached = await env.SCHEMA_CACHE.get(cacheKey);
  if (cached && request.method === 'GET') {
    return new Response(cached, { headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
  }

  const upstream = await fetch(env.HASURA_URL + '/graphql', {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Hasura-Admin-Secret': request.headers.get('x-hasura-admin-secret') || '',
    },
    body: request.method === 'POST' ? await request.text() : undefined,
  });

  const body = await upstream.text();
  if (upstream.ok && request.method === 'GET') {
    await env.SCHEMA_CACHE.put(cacheKey, body, { expirationTtl: parseInt(env.CACHE_TTL) });
  }

  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
  });
}

function validateHIPAA(contract: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (contract.hipaa_compliant && (!contract.pii_fields || !Array.isArray(contract.pii_fields))) {
    errors.push('HIPAA compliant contracts must declare pii_fields array');
  }
  if (contract.sharing_policy === 'public' && Array.isArray(contract.pii_fields) && (contract.pii_fields as string[]).length > 0) {
    errors.push('Cannot share PII with public sharing policy');
  }
  return { valid: errors.length === 0, errors };
}

async function hashRequest(request: Request): Promise<string> {
  const text = request.url + (await request.clone().text());
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
