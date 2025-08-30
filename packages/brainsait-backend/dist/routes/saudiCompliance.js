"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const saudiComplianceController = __importStar(require("../controllers/saudiComplianceController"));
const router = express_1.default.Router();
/**
 * Saudi Compliance Routes
 */
// Get Saudi regions (public endpoint)
router.get('/regions', saudiComplianceController.getSaudiRegions);
// Validate CR Number
router.post('/validate/cr/:smeId', auth_1.auth, [
    (0, express_validator_1.param)('smeId').isUUID().withMessage('Valid SME ID is required'),
    (0, express_validator_1.body)('crNumber')
        .notEmpty()
        .withMessage('CR number is required')
        .matches(/^\d{10}$/)
        .withMessage('CR number must be exactly 10 digits')
], saudiComplianceController.validateCR);
// Validate VAT Number
router.post('/validate/vat', [
    (0, express_validator_1.body)('vatNumber')
        .notEmpty()
        .withMessage('VAT number is required')
        .matches(/^\d{15}$/)
        .withMessage('VAT number must be exactly 15 digits')
], saudiComplianceController.validateVAT);
// Validate Saudi Address
router.post('/validate/address', [
    (0, express_validator_1.body)('buildingNumber')
        .notEmpty()
        .withMessage('Building number is required')
        .matches(/^\d{4}$/)
        .withMessage('Building number must be exactly 4 digits'),
    (0, express_validator_1.body)('streetName')
        .notEmpty()
        .withMessage('Street name is required')
        .isLength({ min: 3 })
        .withMessage('Street name must be at least 3 characters'),
    (0, express_validator_1.body)('district')
        .notEmpty()
        .withMessage('District is required')
        .isLength({ min: 3 })
        .withMessage('District must be at least 3 characters'),
    (0, express_validator_1.body)('city')
        .notEmpty()
        .withMessage('City is required')
        .isLength({ min: 3 })
        .withMessage('City must be at least 3 characters'),
    (0, express_validator_1.body)('region')
        .notEmpty()
        .withMessage('Region is required')
        .isIn([
        'RIYADH', 'MAKKAH', 'MADINAH', 'EASTERN_PROVINCE', 'ASIR',
        'TABUK', 'QASSIM', 'HAIL', 'NORTHERN_BORDERS', 'JAZAN',
        'NAJRAN', 'AL_BAHAH', 'AL_JAWF'
    ])
        .withMessage('Invalid Saudi region'),
    (0, express_validator_1.body)('postalCode')
        .notEmpty()
        .withMessage('Postal code is required')
        .matches(/^\d{5}$/)
        .withMessage('Postal code must be exactly 5 digits'),
    (0, express_validator_1.body)('additionalNumber')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('Additional number must be exactly 4 digits if provided')
], saudiComplianceController.validateAddress);
// Create or update compliance data for SME
router.put('/sme/:smeId', auth_1.auth, [
    (0, express_validator_1.param)('smeId').isUUID().withMessage('Valid SME ID is required'),
    (0, express_validator_1.body)('crNumber')
        .optional()
        .matches(/^\d{10}$/)
        .withMessage('CR number must be exactly 10 digits'),
    (0, express_validator_1.body)('crIssueDate')
        .optional()
        .isISO8601()
        .withMessage('Valid CR issue date is required'),
    (0, express_validator_1.body)('crExpiryDate')
        .optional()
        .isISO8601()
        .withMessage('Valid CR expiry date is required')
        .custom((value, { req }) => {
        if (req.body.crIssueDate && new Date(value) <= new Date(req.body.crIssueDate)) {
            throw new Error('CR expiry date must be after issue date');
        }
        return true;
    }),
    (0, express_validator_1.body)('crActivity')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('CR activity description must be 5-200 characters'),
    (0, express_validator_1.body)('monocNumber')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('MONOC number must be 5-20 characters'),
    (0, express_validator_1.body)('vatNumber')
        .optional()
        .matches(/^3\d{13}00003$/)
        .withMessage('VAT number must be 15 digits starting with 3 and ending with 00003'),
    (0, express_validator_1.body)('vatRegistrationDate')
        .optional()
        .isISO8601()
        .withMessage('Valid VAT registration date is required'),
    (0, express_validator_1.body)('zakatNumber')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('Zakat number must be 5-20 characters'),
    (0, express_validator_1.body)('gosiNumber')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('GOSI number must be 5-20 characters'),
    // WASL Address validation
    (0, express_validator_1.body)('waslAddress.buildingNumber')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('Building number must be exactly 4 digits'),
    (0, express_validator_1.body)('waslAddress.streetName')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Street name must be 3-100 characters'),
    (0, express_validator_1.body)('waslAddress.district')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('District must be 3-100 characters'),
    (0, express_validator_1.body)('waslAddress.city')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('City must be 3-50 characters'),
    (0, express_validator_1.body)('waslAddress.region')
        .optional()
        .isIn([
        'RIYADH', 'MAKKAH', 'MADINAH', 'EASTERN_PROVINCE', 'ASIR',
        'TABUK', 'QASSIM', 'HAIL', 'NORTHERN_BORDERS', 'JAZAN',
        'NAJRAN', 'AL_BAHAH', 'AL_JAWF'
    ])
        .withMessage('Invalid Saudi region'),
    (0, express_validator_1.body)('waslAddress.postalCode')
        .optional()
        .matches(/^\d{5}$/)
        .withMessage('Postal code must be exactly 5 digits'),
    (0, express_validator_1.body)('waslAddress.additionalNumber')
        .optional()
        .matches(/^\d{4}$/)
        .withMessage('Additional number must be exactly 4 digits if provided')
], saudiComplianceController.createOrUpdateCompliance);
// Get compliance data for SME
router.get('/sme/:smeId', auth_1.auth, [
    (0, express_validator_1.param)('smeId').isUUID().withMessage('Valid SME ID is required')
], saudiComplianceController.getCompliance);
// Get compliance summary for SME (dashboard)
router.get('/sme/:smeId/summary', auth_1.auth, [
    (0, express_validator_1.param)('smeId').isUUID().withMessage('Valid SME ID is required')
], saudiComplianceController.getComplianceSummary);
// Admin routes - require admin privileges
// Get compliance statistics (Admin only)
router.get('/admin/statistics', auth_1.auth, saudiComplianceController.getComplianceStatistics);
// Trigger compliance audit for SME (Admin only)
router.post('/admin/audit/:smeId', auth_1.auth, [
    (0, express_validator_1.param)('smeId').isUUID().withMessage('Valid SME ID is required')
], saudiComplianceController.triggerComplianceAudit);
exports.default = router;
//# sourceMappingURL=saudiCompliance.js.map