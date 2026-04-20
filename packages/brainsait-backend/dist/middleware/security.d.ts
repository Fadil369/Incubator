/**
 * Enhanced Security Middleware for BrainSAIT Platform
 * Implements comprehensive security measures for Saudi healthcare SME data protection
 *
 * @author BrainSAIT Platform
 * @version 2.0.0
 */
import { NextFunction, Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        smeId?: string;
        permissions?: string[];
    };
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
}
export interface SecurityAuditLog {
    userId?: string;
    action: string;
    resource?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    status: 'success' | 'failure';
    details?: any;
}
/**
 * Enhanced Helmet configuration for security headers
 */
export declare const helmetConfig: any;
/**
 * CORS configuration with Saudi-specific origins
 */
export declare const corsConfig: any;
/**
 * Rate limiting for general API endpoints
 */
export declare const apiRateLimiter: any;
/**
 * Stricter rate limiting for authentication endpoints
 */
export declare const authRateLimiter: any;
/**
 * JWT Token Generation with refresh token support
 */
export declare const generateTokens: (user: any) => {
    accessToken: any;
    refreshToken: any;
};
/**
 * JWT Authentication Middleware
 */
export declare const authenticateToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
/**
 * Role-based access control middleware
 */
export declare const authorize: (...allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
/**
 * Permission-based access control
 */
export declare const requirePermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
/**
 * Data encryption for sensitive information
 */
export declare class DataEncryption {
    private algorithm;
    private key;
    constructor();
    encrypt(text: string): string;
    decrypt(text: string): string;
}
/**
 * Password validation for Saudi compliance
 */
export declare const validatePassword: (password: string) => {
    valid: boolean;
    errors: string[];
};
/**
 * Hash password with bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Verify password
 */
export declare const verifyPassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Input sanitization middleware
 */
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
/**
 * SQL Injection prevention (additional layer with Prisma)
 */
export declare const preventSQLInjection: (value: string) => string;
/**
 * File upload security
 */
export declare const fileUploadSecurity: {
    allowedMimeTypes: string[];
    maxFileSize: number;
    validateFile: (file: any) => {
        valid: boolean;
        error?: string;
    };
};
/**
 * Session management
 */
export declare class SessionManager {
    private static sessions;
    static createSession(userId: string, data: any): string;
    static getSession(sessionId: string): any;
    static destroySession(sessionId: string): void;
    static cleanupExpiredSessions(): void;
}
/**
 * Security audit logging
 */
export declare const logSecurityEvent: (event: SecurityAuditLog) => Promise<void>;
/**
 * Get client IP address
 */
export declare const getClientIp: (req: Request) => string;
/**
 * Saudi National ID validation
 */
export declare const validateSaudiNationalId: (nationalId: string) => boolean;
/**
 * CSRF Protection
 */
export declare const csrfProtection: (req: Request, res: Response, next: NextFunction) => any;
/**
 * Content Security Policy for Saudi compliance
 */
export declare const saudiComplianceHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityMiddleware: {
    helmet: any;
    cors: any;
    rateLimit: any;
    authRateLimit: any;
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>;
    authorize: (...allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
    requirePermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => any;
    sanitize: (req: Request, res: Response, next: NextFunction) => void;
    csrfProtection: (req: Request, res: Response, next: NextFunction) => any;
    saudiCompliance: (req: Request, res: Response, next: NextFunction) => void;
};
export default securityMiddleware;
//# sourceMappingURL=security.d.ts.map