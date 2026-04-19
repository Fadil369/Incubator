/**
 * Workers-compatible GitHub proxy & automation routes.
 *
 * Proxies GitHub REST API calls so the PAT never has to leave the Worker,
 * and provides automation endpoints (create repo from template, dispatch
 * workflow, install GitHub App) consumed by the Incubator startup portals.
 */

import { Hono, type Context } from 'hono';
import { jwtVerify, type JWTPayload } from 'jose';

interface GithubAuthClaims extends JWTPayload {
  org?: string;
  startupOrg?: string;
  startupSlug?: string;
  organizations?: string[];
  role?: string;
}

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_ORG: string;
  GITHUB_APP_ID?: string;
  JWT_SECRET: string;
  DB: D1Database;
}

const GITHUB_API = 'https://api.github.com';

type GithubRouteContext = {
  Bindings: Env;
  Variables: {
    authClaims: GithubAuthClaims;
  };
};

const github = new Hono<GithubRouteContext>();

// ── Router-level JWT auth middleware (protects all routes) ────────────────────
github.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(c.env.JWT_SECRET));
    c.set('authClaims', verified.payload as GithubAuthClaims);
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'brainsait-incubator/2.0',
    'Content-Type': 'application/json',
  };
}

async function ghFetch(path: string, token: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: { ...ghHeaders(token), ...(options.headers as Record<string, string> ?? {}) },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isAdmin(claims: GithubAuthClaims): boolean {
  return claims.role === 'ADMIN' || claims.role === 'SUPER_ADMIN';
}

function getAuthorizedOrgs(claims: GithubAuthClaims): string[] {
  return [
    claims.org,
    claims.startupOrg,
    ...(Array.isArray(claims.organizations) ? claims.organizations : []),
  ].filter(isNonEmptyString);
}

async function readGithubError(response: Response): Promise<{ message: string; status: number }> {
  const raw = await response.text().catch(() => '');
  if (!raw) {
    return { message: response.statusText || 'Unknown GitHub API error', status: response.status };
  }

  try {
    const parsed = JSON.parse(raw) as { message?: string; error?: string };
    return {
      message: parsed.message ?? parsed.error ?? raw,
      status: response.status,
    };
  } catch {
    return { message: raw, status: response.status };
  }
}

async function buildGithubErrorResponse(c: Context<GithubRouteContext>, response: Response): Promise<Response> {
  const error = await readGithubError(response);
  return c.json(
    {
      error: 'GitHub API error',
      status: error.status,
      message: error.message,
    },
    502
  );
}

async function proxyGithubResponse(
  c: Context<GithubRouteContext>,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await ghFetch(path, c.env.GITHUB_TOKEN, options);
  if (!response.ok) {
    return buildGithubErrorResponse(c, response);
  }

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  });
}

function requireGithubOrgAccess(c: Context<GithubRouteContext>, org: string): Response | null {
  if (org !== c.env.GITHUB_ORG) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const claims = c.get('authClaims');
  const allowedOrgs = getAuthorizedOrgs(claims);
  if (!isAdmin(claims) && allowedOrgs.length > 0 && !allowedOrgs.includes(org)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return null;
}

function requireStartupSlugAccess(c: Context<GithubRouteContext>, slug: string): Response | null {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return c.json({ error: 'Invalid startup slug' }, 400);
  }

  const claims = c.get('authClaims');
  if (!isAdmin(claims) && isNonEmptyString(claims.startupSlug) && claims.startupSlug !== slug) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  return null;
}

async function writeGithubAutomationAudit(
  db: D1Database,
  type: string,
  target: string,
  payload: Record<string, unknown>
): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS github_automations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      target TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await db.prepare(
    'INSERT OR IGNORE INTO github_automations (id, type, target, payload, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(crypto.randomUUID(), type, target, JSON.stringify(payload), new Date().toISOString())
    .run();
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function getRepoSlugPrefix(slug: string): string {
  return `${slug}-`;
}

function isStartupRepoName(repoName: string, startupSlug: string): boolean {
  return repoName === startupSlug || repoName.startsWith(getRepoSlugPrefix(startupSlug));
}

function requireRepoOwnerAccess(c: Context<GithubRouteContext>, owner: string): Response | null {
  return requireGithubOrgAccess(c, owner);
}

function requireConfiguredTemplateOwner(c: Context<GithubRouteContext>, templateOwner: string): Response | null {
  if (templateOwner !== c.env.GITHUB_ORG) {
    return c.json({
      success: false,
      message: `templateRepo must belong to the configured incubator org (${c.env.GITHUB_ORG})`,
    }, 403);
  }

  return null;
}

// ── Organisation repos ────────────────────────────────────────────────────────

github.get('/orgs/:org/repos', async (c) => {
  const { org } = c.req.param();
  const authError = requireGithubOrgAccess(c, org);
  if (authError) return authError;

  return proxyGithubResponse(c, `/orgs/${org}/repos?type=all&per_page=100&sort=updated`);
});

// ── Organisation templates (repos marked is_template) ─────────────────────────

github.get('/orgs/:org/templates', async (c) => {
  const { org } = c.req.param();
  const authError = requireGithubOrgAccess(c, org);
  if (authError) return authError;

  const res = await ghFetch(
    `/orgs/${org}/repos?type=all&per_page=100`,
    c.env.GITHUB_TOKEN
  );
  if (!res.ok) {
    return buildGithubErrorResponse(c, res);
  }
  const repos: Array<Record<string, unknown>> = await res.json();
  const templates = repos.filter((r) => r.is_template === true);
  return c.json(templates);
});

// ── Organisation projects ──────────────────────────────────────────────────────

github.get('/orgs/:org/projects', async (c) => {
  const { org } = c.req.param();
  const authError = requireGithubOrgAccess(c, org);
  if (authError) return authError;

  return proxyGithubResponse(c, `/orgs/${org}/projects?state=open&per_page=50`, {
    headers: { Accept: 'application/vnd.github.inertia-preview+json' },
  });
});

// ── Startup repos (repos whose name begins with the startup slug) ─────────────

github.get('/startups/:slug/repos', async (c) => {
  const slug = c.req.param('slug').trim().toLowerCase();
  const orgError = requireGithubOrgAccess(c, c.env.GITHUB_ORG);
  if (orgError) return orgError;

  const slugError = requireStartupSlugAccess(c, slug);
  if (slugError) return slugError;

  const org = c.env.GITHUB_ORG;
  const res = await ghFetch(
    `/orgs/${org}/repos?type=all&per_page=100&sort=updated`,
    c.env.GITHUB_TOKEN
  );
  if (!res.ok) {
    return buildGithubErrorResponse(c, res);
  }
  const repos: Array<Record<string, unknown>> = await res.json();
  const startupRepos = repos.filter(
    (r) => typeof r.name === 'string' && isStartupRepoName(r.name, slug)
  );
  return c.json(startupRepos);
});

// ── Single repo ───────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}`);
});

// ── Workflows ─────────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/workflows', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/actions/workflows`);
});

github.get('/repos/:owner/:repo/workflows/:workflowId/runs', async (c) => {
  const { owner, repo, workflowId } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=20`);
});

github.get('/repos/:owner/:repo/runs', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/actions/runs?per_page=20`);
});

// ── Releases ──────────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/releases', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/releases?per_page=10`);
});

// ── Issues ────────────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/issues', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/issues?state=open&per_page=30`);
});

// ── Pull Requests ─────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/pulls', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/pulls?state=open&per_page=30`);
});

// ── Repo Projects ─────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/projects', async (c) => {
  const { owner, repo } = c.req.param();
  const authError = requireRepoOwnerAccess(c, owner);
  if (authError) return authError;

  return proxyGithubResponse(c, `/repos/${owner}/${repo}/projects?state=open&per_page=20`, {
    headers: { Accept: 'application/vnd.github.inertia-preview+json' },
  });
});

// ── Automation: Create repo from template ────────────────────────────────────

github.post('/automation/repos/from-template', async (c) => {
  type Body = {
    templateRepo: string;
    newRepoName: string;
    description?: string;
    private?: boolean;
    includeAllBranches?: boolean;
  };
  const body = await c.req.json<Body>();

  if (!body.templateRepo || !body.newRepoName) {
    return c.json({ success: false, message: 'templateRepo and newRepoName are required' }, 400);
  }

  const templateRepoParts = body.templateRepo.split('/');
  if (
    templateRepoParts.length !== 2 ||
    !templateRepoParts[0] ||
    !templateRepoParts[1]
  ) {
    return c.json({ success: false, message: 'templateRepo must be in the format "owner/repo"' }, 400);
  }

  const [templateOwner, templateRepoName] = templateRepoParts;
  const templateAccessError = requireConfiguredTemplateOwner(c, templateOwner);
  if (templateAccessError) return templateAccessError;

  const org = c.env.GITHUB_ORG;

  const res = await ghFetch(
    `/repos/${templateOwner}/${templateRepoName}/generate`,
    c.env.GITHUB_TOKEN,
    {
      method: 'POST',
      body: JSON.stringify({
        owner: org,
        name: body.newRepoName,
        description: body.description ?? '',
        private: body.private ?? true,
        include_all_branches: body.includeAllBranches ?? false,
      }),
    }
  );

  if (!res.ok) {
    const error = await readGithubError(res);
    return c.json({ success: false, message: error.message }, 422);
  }

  const repo: Record<string, unknown> = await res.json();

  await writeGithubAutomationAudit(c.env.DB, 'create_repo', String(repo.full_name ?? ''), body);

  return c.json({ success: true, message: `Repository ${String(repo.full_name)} created`, data: repo });
});

// ── Automation: Dispatch workflow ─────────────────────────────────────────────

github.post('/automation/workflows/dispatch', async (c) => {
  type Body = {
    owner: string;
    repo: string;
    workflowId: string | number;
    ref?: string;
    inputs?: Record<string, string>;
  };
  const body = await c.req.json<Body>();

  if (!body.owner || !body.repo || !body.workflowId) {
    return c.json({ success: false, message: 'owner, repo, and workflowId are required' }, 400);
  }

  const ownerError = requireRepoOwnerAccess(c, body.owner);
  if (ownerError) {
    return ownerError;
  }

  const res = await ghFetch(
    `/repos/${body.owner}/${body.repo}/actions/workflows/${body.workflowId}/dispatches`,
    c.env.GITHUB_TOKEN,
    {
      method: 'POST',
      body: JSON.stringify({ ref: body.ref ?? 'main', inputs: body.inputs ?? {} }),
    }
  );

  // 204 = success for workflow dispatch
  if (res.status === 204 || res.ok) {
    await writeGithubAutomationAudit(c.env.DB, 'dispatch_workflow', `${body.owner}/${body.repo}`, asRecord(body));
    return c.json({ success: true, message: 'Workflow dispatched successfully' });
  }

  const error = await readGithubError(res);
  return c.json({ success: false, message: error.message }, 422);
});

// ── Automation: Request GitHub App install ────────────────────────────────────

github.post('/automation/apps/install', async (c) => {
  type Body = { org: string; repo: string };
  const body = await c.req.json<Body>();

  if (!body.org || !body.repo) {
    return c.json({ success: false, message: 'org and repo are required' }, 400);
  }

  const orgError = requireGithubOrgAccess(c, body.org);
  if (orgError) {
    return orgError;
  }

  const appId = c.env.GITHUB_APP_ID;
  if (!appId) {
    return c.json({
      success: false,
      message: 'GitHub App is not configured on this server. Contact the platform administrator.',
    }, 503);
  }

  // Resolve org to numeric ID so the install URL is correct
  const orgRes = await ghFetch(`/orgs/${body.org}`, c.env.GITHUB_TOKEN);
  if (!orgRes.ok) {
    const error = await readGithubError(orgRes);
    return c.json({ success: false, message: error.message }, 422);
  }
  const orgData = (await orgRes.json()) as { id: number };

  // The standard GitHub App install flow; deep-link directly to the install page.
  // Repository selection happens in the browser after the user authorises.
  const installUrl = `https://github.com/apps/brainsait-incubator/installations/new?target_id=${orgData.id}&target_type=Organization`;

  await writeGithubAutomationAudit(c.env.DB, 'install_app', `${body.org}/${body.repo}`, asRecord(body));

  return c.json({
    success: true,
    message: 'Follow the link to install the GitHub App',
    data: { installUrl },
  });
});

export default github;
