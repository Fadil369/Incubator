import { Request, Response } from 'express';
/**
 * Register a new user
 */
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Verify email address
 */
export declare const verifyEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * User login
 */
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Refresh access token
 */
export declare const refresh: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * User logout
 */
export declare const logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Logout from all devices
 */
export declare const logoutAll: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Forgot password - send reset email
 */
export declare const forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Reset password using token
 */
export declare const resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Change password (authenticated users)
 */
export declare const changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get current user profile
 */
export declare const getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=authController.d.ts.map