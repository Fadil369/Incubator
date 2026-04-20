import { Request, Response } from 'express';
/**
 * Create or update Saudi regulatory compliance data
 */
export declare const createOrUpdateCompliance: (req: Request, res: Response, next: Request) => void;
/**
 * Get Saudi compliance data for an SME
 */
export declare const getCompliance: (req: Request, res: Response, next: Request) => void;
/**
 * Get compliance summary (for dashboard)
 */
export declare const getComplianceSummary: (req: Request, res: Response, next: Request) => void;
/**
 * Validate CR Number with government API
 */
export declare const validateCR: (req: Request, res: Response, next: Request) => void;
/**
 * Validate VAT Number
 */
export declare const validateVAT: (req: Request, res: Response, next: Request) => void;
/**
 * Validate Saudi Address (WASL)
 */
export declare const validateAddress: (req: Request, res: Response, next: Request) => void;
/**
 * Get compliance statistics (Admin only)
 */
export declare const getComplianceStatistics: (req: Request, res: Response, next: Request) => void;
/**
 * Trigger compliance audit for SME
 */
export declare const triggerComplianceAudit: (req: Request, res: Response, next: Request) => void;
/**
 * Get Saudi regions list
 */
export declare const getSaudiRegions: (req: Request, res: Response, next: Request) => void;
//# sourceMappingURL=saudiComplianceController.d.ts.map