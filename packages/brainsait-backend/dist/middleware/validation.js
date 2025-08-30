import { z, ZodError } from 'zod';
/**
 * Middleware to validate request data against Zod schema
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Validate request body
            const validatedData = schema.parse(req.body);
            req.validatedData = validatedData;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
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
/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const validatedQuery = schema.parse(req.query);
            req.validatedData = validatedQuery;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
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
/**
 * Middleware to validate URL parameters
 */
export const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const validatedParams = schema.parse(req.params);
            req.validatedData = validatedParams;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
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
/**
 * Common validation schemas
 */
export const commonSchemas = {
    // Pagination
    pagination: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
    // ID parameter
    idParam: z.object({
        id: z.string().uuid(),
    }),
    // Search query
    searchQuery: z.object({
        q: z.string().min(1).max(200),
        filters: z.record(z.string()).optional(),
    }),
    // Date range
    dateRange: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
    }).refine((data) => data.startDate <= data.endDate, {
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
    }),
    // File upload
    fileUpload: z.object({
        filename: z.string().min(1),
        mimetype: z.string().min(1),
        size: z.number().max(10 * 1024 * 1024), // 10MB max
    }),
    // Language preference
    language: z.object({
        locale: z.enum(['en', 'ar', 'fr', 'es']),
    }),
    // Healthcare specific
    medicalLicense: z.object({
        licenseNumber: z.string().min(3).max(50),
        country: z.string().length(2), // ISO country code
        expiryDate: z.coerce.date().min(new Date()),
    }),
    // AI experience level
    aiExperience: z.object({
        level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
        yearsOfExperience: z.number().min(0).max(50),
        areasOfInterest: z.array(z.string()).min(1),
    }),
};
//# sourceMappingURL=validation.js.map