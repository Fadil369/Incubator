import bcrypt from 'bcryptjs';
const SUPPORTED_ROLES = ['SME_OWNER', 'MENTOR', 'ADMIN', 'SUPER_ADMIN'];
const tableColumnsCache = new Map();
export class WorkerUserClaimsError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'WorkerUserClaimsError';
        this.statusCode = statusCode;
    }
}
export function normalizeOptionalString(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
export function normalizeOrganizations(value, defaultOrg) {
    const organizations = Array.isArray(value)
        ? value.map((item) => normalizeOptionalString(item)).filter((item) => Boolean(item))
        : [];
    if (defaultOrg && !organizations.includes(defaultOrg)) {
        organizations.unshift(defaultOrg);
    }
    return [...new Set(organizations)];
}
export function coerceWorkerAuthRole(value) {
    return typeof value === 'string' && SUPPORTED_ROLES.includes(value)
        ? value
        : undefined;
}
export function isWorkerAdminRole(value) {
    const role = coerceWorkerAuthRole(value);
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
export function getTokenUserId(payload) {
    return (normalizeOptionalString(payload.userId) ??
        normalizeOptionalString(payload.id) ??
        normalizeOptionalString(payload.sub));
}
function normalizeStartupSlug(value) {
    const slug = value.trim().toLowerCase();
    if (!slug)
        return undefined;
    return /^[a-z0-9-]+$/.test(slug) ? slug : undefined;
}
function slugifyStartupName(value) {
    return normalizeStartupSlug(value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''));
}
function quoteIdentifier(value) {
    return `"${value.replace(/"/g, '""')}"`;
}
function pickColumn(columns, candidates) {
    return candidates.find((candidate) => columns.includes(candidate));
}
function coerceBoolean(value, fallback) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'y'].includes(normalized))
            return true;
        if (['0', 'false', 'no', 'n'].includes(normalized))
            return false;
    }
    return fallback;
}
async function getTableColumns(db, tableName) {
    const cached = tableColumnsCache.get(tableName);
    if (cached) {
        return cached;
    }
    const result = await db
        .prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`)
        .all();
    const columns = (result.results ?? [])
        .map((row) => normalizeOptionalString(row.name))
        .filter((name) => Boolean(name));
    tableColumnsCache.set(tableName, columns);
    return columns;
}
async function lookupUserRecord(db, options) {
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
    const record = await db.prepare(sql).bind(identifierValue).first();
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
async function lookupStartupSlug(db, user) {
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
    const lookupQueries = [];
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
        const record = await db.prepare(query.sql).bind(query.bind).first();
        const companyName = normalizeOptionalString(record?.companyName);
        if (companyName) {
            return slugifyStartupName(companyName);
        }
    }
    return undefined;
}
async function buildResolvedClaims(user, db, defaultOrg) {
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
export async function resolveUserBackedClaims(options) {
    const user = await lookupUserRecord(options.db, options);
    if (!user || !user.isActive) {
        return null;
    }
    return buildResolvedClaims(user, options.db, options.defaultOrg);
}
export async function authenticateUserBackedClaims(options) {
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
//# sourceMappingURL=userBackedClaims.js.map