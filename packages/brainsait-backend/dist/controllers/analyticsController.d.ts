import { Request, Response } from 'express';
/**
 * Get platform dashboard analytics (Admin only)
 */
export declare const getDashboardAnalytics: (req: Request, res: Response, next: Request) => void;
/**
 * Get SME analytics
 */
export declare const getSMEAnalytics: (req: Request, res: Response, next: Request) => void;
/**
 * Get program analytics
 */
export declare const getProgramAnalytics: (req: Request, res: Response, next: Request) => void;
/**
 * Export analytics data (Admin only)
 */
export declare const exportAnalytics: (req: Request, res: Response, next: Request) => void;
/**
 * Get user's personal analytics (for SME users)
 */
export declare const getMyAnalytics: (req: Request, res: Response, next: Request) => void;
//# sourceMappingURL=analyticsController.d.ts.map