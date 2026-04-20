import {
  getIncubatorAppBySlug,
  getIncubatorAppsByCategory,
  graduationShowcase,
  incubatorAppCategories,
  incubatorApps,
  incubatorCourses,
  incubatorResources,
  incubatorWorkshops,
  sharedCourseContracts,
  type AppCategory,
  type IncubatorApp,
  type ResourceItem,
  type ResourceWorkshop,
  type SharedCourseBundle,
  type SharedDataContract,
  type ShowcaseCohort,
} from '@/lib/incubator/content';

export type {
  AppCategory,
  IncubatorApp,
  ResourceItem,
  ResourceWorkshop,
  SharedCourseBundle,
  SharedDataContract,
  ShowcaseCohort,
} from '@/lib/incubator/content';

const DATA_HUB_URL = process.env.NEXT_PUBLIC_DATA_HUB_URL || 'https://data-hub.brainsait.org';
const EVENT_BRIDGE_URL = process.env.NEXT_PUBLIC_EVENT_BRIDGE_URL || 'https://events.brainsait.org';

export interface ResourceLibraryPayload {
  resources: ResourceItem[];
  workshops: ResourceWorkshop[];
  courses: SharedCourseBundle[];
  sharedContracts: SharedDataContract[];
}

export interface AppCatalogPayload {
  categories: AppCategory[];
  apps: IncubatorApp[];
}

function defaultResourceLibrary(): ResourceLibraryPayload {
  return {
    resources: incubatorResources,
    workshops: incubatorWorkshops,
    courses: incubatorCourses,
    sharedContracts: sharedCourseContracts,
  };
}

function defaultAppCatalog(category?: string): AppCatalogPayload {
  return {
    categories: incubatorAppCategories,
    apps: category ? getIncubatorAppsByCategory(category) : incubatorApps,
  };
}

async function requestJson<T>(url: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getResourceLibrary(): Promise<ResourceLibraryPayload> {
  return requestJson<ResourceLibraryPayload>(`${DATA_HUB_URL}/api/v1/resources`, defaultResourceLibrary());
}

export async function getAppCatalog(category?: string): Promise<AppCatalogPayload> {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return requestJson<AppCatalogPayload>(`${DATA_HUB_URL}/api/v1/apps${query}`, defaultAppCatalog(category));
}

export async function getAppCategories(): Promise<AppCategory[]> {
  return requestJson<AppCategory[]>(`${DATA_HUB_URL}/api/v1/apps/categories`, incubatorAppCategories);
}

export async function getAppDetail(slug: string): Promise<IncubatorApp | undefined> {
  return requestJson<IncubatorApp | undefined>(`${DATA_HUB_URL}/api/v1/apps/${slug}`, getIncubatorAppBySlug(slug));
}

export async function getShowcase(): Promise<ShowcaseCohort[]> {
  return requestJson<ShowcaseCohort[]>(`${DATA_HUB_URL}/api/v1/showcase`, graduationShowcase);
}

export async function getCourseBundles(): Promise<SharedCourseBundle[]> {
  return requestJson<SharedCourseBundle[]>(`${DATA_HUB_URL}/api/v1/courses`, incubatorCourses);
}

export async function getSharedContracts(): Promise<SharedDataContract[]> {
  return requestJson<SharedDataContract[]>(`${DATA_HUB_URL}/api/v1/contracts/shared`, sharedCourseContracts);
}

export async function createDataSubscription(payload: {
  source: string;
  target: string;
  contractRef: string;
  dataTypes: string[];
}): Promise<{ status: string; id?: string }> {
  const fallback = {
    status: 'pending',
    id: `subscription-${Date.now()}`,
  };

  return requestJson<{ status: string; id?: string }>(`${DATA_HUB_URL}/api/v1/subscriptions`, fallback, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function dispatchIncubatorEvent(eventType: string, payload: Record<string, unknown>): Promise<boolean> {
  const result = await requestJson<{ success?: boolean; status?: string; eventId?: string }>(`${EVENT_BRIDGE_URL}/api/v1/events`, { success: false }, {
    method: 'POST',
    body: JSON.stringify({
      type: eventType,
      source: 'brainsait-frontend',
      payload,
    }),
  });

  return Boolean(result.success || result.status === 'queued' || result.eventId);
}