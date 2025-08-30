import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        isVerified: boolean;
    };
}
export interface JWTPayload {
    id: string;
    email: string;
    role: UserRole;
    sessionId: string;
    iat?: number;
    exp?: number;
}
/**
 * Middleware to authenticate JWT tokens and validate session
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Middleware to check if user has required roles
 */
export declare const authorize: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Middleware to check if user is verified (for sensitive operations)
 */
export declare const requireVerified: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Optional authentication - doesn't fail if no token provided
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.d.ts.map