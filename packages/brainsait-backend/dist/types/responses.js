"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.ErrorCodes = void 0;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
exports.createValidationErrorResponse = createValidationErrorResponse;
// Common error codes
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodes["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCodes["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorCodes["NOT_FOUND"] = "NOT_FOUND";
    ErrorCodes["DUPLICATE_RESOURCE"] = "DUPLICATE_RESOURCE";
    ErrorCodes["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCodes["EMAIL_NOT_VERIFIED"] = "EMAIL_NOT_VERIFIED";
    ErrorCodes["ACCOUNT_INACTIVE"] = "ACCOUNT_INACTIVE";
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCodes["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
    ErrorCodes["DOCUMENT_GENERATION_ERROR"] = "DOCUMENT_GENERATION_ERROR";
    ErrorCodes["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCodes["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCodes["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
// HTTP status codes mapping
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
};
// Response helper functions
function createSuccessResponse(data, message) {
    return {
        success: true,
        data,
        ...(message && { message }),
    };
}
function createErrorResponse(message, details, code) {
    return {
        success: false,
        error: {
            message,
            ...(details && { details }),
            ...(code && { code }),
        },
    };
}
function createPaginatedResponse(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return createSuccessResponse({
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    });
}
function createValidationErrorResponse(errors) {
    return {
        success: false,
        error: {
            message: 'Validation failed',
            details: errors,
            code: ErrorCodes.VALIDATION_ERROR,
        },
    };
}
//# sourceMappingURL=responses.js.map