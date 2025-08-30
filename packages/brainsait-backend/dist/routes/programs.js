"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const programController_1 = require("../controllers/programController");
const router = (0, express_1.Router)();
// Validation schemas
const createProgramValidation = [
    (0, express_validator_1.body)('title').trim().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('description').trim().notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('type').isIn(['INCUBATION', 'ACCELERATION', 'MENTORSHIP', 'WORKSHOP', 'MASTERCLASS']).withMessage('Invalid program type'),
    (0, express_validator_1.body)('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (weeks)'),
    (0, express_validator_1.body)('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
    (0, express_validator_1.body)('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    (0, express_validator_1.body)('startDate').optional().isISO8601().withMessage('Invalid start date'),
    (0, express_validator_1.body)('endDate').optional().isISO8601().withMessage('Invalid end date'),
    (0, express_validator_1.body)('requirements').optional().isObject().withMessage('Requirements must be an object'),
    (0, express_validator_1.body)('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
    (0, express_validator_1.body)('resources').optional().isObject().withMessage('Resources must be an object'),
];
const updateProgramValidation = [
    (0, express_validator_1.body)('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    (0, express_validator_1.body)('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    (0, express_validator_1.body)('type').optional().isIn(['INCUBATION', 'ACCELERATION', 'MENTORSHIP', 'WORKSHOP', 'MASTERCLASS']).withMessage('Invalid program type'),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer (weeks)'),
    (0, express_validator_1.body)('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
    (0, express_validator_1.body)('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    (0, express_validator_1.body)('startDate').optional().isISO8601().withMessage('Invalid start date'),
    (0, express_validator_1.body)('endDate').optional().isISO8601().withMessage('Invalid end date'),
    (0, express_validator_1.body)('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
    (0, express_validator_1.body)('requirements').optional().isObject().withMessage('Requirements must be an object'),
    (0, express_validator_1.body)('curriculum').optional().isObject().withMessage('Curriculum must be an object'),
    (0, express_validator_1.body)('resources').optional().isObject().withMessage('Resources must be an object'),
];
const enrollmentStatusValidation = [
    (0, express_validator_1.body)('status').isIn(['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'WITHDRAWN', 'REJECTED']).withMessage('Invalid enrollment status'),
    (0, express_validator_1.body)('rejectionReason').optional().isString().withMessage('Rejection reason must be a string'),
];
const progressUpdateValidation = [
    (0, express_validator_1.body)('progress').isFloat({ min: 0, max: 100 }).withMessage('Progress must be a number between 0 and 100'),
];
// Public routes
router.get('/', programController_1.getPrograms);
router.get('/:id', programController_1.getProgramById);
// Protected routes (authenticated users)
router.post('/:id/enroll', auth_1.authenticate, programController_1.enrollInProgram);
router.get('/my/enrollments', auth_1.authenticate, programController_1.getMyEnrollments);
router.put('/enrollments/:enrollmentId/progress', auth_1.authenticate, progressUpdateValidation, programController_1.updateEnrollmentProgress);
// Admin-only routes
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), createProgramValidation, programController_1.createProgram);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), updateProgramValidation, programController_1.updateProgram);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), programController_1.deleteProgram);
router.put('/enrollments/:enrollmentId/status', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), enrollmentStatusValidation, programController_1.updateEnrollmentStatus);
router.get('/admin/statistics', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), programController_1.getProgramStatistics);
exports.default = router;
//# sourceMappingURL=programs.js.map