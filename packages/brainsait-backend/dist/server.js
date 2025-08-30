"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const redis_1 = require("redis");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const environment_1 = require("./config/environment");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const sme_1 = __importDefault(require("./routes/sme"));
const mentors_1 = __importDefault(require("./routes/mentors"));
const programs_1 = __importDefault(require("./routes/programs"));
const documents_1 = __importDefault(require("./routes/documents"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const saudiCompliance_1 = __importDefault(require("./routes/saudiCompliance"));
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const redisClient = (0, redis_1.createClient)({
    url: environment_1.config.redis.url,
});
exports.redisClient = redisClient;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: environment_1.config.cors.allowedOrigins,
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw `SELECT 1`;
        // Check Redis connection
        await redisClient.ping();
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: 'connected',
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable',
        });
    }
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/sme', sme_1.default);
app.use('/api/mentors', mentors_1.default);
app.use('/api/programs', programs_1.default);
app.use('/api/documents', documents_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/saudi-compliance', saudiCompliance_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `${req.method} ${req.originalUrl} not found`,
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Initialize database and Redis connections
async function initializeConnections() {
    try {
        // Connect to Redis
        await redisClient.connect();
        logger_1.logger.info('Connected to Redis');
        // Test database connection
        await prisma.$connect();
        logger_1.logger.info('Connected to PostgreSQL database');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize connections', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
});
// Start server
const PORT = environment_1.config.server.port;
initializeConnections().then(() => {
    app.listen(PORT, () => {
        logger_1.logger.info(`🚀 BrainSAIT Backend Server running on port ${PORT}`);
        logger_1.logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
        logger_1.logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
});
//# sourceMappingURL=server.js.map