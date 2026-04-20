"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    logger_1.logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
    });
    // PDF generation specific errors
    if (err.message?.includes('PDF generation failed')) {
        error = { ...error, message: 'Document generation failed', statusCode: 500 };
    }
    if (err.message?.includes('Template rendering failed')) {
        error = { ...error, message: 'Template processing failed', statusCode: 400 };
    }
    if (err.message?.includes('PDF service not initialized')) {
        error = { ...error, message: 'Service temporarily unavailable', statusCode: 503 };
    }
    // Puppeteer specific errors
    if (err.message?.includes('TimeoutError')) {
        error = { ...error, message: 'Document generation timeout', statusCode: 408 };
    }
    if (err.message?.includes('Navigation failed')) {
        error = { ...error, message: 'Template loading failed', statusCode: 400 };
    }
    // File system errors
    if (err.code === 'ENOENT') {
        const message = 'Template file not found';
        error = { ...error, message, statusCode: 404 };
    }
    if (err.code === 'EACCES') {
        const message = 'File access denied';
        error = { ...error, message, statusCode: 403 };
    }
    // Memory errors
    if (err.message?.includes('out of memory')) {
        error = { ...error, message: 'Document too large to process', statusCode: 413 };
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(environment_1.config.server.nodeEnv === 'development' && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map