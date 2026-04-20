import bcrypt from 'bcryptjs';

export type WorkerAuthRole = 'SME_OWNER' | 'MENTOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface ResolvedWorkerAuthClaims {
  userId: string;
  email: string;
  role: WorkerAuthRole;
  org?: string;
  startupOrg?: string;
  startupSlug?: string;
  organizations?: string[];
}

interface ResolveUserBackedClaimsOptions {
  db: D1Database;
  defaultOrg?: string;
  email?: string;
  userId?: string;
}

interface AuthenticateUserBackedClaimsOptions extends ResolveUserBackedClaimsOptions {
  password: string;
}

interface WorkerUserRecord {
  userId: string;
  email: string;
  role: WorkerAuthRole;
  passwordHash?: string;
  isActive: boolean;
  isVerified: boolean;
  smeId?: string;
}

interface TableInfoRow {
  name?: string;
}

const SUPPORTED_ROLES: WorkerAuthRole[] = ['SME_OWNER', 'MENTOR', 'ADMIN', 'SUPER_ADMIN'];
const tableColumnsCache = new Map<string, string[]>();

export class WorkerUserClaimsError extends Error {
  statusCode: 401 | 403 | 404 | 422 | 500 | 503;

  constructor(message: string, statusCode: 401 | 403 | 404 | 422 | 500 | 503 = 500) {
    super(message);
    this.name = 'WorkerUserClaimsError';
    this.statusCode = statusCode;
  }
}

export function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeOrganizations(value: unknown, defaultOrg?: string): string[] {
  const organizations = Array.isArray(value)
    ? value.map((item) => normalizeOptionalString(item)).filter((item): item is string => Boolean(item))
    : [];

  if (defaultOrg && !organizations.includes(defaultOrg)) {
    organizations.unshift(defaultOrg);
  }

  return [...new Set(organizations)];
}

export function coerceWorkerAuthRole(value: unknown): WorkerAuthRole | undefined {
  return typeof value === 'string' && SUPPORTED_ROLES.includes(value as WorkerAuthRole)
    ? (value as WorkerAuthRole)
    : undefined;
}

export function isWorkerAdminRole(value: unknown): boolean {
  const role = coerceWorkerAuthRole(value);
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function getTokenUserId(payload: Record<string, unknown>): string | undefined {
  return (
    normalizeOptionalString(payload.userId) ??
    normalizeOptionalString(payload.id) ??
    normalizeOptionalString(payload.sub)
  );
}

function normalizeStartupSlug(value: string): string | undefined {
  const slug = value.trim().toLowerCase();
  if (!slug) return undefined;
  return /^[a-z0-9-]+$/.test(slug) ? slug : undefined;
}

function slugifyStartupName(value: string): string | undefined {
  return normalizeStartupSlug(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function pickColumn(columns: string[], candidates: string[]): string | undefined {
  return candidates.find((candidate) => columns.includes(candidate));
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
  }
  return fallback;
}

async function getTableColumns(db: D1Database, tableName: string): Promise<string[]> {
  const cached = tableColumnsCache.get(tableName);
  if (cached) {
    return cached;
  }

  const result = await db
    .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
    .all<TableInfoRow>();
  const columns = (result.results ?? [])
    .map((row) => normalizeOptionalString(row.name))
    .filter((name): name is string => Boolean(name));

  tableColumnsCache.set(tableName, columns);
  return columns;
}

async function lookupUserRecord(
  db: D1Database,
  options: ResolveUserBackedClaimsOptions
): Promise<WorkerUserRecord | null> {
  const userColumns = await getTableColumns(db, 'users');
  if (userColumns.length === 0) {
    throw new WorkerUserClaimsError('Worker user lookup is not configured', 503);
  }

  const idColumn = pickColumn(userColumns, ['id']);
  const emailColumn = pickColumn(userColumns, ['email']);
  const passwordColumn = pickColumn(userColumns, ['password']);
  const roleColumn = pickColumn(userColumns, ['role']);
  const activeColumn = pickColumn(userColumns, ['isActive', 'is_active']);
  const verifiedColumn = pickColumn(userColumns, ['isVerified', 'is_verified']);
  const smeIdColumn = pickColumn(userColumns, ['smeId', 'sme_id']);

  if (!idColumn || !emailColumn || !roleColumn) {
    throw new WorkerUserClaimsError('Worker user schema is incomplete', 503);
  }

  const identifierValue = options.userId ?? normalizeOptionalString(options.email)?.toLowerCase();
  const whereColumn = options.userId ? idColumn : emailColumn;
  if (!identifierValue) {
    return null;
  }

  const selectParts = [
    `${quoteIdentifier(idColumn)} AS userId`,
    `${quoteIdentifier(emailColumn)} AS email`,
    `${quoteIdentifier(roleColumn)} AS role`,
    passwordColumn ? `${quoteIdentifier(passwordColumn)} AS passwordHash` : 'NULL AS passwordHash',
    activeColumn ? `${quoteIdentifier(activeColumn)} AS isActive` : '1 AS isActive',
    verifiedColumn ? `${quoteIdentifier(verifiedColumn)} AS isVerified` : '0 AS isVerified',
    smeIdColumn ? `${quoteIdentifier(smeIdColumn)} AS smeId` : 'NULL AS smeId',
  ];

  const sql = `
    SELECT ${selectParts.join(', ')}
    FROM ${quoteIdentifier('users')}
    WHERE ${quoteIdentifier(whereColumn)} = ?
    LIMIT 1
  `;

  const record = await db.prepare(sql).bind(identifierValue).first<Record<string, unknown>>();
  if (!record) {
    return null;
  }

  const role = coerceWorkerAuthRole(record.role);
  const email = normalizeOptionalString(record.email)?.toLowerCase();
  const userId = normalizeOptionalString(record.userId);
  if (!role || !email || !userId) {
    throw new WorkerUserClaimsError('Worker user record is invalid', 500);
  }

  return {
    userId,
    email,
    role,
    passwordHash: normalizeOptionalString(record.passwordHash),
    isActive: coerceBoolean(record.isActive, true),
    isVerified: coerceBoolean(record.isVerified, false),
    smeId: normalizeOptionalString(record.smeId),
  };
}

async function lookupStartupSlug(db: D1Database, user: WorkerUserRecord): Promise<string | undefined> {
  const smeColumns = await getTableColumns(db, 'sme_profiles');
  if (smeColumns.length === 0) {
    return undefined;
  }

  const idColumn = pickColumn(smeColumns, ['id']);
  const userIdColumn = pickColumn(smeColumns, ['userId', 'user_id']);
  const companyNameColumn = pickColumn(smeColumns, ['companyName', 'company_name']);

  if (!companyNameColumn) {
    return undefined;
  }

  const lookupQueries: Array<{ sql: string; bind: string }> = [];
  if (userIdColumn) {
    lookupQueries.push({
      sql: `
        SELECT ${quoteIdentifier(companyNameColumn)} AS companyName
        FROM ${quoteIdentifier('sme_profiles')}
        WHERE ${quoteIdentifier(userIdColumn)} = ?
        LIMIT 1
      `,
      bind: user.userId,
    });
  }

  if (user.smeId && idColumn) {
    lookupQueries.push({
      sql: `
        SELECT ${quoteIdentifier(companyNameColumn)} AS companyName
        FROM ${quoteIdentifier('sme_profiles')}
        WHERE ${quoteIdentifier(idColumn)} = ?
        LIMIT 1
      `,
      bind: user.smeId,
    });
  }

  for (const query of lookupQueries) {
    const record = await db.prepare(query.sql).bind(query.bind).first<Record<string, unknown>>();
    const companyName = normalizeOptionalString(record?.companyName);
    if (companyName) {
      return slugifyStartupName(companyName);
    }
  }

  return undefined;
}

async function buildResolvedClaims(
  user: WorkerUserRecord,
  db: D1Database,
  defaultOrg?: string
): Promise<ResolvedWorkerAuthClaims> {
  const startupSlug = await lookupStartupSlug(db, user);
  const startupOrg = startupSlug && defaultOrg ? defaultOrg : undefined;
  const organizations = normalizeOrganizations([defaultOrg, startupOrg]);

  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
    ...(defaultOrg ? { org: defaultOrg } : {}),
    ...(startupOrg ? { startupOrg } : {}),
    ...(startupSlug ? { startupSlug } : {}),
    ...(organizations.length > 0 ? { organizations } : {}),
  };
}

export async function resolveUserBackedClaims(
  options: ResolveUserBackedClaimsOptions
): Promise<ResolvedWorkerAuthClaims | null> {
  const user = await lookupUserRecord(options.db, options);
  if (!user || !user.isActive) {
    return null;
  }

  return buildResolvedClaims(user, options.db, options.defaultOrg);
}

export async function authenticateUserBackedClaims(
  options: AuthenticateUserBackedClaimsOptions
): Promise<ResolvedWorkerAuthClaims | null> {
  const user = await lookupUserRecord(options.db, options);
  if (!user || !user.isActive || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(options.password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  return buildResolvedClaims(user, options.db, options.defaultOrg);
}