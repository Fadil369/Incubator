import { Router } from 'express';
import { query } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { getDashboardAnalytics, getSMEAnalytics, getProgramAnalytics, exportAnalytics, getMyAnalytics, } from '../controllers/analyticsController';
const router = Router();
// Validation schemas
const exportValidation = [
    query('type').isIn(['users', 'smes', 'programs', 'enrollments']).withMessage('Invalid export type'),
    query('format').isIn(['csv', 'json']).withMessage('Invalid export format'),
];
// Protected routes (authenticated users)
router.get('/my-analytics', authenticate, getMyAnalytics);
// Admin-only routes
router.get('/dashboard', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getDashboardAnalytics);
router.get('/smes', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getSMEAnalytics);
router.get('/programs', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getProgramAnalytics);
router.get('/export', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), exportValidation, exportAnalytics);
export default router;
//# sourceMappingURL=analytics.js.map