import { UserRole } from '@prisma/client';
export interface TokenPayload {
    id: string;
    email: string;
    role: UserRole;
    sessionId: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
}
/**
 * Generate a unique session ID
 */
export declare const generateSessionId: () => string;
/**
 * Generate access and refresh tokens
 */
export declare const generateTokenPair: (userId: string, email: string, role: UserRole) => Promise<TokenPair>;
/**
 * Refresh access token using refresh token
 */
export declare const refreshAccessToken: (refreshToken: string) => Promise<{
    accessToken: string;
} | null>;
/**
 * Revoke a specific session
 */
export declare const revokeSession: (sessionId: string) => Promise<void>;
/**
 * Revoke all sessions for a user
 */
export declare const revokeAllUserSessions: (userId: string) => Promise<void>;
/**
 * Get active sessions for a user
 */
export declare const getUserSessions: (userId: string) => Promise<{
    sessionId: string;
    createdAt: any;
    lastAccessed: any;
}[]>;
/**
 * Verify and decode JWT token
 */
export declare const verifyToken: (token: string) => TokenPayload | null;
/**
 * Clean up expired sessions (should be run periodically)
 */
export declare const cleanupExpiredSessions: () => Promise<void>;
//# sourceMappingURL=jwt.d.ts.map