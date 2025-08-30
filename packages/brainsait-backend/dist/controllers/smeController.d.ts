import { Request, Response } from 'express';
/**
 * Get all SMEs (with pagination and filtering)
 */
export declare const getSMEs: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get SME by ID
 */
export declare const getSMEById: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Create SME profile (for authenticated users)
 */
export declare const createSMEProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update SME profile
 */
export declare const updateSMEProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete SME profile
 */
export declare const deleteSMEProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get current user's SME profile
 */
export declare const getMySMEProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update SME verification status (Admin only)
 */
export declare const updateSMEVerificationStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Upload SME documents
 */
export declare const uploadSMEDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get SME statistics (Admin only)
 */
export declare const getSMEStatistics: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=smeController.d.ts.map