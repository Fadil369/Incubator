import { Request, Response } from 'express';
/**
 * Get platform dashboard analytics (Admin only)
 */
export declare const getDashboardAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get SME analytics
 */
export declare const getSMEAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get program analytics
 */
export declare const getProgramAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Export analytics data (Admin only)
 */
export declare const exportAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get user's personal analytics (for SME users)
 */
export declare const getMyAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=analyticsController.d.ts.map