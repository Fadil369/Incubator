"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = exports.validateParams = exports.validateQuery = exports.validateRequest = void 0;
const zod_1 = require("zod");
/**
 * Middleware to validate request data against Zod schema
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate request body
            const validatedData = schema.parse(req.body);
            req.validatedData = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Validation failed',
                        details: formattedErrors,
                    },
                });
            }
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Validation error',
                },
            });
        }
    };
};
exports.validateRequest = validateRequest;
/**
 * Middleware to validate query parameters
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const validatedQuery = schema.parse(req.query);
            req.validatedData = validatedQuery;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Query validation failed',
                        details: formattedErrors,
                    },
                });
            }
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Query validation error',
                },
            });
        }
    };
};
exports.validateQuery = validateQuery;
/**
 * Middleware to validate URL parameters
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const validatedParams = schema.parse(req.params);
            req.validatedData = validatedParams;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Parameter validation failed',
                        details: formattedErrors,
                    },
                });
            }
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Parameter validation error',
                },
            });
        }
    };
};
exports.validateParams = validateParams;
/**
 * Common validation schemas
 */
exports.commonSchemas = {
    // Pagination
    pagination: zod_1.z.object({
        page: zod_1.z.coerce.number().min(1).default(1),
        limit: zod_1.z.coerce.number().min(1).max(100).default(10),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    }),
    // ID parameter
    idParam: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    // Search query
    searchQuery: zod_1.z.object({
        q: zod_1.z.string().min(1).max(200),
        filters: zod_1.z.record(zod_1.z.string()).optional(),
    }),
    // Date range
    dateRange: zod_1.z.object({
        startDate: zod_1.z.coerce.date(),
        endDate: zod_1.z.coerce.date(),
    }).refine((data) => data.startDate <= data.endDate, {
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
    }),
    // File upload
    fileUpload: zod_1.z.object({
        filename: zod_1.z.string().min(1),
        mimetype: zod_1.z.string().min(1),
        size: zod_1.z.number().max(10 * 1024 * 1024), // 10MB max
    }),
    // Language preference
    language: zod_1.z.object({
        locale: zod_1.z.enum(['en', 'ar', 'fr', 'es']),
    }),
    // Healthcare specific
    medicalLicense: zod_1.z.object({
        licenseNumber: zod_1.z.string().min(3).max(50),
        country: zod_1.z.string().length(2), // ISO country code
        expiryDate: zod_1.z.coerce.date().min(new Date()),
    }),
    // AI experience level
    aiExperience: zod_1.z.object({
        level: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
        yearsOfExperience: zod_1.z.number().min(0).max(50),
        areasOfInterest: zod_1.z.array(zod_1.z.string()).min(1),
    }),
};
//# sourceMappingURL=validation.js.map