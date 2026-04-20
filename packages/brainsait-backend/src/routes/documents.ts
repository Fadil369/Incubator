import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  generateFeasibilityStudy,
  generateBusinessPlan,
  generateCertificate,
  getUserDocuments,
  downloadDocument,
  deleteDocument,
  getDocumentTemplates,
} from '../controllers/documentController';

const router = Router();

// Validation schemas
const feasibilityStudyValidation = [
  body('businessModel').notEmpty().withMessage('Business model is required'),
  body('targetMarket').notEmpty().withMessage('Target market is required'),
  body('competitiveAdvantage').notEmpty().withMessage('Competitive advantage is required'),
  body('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
  body('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
  body('riskAssessment').optional().isObject().withMessage('Risk assessment must be an object'),
  body('timeline').optional().isObject().withMessage('Timeline must be an object'),
];

const businessPlanValidation = [
  body('executiveSummary').optional().isString().withMessage('Executive summary must be a string'),
  body('businessDescription').optional().isString().withMessage('Business description must be a string'),
  body('marketAnalysis').optional().isObject().withMessage('Market analysis must be an object'),
  body('organizationManagement').optional().isObject().withMessage('Organization management must be an object'),
  body('serviceProductLine').optional().isObject().withMessage('Service/product line must be an object'),
  body('marketingSales').optional().isObject().withMessage('Marketing/sales must be an object'),
  body('fundingRequest').optional().isObject().withMessage('Funding request must be an object'),
  body('financialProjections').optional().isObject().withMessage('Financial projections must be an object'),
  body('appendix').optional().isString().withMessage('Appendix must be a string'),
];

const certificateValidation = [
  body('enrollmentId').optional().isString().withMessage('Enrollment ID must be a string'),
  body('recipientName').optional().isString().withMessage('Recipient name must be a string'),
  body('programTitle').optional().isString().withMessage('Program title must be a string'),
  body('completionDate').optional().isISO8601().withMessage('Invalid completion date'),
  body('certificateType').optional().isIn(['COMPLETION', 'ACHIEVEMENT', 'PARTICIPATION']).withMessage('Invalid certificate type'),
  body('signatory').optional().isString().withMessage('Signatory must be a string'),
  body('signatoryTitle').optional().isString().withMessage('Signatory title must be a string'),
];

// Protected routes (authenticated users)
router.post('/feasibility-study', authenticate, feasibilityStudyValidation, generateFeasibilityStudy);
router.post('/business-plan', authenticate, businessPlanValidation, generateBusinessPlan);
router.post('/certificate', authenticate, certificateValidation, generateCertificate);
router.get('/my-documents', authenticate, getUserDocuments);
router.delete('/:fileName', authenticate, deleteDocument);

// Public download route — requires a valid signed token via ?token= query param (validated in controller)
router.get('/download/:fileName', downloadDocument);

// Admin-only routes
router.get('/templates', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getDocumentTemplates);

export default router;