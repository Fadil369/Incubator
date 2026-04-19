/**
 * Partner lifecycle frontend service.
 * Communicates with /api/v1/partners on the backend Worker.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.brainsait.org';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message: string;
    try {
      message = (JSON.parse(text) as { error?: string }).error ?? `HTTP ${response.status}`;
    } catch {
      message = text || `HTTP ${response.status}`;
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ONBOARDED';

export interface PartnerApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  country: string;
  partnerType: string;
  description: string;
  status: ApplicationStatus;
  referenceId: string;
  inviteSentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  onboardedAt?: string;
  startupSlug?: string;
  githubRepo?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Public ────────────────────────────────────────────────────────────────────

export async function submitPartnerApplication(data: {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  country: string;
  partnerType: string;
  description: string;
}): Promise<{ success: boolean; applicationId: string; referenceId: string }> {
  return apiFetch('/api/v1/partners/application', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function validateInviteToken(
  token: string,
  appId: string
): Promise<{ valid: boolean; application: PartnerApplication }> {
  const params = new URLSearchParams({ token, app: appId });
  return apiFetch(`/api/v1/partners/validate?${params}`);
}

export async function completeOnboarding(data: {
  token: string;
  appId: string;
  timezone?: string;
  linkedIn?: string;
}): Promise<{ success: boolean; startupSlug: string; referenceId: string; message: string }> {
  return apiFetch('/api/v1/partners/complete-onboarding', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Admin (requires X-Admin-Key header) ──────────────────────────────────────

export async function listApplications(
  adminKey: string,
  status?: ApplicationStatus
): Promise<{ applications: PartnerApplication[]; total: number }> {
  const params = status ? `?status=${status}` : '';
  return apiFetch(`/api/v1/partners/applications${params}`, {
    headers: { 'x-admin-key': adminKey },
  });
}

export async function getApplication(adminKey: string, id: string): Promise<PartnerApplication> {
  return apiFetch(`/api/v1/partners/applications/${id}`, {
    headers: { 'x-admin-key': adminKey },
  });
}

export async function acceptApplication(
  adminKey: string,
  id: string
): Promise<{ success: boolean; applicationId: string; startupSlug: string; portalUrl: string; message: string }> {
  return apiFetch(`/api/v1/partners/applications/${id}/accept`, {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
  });
}

export async function rejectApplication(
  adminKey: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/v1/partners/applications/${id}/reject`, {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
  });
}
