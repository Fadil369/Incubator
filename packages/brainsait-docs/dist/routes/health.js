"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const pdfService_1 = require("../services/pdfService");
const router = (0, express_1.Router)();
const healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Test PDF service
        await pdfService_1.pdfService.initialize();
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                pdfService: 'initialized',
                puppeteer: 'running',
            },
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Service unavailable',
        });
    }
});
router.get('/', healthCheck);
exports.default = router;
//# sourceMappingURL=health.js.map