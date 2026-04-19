/**
 * BrainSAIT Shared Libraries
 * Common utilities used across all incubator startups
 */

// ── Auth Client ──
export * from './auth-client';

// ── Data Contracts ──
export * from './data-contracts';

// ── Event Bus Client ──
export * from './event-bus';

// ── Logging (HIPAA-compliant, PHI-safe) ──
export * from './logger';

// ── Health Checks ──
export * from './health';

// ── Common Types ──
export interface StartupMeta {
  id: string;
  name: string;
  sector: string;
  tier: 'sandbox' | 'staging' | 'production';
  createdAt: Date;
}

export interface IncubatorEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

export interface DataContract {
  name: string;
  version: string;
  description: string;
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
  hipaa_compliant: boolean;
  pii_fields: string[];
  sharing_policy: 'public' | 'internal' | 'anonymized-only' | 'restricted';
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: string; latency?: number }>;
  timestamp: string;
}
