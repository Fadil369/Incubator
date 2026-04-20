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
export declare class WorkerUserClaimsError extends Error {
    statusCode: 401 | 403 | 404 | 422 | 500 | 503;
    constructor(message: string, statusCode?: 401 | 403 | 404 | 422 | 500 | 503);
}
export declare function normalizeOptionalString(value: unknown): string | undefined;
export declare function normalizeOrganizations(value: unknown, defaultOrg?: string): string[];
export declare function coerceWorkerAuthRole(value: unknown): WorkerAuthRole | undefined;
export declare function isWorkerAdminRole(value: unknown): boolean;
export declare function getTokenUserId(payload: Record<string, unknown>): string | undefined;
export declare function resolveUserBackedClaims(options: ResolveUserBackedClaimsOptions): Promise<ResolvedWorkerAuthClaims | null>;
export declare function authenticateUserBackedClaims(options: AuthenticateUserBackedClaimsOptions): Promise<ResolvedWorkerAuthClaims | null>;
export {};
//# sourceMappingURL=userBackedClaims.d.ts.map