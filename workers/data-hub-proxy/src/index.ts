import {
  graduationShowcase as seededShowcase,
  incubatorAppCategories as seededAppCategories,
  incubatorApps as seededApps,
  incubatorCourses,
  incubatorResources as seededResources,
  incubatorWorkshops as seededWorkshops,
  sharedCourseContracts as seededSharedContracts,
  type AppCatalogPayload,
  type AppCategory,
  type ContentSubscription,
  type IncubatorApp,
  type ResourceItem,
  type ResourceLibraryPayload,
  type ResourceWorkshop,
  type SharedCourseBundle,
  type SharedDataContract,
  type ShowcaseCohort,
} from '../../../packages/brainsait-shared/src/constants/incubator';

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

const ALLOWED_ORIGINS = [
  'https://brainsait.org',
  'https://partners.brainsait.org',
  'https://portal.elfadil.com',
  'https://incubator.brainsait.org',
];

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-hasura-admin-secret',
    'Vary': 'Origin',
  };
}

// Fallback constant for backwards-compat (not sent directly anymore)
const corsHeaders = getCorsHeaders({ headers: new Headers() } as Request);

const featuredCourse = incubatorCourses[0]!;

let subscriptionSchemaReady = false;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    const url = new URL(request.url);
    let response: Response;

    if (url.pathname === '/health') {
      response = Response.json({ status: 'ok', service: 'data-hub-proxy' });
      return withCors(response);
    }

    if (url.pathname === '/api/v1/resources' && request.method === 'GET') {
      response = Response.json(await getResourceLibraryPayload(env));
      return withCors(response);
    }

    if (url.pathname === '/api/v1/apps' && request.method === 'GET') {
      response = Response.json(await getAppCatalogPayload(env, url.searchParams.get('category') || undefined));
      return withCors(response);
    }

    if (url.pathname === '/api/v1/apps/categories' && request.method === 'GET') {
      response = Response.json(await getAppCategories(env));
      return withCors(response);
    }

    if (url.pathname.startsWith('/api/v1/apps/') && request.method === 'GET') {
      const slug = decodeURIComponent(url.pathname.slice('/api/v1/apps/'.length));
      const app = await getAppBySlug(env, slug);
      response = app ? Response.json(app) : Response.json({ error: 'App not found' }, { status: 404 });
      return withCors(response);
    }

    if (url.pathname === '/api/v1/showcase' && request.method === 'GET') {
      response = Response.json(await getShowcase(env));
      return withCors(response);
    }

    if (url.pathname === '/api/v1/courses' && request.method === 'GET') {
      response = Response.json(await getCourses(env));
      return withCors(response);
    }

    if (url.pathname === '/api/v1/contracts/shared' && request.method === 'GET') {
      response = Response.json(await getSharedContracts(env));
      return withCors(response);
    }

    if (url.pathname === '/api/v1/schemas' && request.method === 'GET') {
      return withCors(await listSchemas(env));
    }
    if (url.pathname.startsWith('/api/v1/schemas/') && request.method === 'GET') {
      const startup = decodeURIComponent(url.pathname.slice('/api/v1/schemas/'.length));
      return withCors(await getSchema(startup, env));
    }
    if (url.pathname.startsWith('/api/v1/schemas/') && request.method === 'POST') {
      const startup = decodeURIComponent(url.pathname.slice('/api/v1/schemas/'.length));
      return withCors(await upsertSchema(startup, request, env));
    }

    if (url.pathname === '/api/v1/contracts' && request.method === 'GET') {
      return withCors(await listContracts(env));
    }
    if (url.pathname.startsWith('/api/v1/contracts/') && request.method === 'GET') {
      const name = decodeURIComponent(url.pathname.slice('/api/v1/contracts/'.length));
      return withCors(await getContract(name, env));
    }
    if (url.pathname.startsWith('/api/v1/contracts/') && request.method === 'POST') {
      const startup = decodeURIComponent(url.pathname.slice('/api/v1/contracts/'.length));
      return withCors(await uploadContract(startup, request, env));
    }
    if (url.pathname.startsWith('/api/v1/contracts/') && url.pathname.endsWith('/validate')) {
      const name = decodeURIComponent(url.pathname.slice('/api/v1/contracts/'.length, -'/validate'.length));
      return withCors(await validateContract(name, request, env));
    }

    if (url.pathname === '/api/v1/subscriptions' && request.method === 'GET') {
      return withCors(await listSubscriptions(env));
    }
    if (url.pathname === '/api/v1/subscriptions' && request.method === 'POST') {
      return withCors(await createSubscription(request, env));
    }
    if (url.pathname.startsWith('/api/v1/subscriptions/') && request.method === 'GET') {
      const startup = decodeURIComponent(url.pathname.slice('/api/v1/subscriptions/'.length));
      return withCors(await getSubscribers(startup, env));
    }

    if (url.pathname === '/api/v1/catalog' && request.method === 'GET') {
      return withCors(await getCatalog(env));
    }
    if (url.pathname === '/api/v1/catalog/rebuild' && request.method === 'POST') {
      return withCors(await rebuildCatalog(env));
    }

    if (url.pathname === '/graphql' || url.pathname === '/api/v1/graphql') {
      return withCors(await proxyGraphQL(request, env));
    }

    return withCors(Response.json({ error: 'Not found' }, { status: 404 }));
  },

  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const event = msg.body as Record<string, string>;
      if (event.type === 'schema_updated') {
        const subscribers = await env.SUBSCRIPTION_MAP.get(event.source);
        if (subscribers) {
          for (const sub of JSON.parse(subscribers) as Array<string | { target?: string }>) {
            const target = typeof sub === 'string' ? sub : sub.target;
            if (!target) {
              continue;
            }
            await env.NOTIFICATION_QUEUE.send({
              type: 'schema_updated',
              target,
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

async function getResourceLibraryPayload(env: Env): Promise<ResourceLibraryPayload> {
  const [resources, workshops, courses, sharedContracts] = await Promise.all([
    loadJsonFromBucket<ResourceItem[]>(env.DATA_STORE, 'curated/resources.json', seededResources),
    loadJsonFromBucket<ResourceWorkshop[]>(env.DATA_STORE, 'curated/workshops.json', seededWorkshops),
    loadJsonFromBucket<SharedCourseBundle[]>(env.DATA_STORE, 'curated/courses.json', [featuredCourse]),
    loadJsonFromBucket<SharedDataContract[]>(env.CONTRACT_FILES, 'curated/shared-contracts.json', seededSharedContracts),
  ]);

  return { resources, workshops, courses, sharedContracts };
}

async function getAppCatalogPayload(env: Env, category?: string): Promise<AppCatalogPayload> {
  const [categories, apps] = await Promise.all([
    getAppCategories(env),
    loadJsonFromBucket<IncubatorApp[]>(env.DATA_STORE, 'curated/apps.json', seededApps),
  ]);

  return {
    categories,
    apps: category ? apps.filter((app) => app.category === category) : apps,
  };
}

async function getAppCategories(env: Env): Promise<AppCategory[]> {
  return loadJsonFromBucket<AppCategory[]>(env.DATA_STORE, 'curated/app-categories.json', seededAppCategories);
}

async function getAppBySlug(env: Env, slug: string): Promise<IncubatorApp | undefined> {
  const apps = await loadJsonFromBucket<IncubatorApp[]>(env.DATA_STORE, 'curated/apps.json', seededApps);
  return apps.find((app) => app.slug === slug);
}

async function getCourses(env: Env): Promise<SharedCourseBundle[]> {
  return loadJsonFromBucket<SharedCourseBundle[]>(env.DATA_STORE, 'curated/courses.json', [featuredCourse]);
}

async function getSharedContracts(env: Env): Promise<SharedDataContract[]> {
  return loadJsonFromBucket<SharedDataContract[]>(env.CONTRACT_FILES, 'curated/shared-contracts.json', seededSharedContracts);
}

async function getShowcase(env: Env): Promise<ShowcaseCohort[]> {
  return loadJsonFromBucket<ShowcaseCohort[]>(env.DATA_STORE, 'curated/showcase.json', seededShowcase);
}

async function listSchemas(env: Env): Promise<Response> {
  const list = await env.CONTRACT_REGISTRY.list();
  const schemas = [];
  for (const key of list.keys) {
    const data = await env.CONTRACT_REGISTRY.get(key.name);
    if (data && key.name !== '_catalog') schemas.push(JSON.parse(data));
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

  if (!schema.name || !schema.version) {
    return Response.json({ error: 'Schema must have name and version' }, { status: 400 });
  }

  await env.SCHEMA_CACHE.put(`schema:${startup}`, body);
  await env.CONTRACT_REGISTRY.put(`${startup}/${schema.name}`, JSON.stringify({
    startup,
    name: schema.name,
    version: schema.version,
    updatedAt: new Date().toISOString(),
  }));

  await env.DB.prepare(
    'INSERT OR REPLACE INTO schemas (startup, name, version, schema_json, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(startup, schema.name, schema.version, body, new Date().toISOString()).run();

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
  const candidateKeys = [
    `contracts/${name}.contract.json`,
    `contracts/${name}`,
    `contracts/${name}/default.contract.json`,
  ];

  let obj: R2ObjectBody | null = null;
  for (const key of candidateKeys) {
    obj = await env.CONTRACT_FILES.get(key);
    if (obj) {
      break;
    }
  }
  if (!obj) return Response.json({ error: 'Contract not found' }, { status: 404 });
  const body = await obj.text();
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
}

async function uploadContract(startup: string, request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const contract = JSON.parse(body);

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
  const data = await request.json<Record<string, unknown>>();
  const contractResponse = await getContract(name, env);
  if (!contractResponse.ok) return contractResponse;

  const schema = JSON.parse(await contractResponse.text());
  const errors: string[] = [];

  if (schema.required) {
    for (const field of schema.required as string[]) {
      if (!(field in data)) errors.push(`Missing required field: ${field}`);
    }
  }

  return Response.json({ valid: errors.length === 0, errors });
}

async function createSubscription(request: Request, env: Env): Promise<Response> {
  await ensureSubscriptionSchema(env);

  const body = await request.json<Record<string, unknown>>();
  const source = asString(body.source);
  const target = asString(body.target) || (request as unknown as { cf?: { colo?: string } }).cf?.colo || 'unknown';
  const contractRef = asString(body.contractRef) || asString(body.contract);
  const dataTypes = Array.isArray(body.dataTypes)
    ? body.dataTypes.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];

  if (!source || !contractRef) {
    return Response.json({ error: 'source and contractRef are required' }, { status: 400 });
  }

  const entry: ContentSubscription = {
    id: `subscription-${crypto.randomUUID()}`,
    source,
    target,
    contractRef,
    dataTypes,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await env.DB.prepare(
    `INSERT INTO content_subscriptions (id, source, target, contract_ref, data_types_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(entry.id, entry.source, entry.target, entry.contractRef, JSON.stringify(entry.dataTypes), entry.status, entry.createdAt).run();

  const existing = await env.SUBSCRIPTION_MAP.get(source);
  const subs = existing ? JSON.parse(existing) as ContentSubscription[] : [];
  subs.unshift(entry);
  await env.SUBSCRIPTION_MAP.put(source, JSON.stringify(subs.slice(0, 100)));
  await env.SUBSCRIPTION_MAP.put(`subscription:${entry.id}`, JSON.stringify(entry));

  env.DATA_ANALYTICS.writeDataPoint({
    blobs: [entry.source, entry.target, entry.contractRef],
    doubles: [Date.now(), entry.dataTypes.length],
    indexes: [entry.id],
  });

  return Response.json({ status: entry.status, id: entry.id, source: entry.source, target: entry.target, contractRef: entry.contractRef });
}

async function getSubscribers(startup: string, env: Env): Promise<Response> {
  await ensureSubscriptionSchema(env);
  const kvSubs = await env.SUBSCRIPTION_MAP.get(startup);
  const dbRows = await env.DB.prepare(
    `SELECT id, source, target, contract_ref, data_types_json, status, created_at
       FROM content_subscriptions
      WHERE source = ?
      ORDER BY created_at DESC`
  ).bind(startup).all();

  const dbSubs = (dbRows.results as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    source: String(row.source),
    target: String(row.target),
    contractRef: String(row.contract_ref),
    dataTypes: JSON.parse(String(row.data_types_json)) as string[],
    status: String(row.status),
    createdAt: String(row.created_at),
  }));

  const merged = mergeById(dbSubs, kvSubs ? JSON.parse(kvSubs) as ContentSubscription[] : []);
  return Response.json({ startup, subscribers: merged });
}

async function listSubscriptions(env: Env): Promise<Response> {
  await ensureSubscriptionSchema(env);
  const rows = await env.DB.prepare(
    `SELECT id, source, target, contract_ref, data_types_json, status, created_at
       FROM content_subscriptions
      ORDER BY created_at DESC`
  ).all();

  const subscriptions = (rows.results as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    source: String(row.source),
    target: String(row.target),
    contractRef: String(row.contract_ref),
    dataTypes: JSON.parse(String(row.data_types_json)) as string[],
    status: String(row.status),
    createdAt: String(row.created_at),
  }));

  return Response.json(subscriptions);
}

async function getCatalog(env: Env): Promise<Response> {
  const list = await env.CONTRACT_REGISTRY.list();
  const catalog = [];
  for (const key of list.keys) {
    const data = await env.CONTRACT_REGISTRY.get(key.name);
    if (data) catalog.push(JSON.parse(data));
  }

  const curated = await getResourceLibraryPayload(env);
  return Response.json({
    catalog,
    total: catalog.length,
    curated: {
      resources: curated.resources.length,
      workshops: curated.workshops.length,
      courses: curated.courses.length,
      sharedContracts: curated.sharedContracts.length,
      apps: (await getAppCatalogPayload(env)).apps.length,
    },
  });
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
  const curated = await getResourceLibraryPayload(env);
  const snapshot = {
    catalog,
    curated: {
      resources: curated.resources,
      workshops: curated.workshops,
      courses: curated.courses,
      sharedContracts: curated.sharedContracts,
      apps: (await getAppCatalogPayload(env)).apps,
    },
    rebuiltAt: new Date().toISOString(),
  };
  await env.CONTRACT_REGISTRY.put('_catalog', JSON.stringify(snapshot));
  return Response.json({ status: 'rebuilt', entries: catalog.length, curatedResources: curated.resources.length });
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

async function ensureSubscriptionSchema(env: Env): Promise<void> {
  if (subscriptionSchemaReady) {
    return;
  }

  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS content_subscriptions (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      target TEXT NOT NULL,
      contract_ref TEXT NOT NULL,
      data_types_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  subscriptionSchemaReady = true;
}

async function loadJsonFromBucket<T>(bucket: R2Bucket, key: string, fallback: T): Promise<T> {
  try {
    const object = await bucket.get(key);
    if (!object) {
      return fallback;
    }
    return JSON.parse(await object.text()) as T;
  } catch {
    return fallback;
  }
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

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function withCors(response: Response, request?: Request): Response {
  const headers = new Headers(response.headers);
  const cors = request ? getCorsHeaders(request) : corsHeaders;
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
