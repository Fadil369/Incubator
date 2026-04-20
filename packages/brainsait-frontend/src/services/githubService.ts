/**
 * GitHub API service for Incubator startup portal integration.
 * Uses the GitHub REST API v3 via the incubator backend proxy so the
 * token never has to be exposed to the browser in production.
 */

import { clearWorkerToken, getWorkerAuthHeaders } from '@/services/workerAuthService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.brainsait.org';
const EVENT_BRIDGE_URL = process.env.NEXT_PUBLIC_EVENT_BRIDGE_URL || 'https://events.brainsait.org';
const GITHUB_ORG = process.env.NEXT_PUBLIC_GITHUB_ORG || 'brainsait-incubator';

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const performFetch = async (forceRefresh: boolean = false) => fetch(url, {
    ...options,
    credentials: 'include',
    headers: { ...(await getWorkerAuthHeaders(forceRefresh)), ...options.headers },
  });

  let response = await performFetch();
  if (response.status === 401) {
    clearWorkerToken();
    response = await performFetch(true);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GitHub service error ${response.status}: ${text}`);
  }
  return response.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  archived: boolean;
  pushed_at: string;
  updated_at: string;
  created_at: string;
  visibility: 'public' | 'private' | 'internal';
}

export interface GitHubWorkflowRun {
  id: number;
  name: string | null;
  head_branch: string;
  head_sha: string;
  status: 'queued' | 'in_progress' | 'completed' | null;
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | null;
  workflow_id: number;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_number: number;
  event: string;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
  path: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  badge_url: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  html_url: string;
  zipball_url: string;
  author: { login: string; avatar_url: string };
}

export interface GitHubProject {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  creator: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  created_at: string;
  updated_at: string;
  pull_request?: { url: string };
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  draft: boolean;
  mergeable: boolean | null;
  head: { ref: string; sha: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
  labels: Array<{ name: string; color: string }>;
}

export interface RepoTemplate {
  name: string;
  description: string;
  full_name: string;
  html_url: string;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  is_template: boolean;
}

export interface CreateRepoFromTemplateRequest {
  templateRepo: string;
  newRepoName: string;
  description?: string;
  private?: boolean;
  includeAllBranches?: boolean;
}

export interface WorkflowDispatchRequest {
  owner: string;
  repo: string;
  workflowId: string | number;
  ref?: string;
  inputs?: Record<string, string>;
}

export interface AutomationResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ── Repository Operations ──────────────────────────────────────────────────────

export async function listOrgRepos(org: string = GITHUB_ORG): Promise<GitHubRepo[]> {
  return apiFetch<GitHubRepo[]>(`${API_BASE_URL}/api/v1/github/orgs/${org}/repos`);
}

export async function getRepo(owner: string, repo: string): Promise<GitHubRepo> {
  return apiFetch<GitHubRepo>(`${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}`);
}

export async function listStartupRepos(startupSlug: string): Promise<GitHubRepo[]> {
  return apiFetch<GitHubRepo[]>(`${API_BASE_URL}/api/v1/github/startups/${startupSlug}/repos`);
}

// ── Templates ─────────────────────────────────────────────────────────────────

export async function listTemplates(org: string = GITHUB_ORG): Promise<RepoTemplate[]> {
  return apiFetch<RepoTemplate[]>(`${API_BASE_URL}/api/v1/github/orgs/${org}/templates`);
}

export async function createRepoFromTemplate(req: CreateRepoFromTemplateRequest): Promise<AutomationResult> {
  return apiFetch<AutomationResult>(`${API_BASE_URL}/api/v1/github/automation/repos/from-template`, {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// ── CI/CD / Workflows ─────────────────────────────────────────────────────────

export async function listWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
  return apiFetch<{ workflows: GitHubWorkflow[] }>(
    `${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/workflows`
  ).then((r) => r.workflows);
}

export async function listWorkflowRuns(
  owner: string,
  repo: string,
  workflowId?: string | number
): Promise<GitHubWorkflowRun[]> {
  const path = workflowId
    ? `${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/workflows/${workflowId}/runs`
    : `${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/runs`;
  return apiFetch<{ workflow_runs: GitHubWorkflowRun[] }>(path).then((r) => r.workflow_runs);
}

export async function triggerWorkflow(req: WorkflowDispatchRequest): Promise<AutomationResult> {
  return apiFetch<AutomationResult>(`${API_BASE_URL}/api/v1/github/automation/workflows/dispatch`, {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// ── Releases ──────────────────────────────────────────────────────────────────

export async function listReleases(owner: string, repo: string): Promise<GitHubRelease[]> {
  return apiFetch<GitHubRelease[]>(`${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/releases`);
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function listOrgProjects(org: string = GITHUB_ORG): Promise<GitHubProject[]> {
  return apiFetch<GitHubProject[]>(`${API_BASE_URL}/api/v1/github/orgs/${org}/projects`);
}

export async function listRepoProjects(owner: string, repo: string): Promise<GitHubProject[]> {
  return apiFetch<GitHubProject[]>(`${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/projects`);
}

// ── Issues & PRs ──────────────────────────────────────────────────────────────

export async function listRepoIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
  return apiFetch<GitHubIssue[]>(`${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/issues`);
}

export async function listRepoPRs(owner: string, repo: string): Promise<GitHubPullRequest[]> {
  return apiFetch<GitHubPullRequest[]>(`${API_BASE_URL}/api/v1/github/repos/${owner}/${repo}/pulls`);
}

// ── GitHub App install ────────────────────────────────────────────────────────

export async function requestAppInstall(org: string, repo: string): Promise<AutomationResult> {
  return apiFetch<AutomationResult>(`${API_BASE_URL}/api/v1/github/automation/apps/install`, {
    method: 'POST',
    body: JSON.stringify({ org, repo }),
  });
}

// ── Event Bridge automation ───────────────────────────────────────────────────

export async function dispatchAutomationEvent(
  type: string,
  payload: Record<string, unknown>
): Promise<{ eventId: string }> {
  return apiFetch<{ eventId: string }>(`${EVENT_BRIDGE_URL}/api/v1/events`, {
    method: 'POST',
    body: JSON.stringify({ type, source: 'incubator-portal', ...payload }),
  });
}
