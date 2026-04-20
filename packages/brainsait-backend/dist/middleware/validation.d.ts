import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
export interface ValidatedRequest<T = any> extends Request {
    validatedData?: T;
}
/**
 * Middleware to validate request data against Zod schema
 */
export declare const validateRequest: <T>(schema: z.ZodSchema<T>) => (req: ValidatedRequest<T>, res: Response, next: NextFunction) => any;
/**
 * Middleware to validate query parameters
 */
export declare const validateQuery: <T>(schema: z.ZodSchema<T>) => (req: ValidatedRequest<T>, res: Response, next: NextFunction) => any;
/**
 * Middleware to validate URL parameters
 */
export declare const validateParams: <T>(schema: z.ZodSchema<T>) => (req: ValidatedRequest<T>, res: Response, next: NextFunction) => any;
/**
 * Common validation schemas
 */
export declare const commonSchemas: {
    pagination: any;
    idParam: any;
    searchQuery: any;
    dateRange: any;
    fileUpload: any;
    language: any;
    medicalLicense: any;
    aiExperience: any;
};
//# sourceMappingURL=validation.d.ts.map