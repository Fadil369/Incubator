import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram, enrollInProgram, getMyEnrollments, updateEnrollmentStatus, updateEnrollmentProgress, getProgramStatistics, } from '../controllers/programController';
const router = Router();
// Validation schemas
const createProgramValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['INCUBATION', 'ACCELERATION', 'MENTORSHIP', 'WORKSHOP', 'MASTERCLASS']).withMessage('Invalid program type'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (weeks)'),
    body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('requirements').optional().isObject().withMessage('Requirements must be an object'),
    body('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
    body('resources').optional().isObject().withMessage('Resources must be an object'),
];
const updateProgramValidation = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('type').optional().isIn(['INCUBATION', 'ACCELERATION', 'MENTORSHIP', 'WORKSHOP', 'MASTERCLASS']).withMessage('Invalid program type'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer (weeks)'),
    body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
    body('requirements').optional().isObject().withMessage('Requirements must be an object'),
    body('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
    body('resources').optional().isObject().withMessage('Resources must be an object'),
];
const enrollmentStatusValidation = [
    body('status').isIn(['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'REJECTED']).withMessage('Invalid enrollment status'),
    body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string'),
];
const progressUpdateValidation = [
    body('progress').isFloat({ min: 0, max: 100 }).withMessage('Progress must be a number between 0 and 100'),
];
// Public routes
router.get('/', getPrograms);
router.get('/:id', getProgramById);
// Protected routes (authenticated users)
router.post('/:id/enroll', authenticate, enrollInProgram);
router.get('/my/enrollments', authenticate, getMyEnrollments);
router.put('/enrollments/:enrollmentId/progress', authenticate, progressUpdateValidation, updateEnrollmentProgress);
// Admin-only routes
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createProgramValidation, createProgram);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateProgramValidation, updateProgram);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteProgram);
router.put('/enrollments/:enrollmentId/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), enrollmentStatusValidation, updateEnrollmentStatus);
router.get('/admin/statistics', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getProgramStatistics);
export default router;
//# sourceMappingURL=programs.js.map