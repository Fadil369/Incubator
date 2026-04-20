const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.brainsait.org';
const WORKER_TOKEN_STORAGE_KEY = 'brainsait-worker-token';

interface WorkerLoginResponse {
  token: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    org?: string;
    startupOrg?: string;
    startupSlug?: string;
    organizations?: string[];
  };
}

function getPrimaryAppToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

export function getWorkerToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(WORKER_TOKEN_STORAGE_KEY) : null;
}

export function clearWorkerToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(WORKER_TOKEN_STORAGE_KEY);
  }
}

export async function exchangeWorkerToken(): Promise<string | null> {
  const primaryToken = getPrimaryAppToken();
  if (!primaryToken) {
    clearWorkerToken();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${primaryToken}`,
    },
    body: JSON.stringify({ token: primaryToken }),
  });

  if (!response.ok) {
    clearWorkerToken();
    const text = await response.text().catch(() => '');
    throw new Error(`Worker auth exchange failed ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as WorkerLoginResponse;
  if (!payload.token) {
    clearWorkerToken();
    throw new Error('Worker auth exchange did not return a token');
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(WORKER_TOKEN_STORAGE_KEY, payload.token);
  }

  return payload.token;
}

export async function getWorkerAuthHeaders(forceRefresh: boolean = false): Promise<Record<string, string>> {
  const token = forceRefresh ? await exchangeWorkerToken() : (getWorkerToken() ?? (await exchangeWorkerToken()));

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}