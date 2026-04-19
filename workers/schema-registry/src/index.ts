/**
 * BrainSAIT Schema Registry
 * Data contract versioning, validation, and discovery
 */
export interface Env {
  SCHEMAS: KVNamespace;
  VERSION_HISTORY: KVNamespace;
  DB: D1Database;
  SCHEMA_FILES: R2Bucket;
  NOTIFICATION_QUEUE: Queue;
  DATA_SYNC_QUEUE: Queue;
  ALLOWED_FORMATS: string;
  MAX_SCHEMA_SIZE_KB: string;
  REQUIRE_HIPAA_EXTENSION: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'schema-registry' });
    }

    // List all schemas
    if (url.pathname === '/api/v1/schemas' && request.method === 'GET') {
      return listSchemas(url, env);
    }

    // Get schema by name
    if (url.pathname.match(/^\/api\/v1\/schemas\/[^/]+$/) && request.method === 'GET') {
      const name = url.pathname.split('/').pop()!;
      return getSchema(name, env);
    }

    // Create/update schema
    if (url.pathname.match(/^\/api\/v1\/schemas\/[^/]+$/) && request.method === 'PUT') {
      const name = url.pathname.split('/').pop()!;
      return upsertSchema(name, request, env);
    }

    // Get schema version history
    if (url.pathname.match(/^\/api\/v1\/schemas\/[^/]+\/versions$/) && request.method === 'GET') {
      const name = url.pathname.split('/')[4];
      return getVersionHistory(name, env);
    }

    // Get specific version
    if (url.pathname.match(/^\/api\/v1\/schemas\/[^/]+\/versions\/[^/]+$/) && request.method === 'GET') {
      const parts = url.pathname.split('/');
      const name = parts[4];
      const version = parts[6];
      return getVersion(name, version, env);
    }

    // Validate data against schema
    if (url.pathname.match(/^\/api\/v1\/schemas\/[^/]+\/validate$/) && request.method === 'POST') {
      const name = url.pathname.split('/')[4];
      return validateData(name, request, env);
    }

    // Diff two schema versions
    if (url.pathname.match(/^\/api\/v1\/schemas\/[^/]+\/diff$/) && request.method === 'POST') {
      const name = url.pathname.split('/')[4];
      return diffVersions(name, request, env);
    }

    // Search schemas
    if (url.pathname === '/api/v1/schemas/search' && request.method === 'GET') {
      return searchSchemas(url, env);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};

async function listSchemas(url: URL, env: Env): Promise<Response> {
  const startup = url.searchParams.get('startup');
  const sector = url.searchParams.get('sector');

  const list = await env.SCHEMAS.list({ prefix: startup ? `${startup}:` : undefined });
  const schemas = [];
  for (const key of list.keys) {
    const data = await env.SCHEMAS.get(key.name);
    if (data) {
      const schema = JSON.parse(data);
      if (!sector || schema.sector === sector) {
        schemas.push({ name: key.name.split(':')[1], version: schema.version, startup: key.name.split(':')[0] });
      }
    }
  }
  return Response.json({ schemas, total: schemas.length });
}

async function getSchema(name: string, env: Env): Promise<Response> {
  const data = await env.SCHEMAS.get(name);
  if (!data) return Response.json({ error: 'Schema not found' }, { status: 404 });
  return Response.json(JSON.parse(data));
}

async function upsertSchema(name: string, request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const schema = JSON.parse(body);

  // Validate schema
  if (!schema.version) {
    return Response.json({ error: 'Schema must have a version field' }, { status: 400 });
  }

  // HIPAA extension check
  if (env.REQUIRE_HIPAA_EXTENSION === 'true') {
    if (schema.hipaa_compliant === undefined) {
      return Response.json({ error: 'Schema must declare hipaa_compliant field' }, { status: 400 });
    }
  }

  // Store current version
  const existing = await env.SCHEMAS.get(name);
  if (existing) {
    const existingSchema = JSON.parse(existing);
    const versionKey = `${name}:${existingSchema.version}`;
    await env.VERSION_HISTORY.put(versionKey, existing);
  }

  // Store new version
  await env.SCHEMAS.put(name, body);

  // Store in R2 for backup
  await env.SCHEMA_FILES.put(`schemas/${name}/${schema.version}.json`, body, {
    httpMetadata: { contentType: 'application/json' },
  });

  // Store in D1
  await env.DB.prepare(
    'INSERT OR REPLACE INTO schemas (name, version, schema_json, updated_at) VALUES (?, ?, ?, ?)'
  ).bind(name, schema.version, body, new Date().toISOString()).run();

  // Notify subscribers
  await env.DATA_SYNC_QUEUE.send({ type: 'schema_updated', schema: name, version: schema.version });

  return Response.json({ status: 'saved', name, version: schema.version });
}

async function getVersionHistory(name: string, env: Env): Promise<Response> {
  const list = await env.VERSION_HISTORY.list({ prefix: `${name}:` });
  const versions = [];
  for (const key of list.keys) {
    versions.push(key.name.split(':')[1]);
  }
  return Response.json({ name, versions: versions.sort() });
}

async function getVersion(name: string, version: string, env: Env): Promise<Response> {
  const data = await env.VERSION_HISTORY.get(`${name}:${version}`);
  if (!data) return Response.json({ error: 'Version not found' }, { status: 404 });
  return Response.json(JSON.parse(data));
}

async function validateData(name: string, request: Request, env: Env): Promise<Response> {
  const data = await request.json();
  const schemaStr = await env.SCHEMAS.get(name);
  if (!schemaStr) return Response.json({ error: 'Schema not found' }, { status: 404 });

  const schema = JSON.parse(schemaStr);
  const errors: string[] = [];

  // Basic validation
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in (data as Record<string, unknown>))) errors.push(`Missing required field: ${field}`);
    }
  }

  // Type checking
  if (schema.properties) {
    for (const [field, prop] of Object.entries(schema.properties as Record<string, Record<string, string>>)) {
      if (field in (data as Record<string, unknown>)) {
        const value = (data as Record<string, unknown>)[field];
        if (prop.type === 'string' && typeof value !== 'string') {
          errors.push(`Field ${field} must be string`);
        }
        if (prop.type === 'integer' && !Number.isInteger(value)) {
          errors.push(`Field ${field} must be integer`);
        }
      }
    }
  }

  return Response.json({ valid: errors.length === 0, errors, schema: name });
}

async function diffVersions(name: string, request: Request, env: Env): Promise<Response> {
  const { from, to } = await request.json() as { from: string; to: string };

  const fromData = await env.VERSION_HISTORY.get(`${name}:${from}`);
  const toData = await env.SCHEMAS.get(name);

  if (!fromData || !toData) {
    return Response.json({ error: 'Version not found' }, { status: 404 });
  }

  const fromSchema = JSON.parse(fromData);
  const toSchema = JSON.parse(toData);

  const added = Object.keys(toSchema.properties || {}).filter(k => !(k in (fromSchema.properties || {})));
  const removed = Object.keys(fromSchema.properties || {}).filter(k => !(k in (toSchema.properties || {})));
  const modified = Object.keys(toSchema.properties || {}).filter(k =>
    k in (fromSchema.properties || {}) && JSON.stringify(toSchema.properties[k]) !== JSON.stringify(fromSchema.properties[k])
  );

  return Response.json({ from, to, added, removed, modified });
}

async function searchSchemas(url: URL, env: Env): Promise<Response> {
  const query = url.searchParams.get('q') || '';
  const list = await env.SCHEMAS.list();
  const results = [];

  for (const key of list.keys) {
    const data = await env.SCHEMAS.get(key.name);
    if (data) {
      const schema = JSON.parse(data);
      const searchText = JSON.stringify(schema).toLowerCase();
      if (searchText.includes(query.toLowerCase())) {
        results.push({ name: key.name, version: schema.version, description: schema.description });
      }
    }
  }

  return Response.json({ results, total: results.length });
}
