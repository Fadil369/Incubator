/**
 * Workers-compatible GitHub proxy & automation routes.
 *
 * Proxies GitHub REST API calls so the PAT never has to leave the Worker,
 * and provides automation endpoints (create repo from template, dispatch
 * workflow, install GitHub App) consumed by the Incubator startup portals.
 */

import { Hono } from 'hono';

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_ORG: string;
  GITHUB_APP_ID?: string;
  DB: D1Database;
}

const GITHUB_API = 'https://api.github.com';

const github = new Hono<{ Bindings: Env }>();

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

// ── Organisation repos ────────────────────────────────────────────────────────

github.get('/orgs/:org/repos', async (c) => {
  const { org } = c.req.param();
  const res = await ghFetch(
    `/orgs/${org}/repos?type=all&per_page=100&sort=updated`,
    c.env.GITHUB_TOKEN
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Organisation templates (repos marked is_template) ─────────────────────────

github.get('/orgs/:org/templates', async (c) => {
  const { org } = c.req.param();
  const res = await ghFetch(
    `/orgs/${org}/repos?type=all&per_page=100`,
    c.env.GITHUB_TOKEN
  );
  if (!res.ok) {
    return c.json({ error: 'GitHub API error', status: res.status }, 502);
  }
  const repos: Array<Record<string, unknown>> = await res.json();
  const templates = repos.filter((r) => r.is_template === true);
  return c.json(templates);
});

// ── Organisation projects ──────────────────────────────────────────────────────

github.get('/orgs/:org/projects', async (c) => {
  const { org } = c.req.param();
  const res = await ghFetch(
    `/orgs/${org}/projects?state=open&per_page=50`,
    c.env.GITHUB_TOKEN,
    { headers: { Accept: 'application/vnd.github.inertia-preview+json' } }
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Startup repos (repos whose name begins with the startup slug) ─────────────

github.get('/startups/:slug/repos', async (c) => {
  const { slug } = c.req.param();
  const org = c.env.GITHUB_ORG;
  const res = await ghFetch(
    `/orgs/${org}/repos?type=all&per_page=100&sort=updated`,
    c.env.GITHUB_TOKEN
  );
  if (!res.ok) {
    return c.json({ error: 'GitHub API error' }, 502);
  }
  const repos: Array<Record<string, unknown>> = await res.json();
  const startupRepos = repos.filter(
    (r) => typeof r.name === 'string' && r.name.startsWith(slug)
  );
  return c.json(startupRepos);
});

// ── Single repo ───────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(`/repos/${owner}/${repo}`, c.env.GITHUB_TOKEN);
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Workflows ─────────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/workflows', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(`/repos/${owner}/${repo}/actions/workflows`, c.env.GITHUB_TOKEN);
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

github.get('/repos/:owner/:repo/workflows/:workflowId/runs', async (c) => {
  const { owner, repo, workflowId } = c.req.param();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?per_page=20`,
    c.env.GITHUB_TOKEN
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

github.get('/repos/:owner/:repo/runs', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/actions/runs?per_page=20`,
    c.env.GITHUB_TOKEN
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Releases ──────────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/releases', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/releases?per_page=10`,
    c.env.GITHUB_TOKEN
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Issues ────────────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/issues', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/issues?state=open&per_page=30`,
    c.env.GITHUB_TOKEN
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Pull Requests ─────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/pulls', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/pulls?state=open&per_page=30`,
    c.env.GITHUB_TOKEN
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
});

// ── Repo Projects ─────────────────────────────────────────────────────────────

github.get('/repos/:owner/:repo/projects', async (c) => {
  const { owner, repo } = c.req.param();
  const res = await ghFetch(
    `/repos/${owner}/${repo}/projects?state=open&per_page=20`,
    c.env.GITHUB_TOKEN,
    { headers: { Accept: 'application/vnd.github.inertia-preview+json' } }
  );
  return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
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
    const error: Record<string, unknown> = await res.json().catch(() => ({ message: 'Unknown error' }));
    return c.json({ success: false, message: String(error.message ?? 'GitHub API error') }, 422);
  }

  const repo: Record<string, unknown> = await res.json();

  // Log to D1
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO github_automations (id, type, target, payload, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(crypto.randomUUID(), 'create_repo', String(repo.full_name ?? ''), JSON.stringify(body), new Date().toISOString())
    .run()
    .catch((err: unknown) => {
      console.warn('github_automations D1 insert failed (table may not exist yet):', err);
    });

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
    return c.json({ success: true, message: 'Workflow dispatched successfully' });
  }

  const error: Record<string, unknown> = await res.json().catch(() => ({ message: 'Unknown error' }));
  return c.json({ success: false, message: String(error.message ?? 'GitHub API error') }, 422);
});

// ── Automation: Request GitHub App install ────────────────────────────────────

github.post('/automation/apps/install', async (c) => {
  type Body = { org: string; repo: string };
  const body = await c.req.json<Body>();

  if (!body.org || !body.repo) {
    return c.json({ success: false, message: 'org and repo are required' }, 400);
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
    return c.json({ success: false, message: `Could not resolve org "${body.org}"` }, 422);
  }
  const orgData = await orgRes.json<{ id: number }>();

  // The standard GitHub App install flow; deep-link directly to the install page.
  // Repository selection happens in the browser after the user authorises.
  const installUrl = `https://github.com/apps/brainsait-incubator/installations/new?target_id=${orgData.id}&target_type=Organization`;

  return c.json({
    success: true,
    message: 'Follow the link to install the GitHub App',
    data: { installUrl },
  });
});

export default github;
