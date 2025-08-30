import { Request, Response } from 'express';
/**
 * Generate feasibility study document
 */
export declare const generateFeasibilityStudy: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Generate business plan document
 */
export declare const generateBusinessPlan: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Generate certificate (Admin only or for completed enrollments)
 */
export declare const generateCertificate: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get user's generated documents
 */
export declare const getUserDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Download document
 */
export declare const downloadDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete document
 */
export declare const deleteDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get document templates (Admin only)
 */
export declare const getDocumentTemplates: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=documentController.d.ts.map