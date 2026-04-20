"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.config = {
    server: {
        port: parseInt(process.env.PORT || '5002', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    cors: {
        allowedOrigins: process.env.CORS_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5000',
            'https://brainsait.com',
        ],
    },
    puppeteer: {
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
        ],
    },
    templates: {
        basePath: process.env.TEMPLATES_PATH || './templates',
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'ar'],
    },
    storage: {
        outputPath: process.env.OUTPUT_PATH || './output',
        tempPath: process.env.TEMP_PATH || './temp',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10), // 50MB
        cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '3600000', 10), // 1 hour
    },
    security: {
        maxRequestSize: '50mb',
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '50', 10),
    },
};
//# sourceMappingURL=environment.js.map