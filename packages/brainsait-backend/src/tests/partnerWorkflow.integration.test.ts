import { Hono } from 'hono';
import { cors } from 'hono/cors';
import partnersRoutes, { publicPartnerIntakeRoutes } from '../routes/workers/partners';

function createPartnerApp() {
  const app = new Hono<{ Bindings: ReturnType<typeof createEnv> }>();

  app.use('*', cors({
    origin: (origin, c) => {
      const allowed = (c.env.CORS_ORIGINS || 'https://brainsait.org,http://localhost:3000').split(',');
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'cf-connecting-ip'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
  }));

  app.route('/api/v1/partners', partnersRoutes);
  app.route('/', publicPartnerIntakeRoutes);

  return app;
}

const partnerApp = createPartnerApp();

class MockKVNamespace {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async put(key: string, value: string, _options?: unknown): Promise<void> {
    this.store.set(key, value);
  }

  async list(options?: { prefix?: string; cursor?: string }): Promise<{ keys: Array<{ name: string }>; cursor?: string }> {
    const prefix = options?.prefix ?? '';
    const keys = [...this.store.keys()]
      .filter((key) => key.startsWith(prefix))
      .sort()
      .map((name) => ({ name }));

    return { keys, cursor: undefined };
  }
}

function createEnv(overrides: Record<string, unknown> = {}) {
  return {
    ADMIN_KEY: 'test-admin-key',
    API_BASE_URL: 'https://api.brainsait.org',
    ANTHROPIC_API_KEY: '',
    AUDIT_LOG: {},
    AI: {},
    CACHE: new MockKVNamespace(),
    CONFIG: new MockKVNamespace(),
    CORS_ORIGINS: 'https://brainsait.org,http://localhost:3000',
    DATA_CONTRACTS: {},
    DATABASE_URL: 'postgresql://example.invalid/test',
    DB: {},
    DOCUMENTS: {},
    FEATURE_FLAGS: new MockKVNamespace(),
    FRONTEND_URL: 'https://brainsait.org',
    GITHUB_APP_ID: '',
    GITHUB_APP_PRIVATE_KEY: '',
    GITHUB_ORG: '',
    GITHUB_REPO: '',
    GITHUB_TOKEN: '',
    JWT_SECRET: 'test-jwt-secret',
    NODE_ENV: 'test',
    OPENAI_API_KEY: '',
    PARTNER_APPLICATIONS: new MockKVNamespace(),
    RATE_LIMIT: new MockKVNamespace(),
    SESSIONS: new MockKVNamespace(),
    SENDGRID_API_KEY: '',
    STARTUP_REGISTRY: new MockKVNamespace(),
    UPLOADS: {},
    ...overrides,
  } as Record<string, unknown> & {
    PARTNER_APPLICATIONS: MockKVNamespace;
    RATE_LIMIT: MockKVNamespace;
    STARTUP_REGISTRY: MockKVNamespace;
  };
}

function buildApplicationPayload(overrides: Partial<Record<string, string>> = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    firstName: 'Amina',
    lastName: 'Faris',
    email: `partner-${suffix}@example.com`,
    organization: `Alpha Health ${suffix}`,
    country: 'Saudi Arabia',
    partnerType: 'tech',
    description: 'We build digital health workflow software for clinics and want to partner with BrainSAIT on product validation, distribution, and incubation support.',
    ...overrides,
  };
}

async function requestJson<T>(
  env: ReturnType<typeof createEnv>,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: T }> {
  const response = await partnerApp.fetch(
    new Request(`https://api.brainsait.org${path}`, init),
    env,
  );

  const body = await response.json() as T;
  return { response, body };
}

describe('partner workflow integration', () => {
  it('supports public application intake on both routes, validates payloads, and enforces rate limiting', async () => {
    const corsEnv = createEnv();
    const optionsResponse = await partnerApp.fetch(
      new Request('https://api.brainsait.org/apply', {
        method: 'OPTIONS',
        headers: { Origin: 'https://brainsait.org' },
      }),
      corsEnv,
    );

    expect(optionsResponse.status).toBe(204);
    expect(optionsResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://brainsait.org');

    const invalidEnv = createEnv();
    const invalidEmail = await requestJson<{ error: string }>(invalidEnv, '/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicationPayload({ email: 'invalid' })),
    });

    expect(invalidEmail.response.status).toBe(400);
    expect(invalidEmail.body.error).toBe('Invalid email address');

    const invalidType = await requestJson<{ error: string }>(invalidEnv, '/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicationPayload({ partnerType: 'unknown' })),
    });

    expect(invalidType.response.status).toBe(400);
    expect(invalidType.body.error).toContain('Invalid partnerType');

    const apiRouteEnv = createEnv();
    const apiSubmission = await requestJson<{ success: boolean; applicationId: string; referenceId: string }>(apiRouteEnv, '/api/v1/partners/application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicationPayload()),
    });

    expect(apiSubmission.response.status).toBe(200);
    expect(apiSubmission.body.success).toBe(true);
    expect(apiSubmission.body.referenceId).toMatch(/^BSP-/);

    const rateLimitEnv = createEnv();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const submission = await requestJson<{ success: boolean }>(rateLimitEnv, '/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '203.0.113.10',
        },
        body: JSON.stringify(buildApplicationPayload({ organization: `Rate Limited Org ${attempt}` })),
      });

      expect(submission.response.status).toBe(200);
      expect(submission.body.success).toBe(true);
    }

    const blocked = await requestJson<{ error: string }>(rateLimitEnv, '/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '203.0.113.10',
      },
      body: JSON.stringify(buildApplicationPayload({ organization: 'Rate Limited Org Final' })),
    });

    expect(blocked.response.status).toBe(429);
    expect(blocked.body.error).toContain('Too many applications');
  });

  it('requires admin credentials for protected partner routes', async () => {
    const env = createEnv();
    const listWithoutKey = await requestJson<{ error: string }>(env, '/api/v1/partners/applications');

    expect(listWithoutKey.response.status).toBe(401);
    expect(listWithoutKey.body.error).toBe('Unauthorized');

    const created = await requestJson<{ applicationId: string }>(env, '/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicationPayload()),
    });

    const acceptWithoutKey = await requestJson<{ error: string }>(env, `/api/v1/partners/applications/${created.body.applicationId}/accept`, {
      method: 'POST',
    });

    expect(acceptWithoutKey.response.status).toBe(401);
    expect(acceptWithoutKey.body.error).toBe('Unauthorized');
  });

  it('completes the accept, validate, and onboarding workflow and registers the startup', async () => {
    const env = createEnv();
    const applicationPayload = buildApplicationPayload({ organization: 'Alpha Health Platform' });
    const created = await requestJson<{ success: boolean; applicationId: string }>(env, '/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationPayload),
    });

    const applicationId = created.body.applicationId;
    const accepted = await requestJson<{
      success: boolean;
      applicationId: string;
      startupSlug: string;
      portalUrl: string;
      emailSent: boolean;
    }>(env, `/api/v1/partners/applications/${applicationId}/accept`, {
      method: 'POST',
      headers: { 'x-admin-key': 'test-admin-key' },
    });

    expect(accepted.response.status).toBe(200);
    expect(accepted.body.success).toBe(true);
    expect(accepted.body.applicationId).toBe(applicationId);
    expect(accepted.body.startupSlug).toBe('alpha-health-platform');
    expect(accepted.body.emailSent).toBe(false);

    const portalUrl = new URL(accepted.body.portalUrl);
    const inviteToken = portalUrl.searchParams.get('token');
    const inviteAppId = portalUrl.searchParams.get('app');

    expect(portalUrl.pathname).toBe('/portal/accept');
    expect(inviteToken).toBeTruthy();
    expect(inviteAppId).toBe(applicationId);

    const invalidValidation = await requestJson<{ error: string }>(env, `/api/v1/partners/validate?token=${encodeURIComponent(inviteToken ?? '')}&app=wrong-id`);
    expect(invalidValidation.response.status).toBe(401);
    expect(invalidValidation.body.error).toBe('Invalid or expired invitation link');

    const validated = await requestJson<{
      valid: boolean;
      application: { id: string; status: string; startupSlug?: string; inviteToken?: string };
    }>(env, `/api/v1/partners/validate?token=${encodeURIComponent(inviteToken ?? '')}&app=${applicationId}`);

    expect(validated.response.status).toBe(200);
    expect(validated.body.valid).toBe(true);
    expect(validated.body.application.id).toBe(applicationId);
    expect(validated.body.application.status).toBe('ACCEPTED');
    expect(validated.body.application.inviteToken).toBeUndefined();

    const onboarded = await requestJson<{
      success: boolean;
      startupSlug: string;
      referenceId: string;
      message: string;
    }>(env, '/api/v1/partners/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: inviteToken,
        appId: applicationId,
        timezone: 'Asia/Riyadh',
        linkedIn: 'https://linkedin.com/in/amina-faris',
      }),
    });

    expect(onboarded.response.status).toBe(200);
    expect(onboarded.body.success).toBe(true);
    expect(onboarded.body.startupSlug).toBe('alpha-health-platform');
    expect(onboarded.body.referenceId).toMatch(/^BSP-/);

    const registryRaw = await env.STARTUP_REGISTRY.get('startup:alpha-health-platform');
    expect(registryRaw).toBeTruthy();
    expect(JSON.parse(registryRaw ?? '{}')).toMatchObject({
      slug: 'alpha-health-platform',
      organization: 'Alpha Health Platform',
      partnerType: 'tech',
      status: 'active',
    });

    const storedRaw = await env.PARTNER_APPLICATIONS.get(`application:${applicationId}`);
    expect(storedRaw).toBeTruthy();
    expect(JSON.parse(storedRaw ?? '{}')).toMatchObject({
      id: applicationId,
      status: 'ONBOARDED',
      startupSlug: 'alpha-health-platform',
      timezone: 'Asia/Riyadh',
      linkedIn: 'https://linkedin.com/in/amina-faris',
    });

    const duplicateAccept = await requestJson<{ error: string }>(env, `/api/v1/partners/applications/${applicationId}/accept`, {
      method: 'POST',
      headers: { 'x-admin-key': 'test-admin-key' },
    });

    expect(duplicateAccept.response.status).toBe(409);
    expect(duplicateAccept.body.error).toBe('Application is already ONBOARDED');
  });

  it('supports rejection and prevents duplicate rejection', async () => {
    const env = createEnv();
    const created = await requestJson<{ applicationId: string }>(env, '/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApplicationPayload({ organization: 'Rejected Partner Org' })),
    });

    const applicationId = created.body.applicationId;
    const rejected = await requestJson<{ success: boolean; emailSent: boolean; message: string }>(env, `/api/v1/partners/applications/${applicationId}/reject`, {
      method: 'POST',
      headers: { 'x-admin-key': 'test-admin-key' },
    });

    expect(rejected.response.status).toBe(200);
    expect(rejected.body.success).toBe(true);
    expect(rejected.body.emailSent).toBe(false);

    const application = await requestJson<{
      id: string;
      status: string;
      rejectedAt?: string;
    }>(env, `/api/v1/partners/applications/${applicationId}`, {
      headers: { 'x-admin-key': 'test-admin-key' },
    });

    expect(application.response.status).toBe(200);
    expect(application.body.status).toBe('REJECTED');
    expect(application.body.rejectedAt).toBeTruthy();

    const duplicateReject = await requestJson<{ error: string }>(env, `/api/v1/partners/applications/${applicationId}/reject`, {
      method: 'POST',
      headers: { 'x-admin-key': 'test-admin-key' },
    });

    expect(duplicateReject.response.status).toBe(409);
    expect(duplicateReject.body.error).toBe('Application is already rejected');
  });
});