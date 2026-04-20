"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const environment_1 = require("./config/environment");
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const pdf_1 = __importDefault(require("./routes/pdf"));
const health_1 = __importDefault(require("./routes/health"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const app = (0, express_1.default)();
exports.app = app;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable for PDF generation
}));
app.use((0, cors_1.default)({
    origin: environment_1.config.cors.allowedOrigins,
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs (lower for resource-intensive operations)
    message: 'Too many document generation requests from this IP, please try again later.',
});
app.use(limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '50mb' })); // Higher limit for document generation
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Static files for templates and assets
app.use('/templates', express_1.default.static('templates'));
app.use('/public', express_1.default.static('public'));
// Request logging
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});
// Routes
app.use('/health', health_1.default);
app.use('/api/pdf', pdf_1.default);
app.use('/api/documents', documentRoutes_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `${req.method} ${req.originalUrl} not found`,
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start server
const PORT = environment_1.config.server.port;
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 BrainSAIT Document Service running on port ${PORT}`);
    logger_1.logger.info(`📄 PDF Generation: http://localhost:${PORT}/api/pdf`);
    logger_1.logger.info(`📋 Document Generation: http://localhost:${PORT}/api/documents`);
    logger_1.logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    logger_1.logger.info(`🌐 API Templates: http://localhost:${PORT}/api/documents/templates`);
});
//# sourceMappingURL=server.js.map