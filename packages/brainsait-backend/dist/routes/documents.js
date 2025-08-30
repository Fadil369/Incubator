"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const documentController_1 = require("../controllers/documentController");
const router = (0, express_1.Router)();
// Validation schemas
const feasibilityStudyValidation = [
    (0, express_validator_1.body)('businessModel').notEmpty().withMessage('Business model is required'),
    (0, express_validator_1.body)('targetMarket').notEmpty().withMessage('Target market is required'),
    (0, express_validator_1.body)('competitiveAdvantage').notEmpty().withMessage('Competitive advantage is required'),
    (0, express_validator_1.body)('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
    (0, express_validator_1.body)('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
    (0, express_validator_1.body)('riskAssessment').optional().isObject().withMessage('Risk assessment must be an object'),
    (0, express_validator_1.body)('timeline').optional().isObject().withMessage('Timeline must be an object'),
];
const businessPlanValidation = [
    (0, express_validator_1.body)('executiveSummary').optional().isString().withMessage('Executive summary must be a string'),
    (0, express_validator_1.body)('businessDescription').optional().isString().withMessage('Business description must be a string'),
    (0, express_validator_1.body)('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
    (0, express_validator_1.body)('organizationManagement').optional().isObject().withMessage('Organization management must be an object'),
    (0, express_validator_1.body)('serviceProductLine').optional().isObject().withMessage('Service/product line must be an object'),
    (0, express_validator_1.body)('marketingSales').optional().isObject().withMessage('Marketing/sales must be an object'),
    (0, express_validator_1.body)('fundingRequest').optional().isObject().withMessage('Funding request must be an object'),
    (0, express_validator_1.body)('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
    (0, express_validator_1.body)('appendix').optional().isString().withMessage('Appendix must be a string'),
];
const certificateValidation = [
    (0, express_validator_1.body)('enrollmentId').optional().isString().withMessage('Enrollment ID must be a string'),
    (0, express_validator_1.body)('recipientName').optional().isString().withMessage('Recipient name must be a string'),
    (0, express_validator_1.body)('programTitle').optional().isString().withMessage('Program title must be a string'),
    (0, express_validator_1.body)('completionDate').optional().isISO8601().withMessage('Invalid completion date'),
    (0, express_validator_1.body)('certificateType').optional().isIn(['COMPLETION', 'ACHIEVEMENT', 'PARTICIPATION']).withMessage('Invalid certificate type'),
    (0, express_validator_1.body)('signatory').optional().isString().withMessage('Signatory must be a string'),
    (0, express_validator_1.body)('signatoryTitle').optional().isString().withMessage('Signatory title must be a string'),
];
// Protected routes (authenticated users)
router.post('/feasibility-study', auth_1.authenticate, feasibilityStudyValidation, documentController_1.generateFeasibilityStudy);
router.post('/business-plan', auth_1.authenticate, businessPlanValidation, documentController_1.generateBusinessPlan);
router.post('/certificate', auth_1.authenticate, certificateValidation, documentController_1.generateCertificate);
router.get('/my-documents', auth_1.authenticate, documentController_1.getUserDocuments);
router.delete('/:fileName', auth_1.authenticate, documentController_1.deleteDocument);
// Public download route (with security checks in controller)
router.get('/download/:fileName', documentController_1.downloadDocument);
// Admin-only routes
router.get('/templates', auth_1.authenticate, (0, auth_1.authorize)('ADMIN', 'SUPER_ADMIN'), documentController_1.getDocumentTemplates);
exports.default = router;
//# sourceMappingURL=documents.js.map