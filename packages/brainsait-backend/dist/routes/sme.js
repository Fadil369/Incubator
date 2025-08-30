import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { getSMEs, getSMEById, createSMEProfile, updateSMEProfile, deleteSMEProfile, getMySMEProfile, updateSMEVerificationStatus, uploadSMEDocuments, getSMEStatistics, } from '../controllers/smeController';
const router = Router();
// Validation schemas
const createSMEValidation = [
    body('companyName').trim().notEmpty().withMessage('Company name is required'),
    body('companyType').isIn(['STARTUP', 'SMALL_BUSINESS', 'MEDIUM_ENTERPRISE', 'NON_PROFIT']).withMessage('Invalid company type'),
    body('industryFocus').isArray({ min: 1 }).withMessage('At least one industry focus is required'),
    body('industryFocus.*').isIn([
        'HEALTHCARE_TECHNOLOGY',
        'MEDICAL_DEVICES',
        'PHARMACEUTICALS',
        'BIOTECHNOLOGY',
        'DIGITAL_HEALTH',
        'TELEMEDICINE',
        'HEALTH_ANALYTICS',
        'MEDICAL_RESEARCH',
        'HEALTHCARE_SERVICES',
        'HEALTH_INSURANCE',
    ]).withMessage('Invalid industry focus'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    body('employeeCount').optional().isInt({ min: 0 }).withMessage('Invalid employee count'),
    body('annualRevenue').optional().isString().withMessage('Annual revenue must be a string'),
    body('address').optional().isObject().withMessage('Address must be an object'),
];
const updateSMEValidation = [
    body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    body('companyType').optional().isIn(['STARTUP', 'SMALL_BUSINESS', 'MEDIUM_ENTERPRISE', 'NON_PROFIT']).withMessage('Invalid company type'),
    body('industryFocus').optional().isArray({ min: 1 }).withMessage('At least one industry focus is required'),
    body('industryFocus.*').optional().isIn([
        'HEALTHCARE_TECHNOLOGY',
        'MEDICAL_DEVICES',
        'PHARMACEUTICALS',
        'BIOTECHNOLOGY',
        'DIGITAL_HEALTH',
        'TELEMEDICINE',
        'HEALTH_ANALYTICS',
        'MEDICAL_RESEARCH',
        'HEALTHCARE_SERVICES',
        'HEALTH_INSURANCE',
    ]).withMessage('Invalid industry focus'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    body('employeeCount').optional().isInt({ min: 0 }).withMessage('Invalid employee count'),
    body('annualRevenue').optional().isString().withMessage('Annual revenue must be a string'),
    body('address').optional().isObject().withMessage('Address must be an object'),
];
const verificationStatusValidation = [
    body('verificationStatus').isIn(['PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED']).withMessage('Invalid verification status'),
    body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string'),
];
const uploadDocumentsValidation = [
    body('documents').isObject().withMessage('Documents must be an object'),
];
// Public routes
router.get('/', getSMEs);
router.get('/:id', getSMEById);
// Protected routes (authenticated users)
router.get('/my/profile', authenticate, getMySMEProfile);
router.post('/', authenticate, createSMEValidation, createSMEProfile);
router.put('/:id', authenticate, updateSMEValidation, updateSMEProfile);
router.delete('/:id', authenticate, deleteSMEProfile);
router.put('/:id/documents', authenticate, uploadDocumentsValidation, uploadSMEDocuments);
// Admin-only routes
router.put('/:id/verification', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), verificationStatusValidation, updateSMEVerificationStatus);
router.get('/admin/statistics', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getSMEStatistics);
export default router;
//# sourceMappingURL=sme.js.map