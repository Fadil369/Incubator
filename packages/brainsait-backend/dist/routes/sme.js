"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const smeController_1 = require("../controllers/smeController");
const router = (0, express_1.Router)();
// Validation schemas
const createSMEValidation = [
    (0, express_validator_1.body)('companyName').trim().notEmpty().withMessage('Company name is required'),
    (0, express_validator_1.body)('companyType').isIn(['STARTUP', 'SMALL_BUSINESS', 'MEDIUM_ENTERPRISE', 'NON_PROFIT']).withMessage('Invalid company type'),
    (0, express_validator_1.body)('industryFocus').isArray({ min: 1 }).withMessage('At least one industry focus is required'),
    (0, express_validator_1.body)('industryFocus.*').isIn([
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
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string'),
    (0, express_validator_1.body)('website').optional().isURL().withMessage('Invalid website URL'),
    (0, express_validator_1.body)('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    (0, express_validator_1.body)('employeeCount').optional().isInt({ min: 0 }).withMessage('Invalid employee count'),
    (0, express_validator_1.body)('annualRevenue').optional().isString().withMessage('Annual revenue must be a string'),
    (0, express_validator_1.body)('address').optional().isObject().withMessage('Address must be an object'),
];
const updateSMEValidation = [
    (0, express_validator_1.body)('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty'),
    (0, express_validator_1.body)('companyType').optional().isIn(['STARTUP', 'SMALL_BUSINESS', 'MEDIUM_ENTERPRISE', 'NON_PROFIT']).withMessage('Invalid company type'),
    (0, express_validator_1.body)('industryFocus').optional().isArray({ min: 1 }).withMessage('At least one industry focus is required'),
    (0, express_validator_1.body)('industryFocus.*').optional().isIn([
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
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string'),
    (0, express_validator_1.body)('website').optional().isURL().withMessage('Invalid website URL'),
    (0, express_validator_1.body)('foundedYear').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid founded year'),
    (0, express_validator_1.body)('employeeCount').optional().isInt({ min: 0 }).withMessage('Invalid employee count'),
    (0, express_validator_1.body)('annualRevenue').optional().isString().withMessage('Annual revenue must be a string'),
    (0, express_validator_1.body)('address').optional().isObject().withMessage('Address must be an object'),
];
const verificationStatusValidation = [
    (0, express_validator_1.body)('verificationStatus').isIn(['PENDING', 'IN_REVIEW', 'VERIFIED', 'REJECTED']).withMessage('Invalid verification status'),
    (0, express_validator_1.body)('rejectionReason').optional().isString().withMessage('Rejection reason must be a string'),
];
const uploadDocumentsValidation = [
    (0, express_validator_1.body)('documents').isObject().withMessage('Documents must be an object'),
];
// Public routes
router.get('/', smeController_1.getSMEs);
router.get('/:id', smeController_1.getSMEById);
// Protected routes (authenticated users)
router.get('/my/profile', auth_1.authenticate, smeController_1.getMySMEProfile);
router.post('/', auth_1.authenticate, createSMEValidation, smeController_1.createSMEProfile);
router.put('/:id', auth_1.authenticate, updateSMEValidation, smeController_1.updateSMEProfile);
router.delete('/:id', auth_1.authenticate, smeController_1.deleteSMEProfile);
router.put('/:id/documents', auth_1.authenticate, uploadDocumentsValidation, smeController_1.uploadSMEDocuments);
// Admin-only routes
router.put('/:id/verification', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), verificationStatusValidation, smeController_1.updateSMEVerificationStatus);
router.get('/admin/statistics', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), smeController_1.getSMEStatistics);
exports.default = router;
//# sourceMappingURL=sme.js.map