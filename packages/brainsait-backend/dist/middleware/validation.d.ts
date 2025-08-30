import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
export interface ValidatedRequest<T = any> extends Request {
    validatedData?: T;
}
/**
 * Middleware to validate request data against Zod schema
 */
export declare const validateRequest: <T>(schema: z.ZodSchema<T>) => (req: ValidatedRequest<T>, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate query parameters
 */
export declare const validateQuery: <T>(schema: z.ZodSchema<T>) => (req: ValidatedRequest<T>, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to validate URL parameters
 */
export declare const validateParams: <T>(schema: z.ZodSchema<T>) => (req: ValidatedRequest<T>, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Common validation schemas
 */
export declare const commonSchemas: {
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sortBy: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "desc" | "asc";
        sortBy?: string | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        sortBy?: string | undefined;
        sortOrder?: "desc" | "asc" | undefined;
    }>;
    idParam: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    searchQuery: z.ZodObject<{
        q: z.ZodString;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        q: string;
        filters?: Record<string, string> | undefined;
    }, {
        q: string;
        filters?: Record<string, string> | undefined;
    }>;
    dateRange: z.ZodEffects<z.ZodObject<{
        startDate: z.ZodDate;
        endDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        startDate: Date;
        endDate: Date;
    }, {
        startDate: Date;
        endDate: Date;
    }>, {
        startDate: Date;
        endDate: Date;
    }, {
        startDate: Date;
        endDate: Date;
    }>;
    fileUpload: z.ZodObject<{
        filename: z.ZodString;
        mimetype: z.ZodString;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        filename: string;
        size: number;
        mimetype: string;
    }, {
        filename: string;
        size: number;
        mimetype: string;
    }>;
    language: z.ZodObject<{
        locale: z.ZodEnum<["en", "ar", "fr", "es"]>;
    }, "strip", z.ZodTypeAny, {
        locale: "en" | "ar" | "fr" | "es";
    }, {
        locale: "en" | "ar" | "fr" | "es";
    }>;
    medicalLicense: z.ZodObject<{
        licenseNumber: z.ZodString;
        country: z.ZodString;
        expiryDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        licenseNumber: string;
        country: string;
        expiryDate: Date;
    }, {
        licenseNumber: string;
        country: string;
        expiryDate: Date;
    }>;
    aiExperience: z.ZodObject<{
        level: z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]>;
        yearsOfExperience: z.ZodNumber;
        areasOfInterest: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
        yearsOfExperience: number;
        areasOfInterest: string[];
    }, {
        level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
        yearsOfExperience: number;
        areasOfInterest: string[];
    }>;
};
//# sourceMappingURL=validation.d.ts.map