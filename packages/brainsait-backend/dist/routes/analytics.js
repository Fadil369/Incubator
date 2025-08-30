"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
// Validation schemas
const exportValidation = [
    (0, express_validator_1.query)('type').isIn(['users', 'smes', 'programs', 'enrollments']).withMessage('Invalid export type'),
    (0, express_validator_1.query)('format').isIn(['csv', 'json']).withMessage('Invalid export format'),
];
// Protected routes (authenticated users)
router.get('/my-analytics', auth_1.authenticate, analyticsController_1.getMyAnalytics);
// Admin-only routes
router.get('/dashboard', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), analyticsController_1.getDashboardAnalytics);
router.get('/smes', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), analyticsController_1.getSMEAnalytics);
router.get('/programs', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), analyticsController_1.getProgramAnalytics);
router.get('/export', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), exportValidation, analyticsController_1.exportAnalytics);
exports.default = router;
//# sourceMappingURL=analytics.js.map