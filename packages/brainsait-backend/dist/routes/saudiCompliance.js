import express from 'express';
import { body, param } from 'express-validator';
import { auth } from '../middleware/auth';
import * as saudiComplianceController from '../controllers/saudiComplianceController';
const router = express.Router();
/**
 * Saudi Compliance Routes
 */
// Get Saudi regions (public endpoint)
router.get('/regions', saudiComplianceController.getSaudiRegions);
// Validate CR Number
router.post('/validate/cr/:smeId', auth, [
    param('smeId').isUUID().withMessage('Valid SME ID is required'),
    body('crNumber')
        .notEmpty()
        .withMessage('CR number is required')
        .matches(/^\d{10}$/)
        .withMessage('CR number must be exactly 10 digits')
], saudiComplianceController.validateCR);
// Validate VAT Number
router.post('/validate/vat', [
    body('vatNumber')
        .notEmpty()
        .withMessage('VAT number is required')
        .matches(/^\d{15}$/)
        .withMessage('VAT number must be exactly 15 digits')
], saudiComplianceController.validateVAT);
// Validate Saudi Address
router.post('/validate/address', [
    body('buildingNumber')
        .notEmpty()
        .withMessage('Building number is required')
        .matches(/^\d{4}$/)
        .withMessage('Building number must be exactly 4 digits'),
    body('streetName')
        .notEmpty()
        .withMessage('Street name is required')
        .isLength({ min: 3 })
        .withMessage('Street name must be at least 3 characters'),
    body('district')
        .notEmpty()
        .withMessage('District is required')
        .isLength({ min: 3 })
        .withMessage('District must be at least 3 characters'),
    body('city')
        .notEmpty()
        .withMessage('City is required')
        .isLength({ min: 3 })
        .withMessage('City must be at least 3 characters'),
    body('region')
        .notEmpty()
        .withMessage('Region is required')
        .isIn([
        'RIYADH', 'MAKKAH', 'MADINAH', 'EASTERN_PROVINCE', 'ASIR',
        'TABUK', 'QASSIM', 'HAIL', 'NORTHERN_BORDERS', 'JAZAN',
        'NAJRAN', 'AL_BAHAH', 'AL_JAWF'
    ])
        .withMessage('Invalid Saudi region'),
    body('postalCode')
        .notEmpty()
        .withMessage('Postal code is required')
        .matches(/^\d{5}$/)
        .withMessage('Postal code must be exactly 5 digits'),
    body('additionalNumber')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('Additional number must be exactly 4 digits if provided')
], saudiComplianceController.validateAddress);
// Create or update compliance data for SME
router.put('/sme/:smeId', auth, [
    param('smeId').isUUID().withMessage('Valid SME ID is required'),
    body('crNumber')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('CR number must be exactly 10 digits'),
    body('crIssueDate')
        .optional()
        .isISO8601()
        .withMessage('Valid CR issue date is required'),
    body('crExpiryDate')
        .optional()
        .isISO8601()
        .withMessage('Valid CR expiry date is required')
        .custom((value, { req }) => {
        if (req.body.crIssueDate && new Date(value) <= new Date(req.body.crIssueDate)) {
            throw new Error('CR expiry date must be after issue date');
        }
        return true;
    }),
    body('crActivity')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('CR activity description must be 5-200 characters'),
    body('monocNumber')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('MONOC number must be 5-20 characters'),
    body('vatNumber')
        .optional()
        .matches(/^3\d{13}00003$/)
        .withMessage('VAT number must be 15 digits starting with 3 and ending with 00003'),
    body('vatRegistrationDate')
        .optional()
        .isISO8601()
        .withMessage('Valid VAT registration date is required'),
    body('zakatNumber')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('Zakat number must be 5-20 characters'),
    body('gosiNumber')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('GOSI number must be 5-20 characters'),
    // WASL Address validation
    body('waslAddress.buildingNumber')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('Building number must be exactly 4 digits'),
    body('waslAddress.streetName')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Street name must be 3-100 characters'),
    body('waslAddress.district')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('District must be 3-100 characters'),
    body('waslAddress.city')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('City must be 3-50 characters'),
    body('waslAddress.region')
        .optional()
        .isIn([
        'RIYADH', 'MAKKAH', 'MADINAH', 'EASTERN_PROVINCE', 'ASIR',
        'TABUK', 'QASSIM', 'HAIL', 'NORTHERN_BORDERS', 'JAZAN',
        'NAJRAN', 'AL_BAHAH', 'AL_JAWF'
    ])
        .withMessage('Invalid Saudi region'),
    body('waslAddress.postalCode')
        .optional()
        .matches(/^\d{5}$/)
        .withMessage('Postal code must be exactly 5 digits'),
    body('waslAddress.additionalNumber')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('Additional number must be exactly 4 digits if provided')
], saudiComplianceController.createOrUpdateCompliance);
// Get compliance data for SME
router.get('/sme/:smeId', auth, [
    param('smeId').isUUID().withMessage('Valid SME ID is required')
], saudiComplianceController.getCompliance);
// Get compliance summary for SME (dashboard)
router.get('/sme/:smeId/summary', auth, [
    param('smeId').isUUID().withMessage('Valid SME ID is required')
], saudiComplianceController.getComplianceSummary);
// Admin routes - require admin privileges
// Get compliance statistics (Admin only)
router.get('/admin/statistics', auth, saudiComplianceController.getComplianceStatistics);
// Trigger compliance audit for SME (Admin only)
router.post('/admin/audit/:smeId', auth, [
    param('smeId').isUUID().withMessage('Valid SME ID is required')
], saudiComplianceController.triggerComplianceAudit);
export default router;
//# sourceMappingURL=saudiCompliance.js.map