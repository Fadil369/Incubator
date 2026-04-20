"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const errorHandler_1 = require("../middleware/errorHandler");
const pdfService_1 = require("../services/pdfService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Generate custom PDF
const generatePDF = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { template, data, language = 'en', format = 'A4', orientation = 'portrait' } = req.body;
    try {
        const pdfBuffer = await pdfService_1.pdfService.generatePDF({
            template,
            data,
            language,
            format,
            orientation,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${template}-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
        logger_1.logger.info('PDF generated and sent', {
            template,
            language,
            size: pdfBuffer.length,
        });
    }
    catch (error) {
        logger_1.logger.error('PDF generation failed', error);
        res.status(500).json({
            success: false,
            error: 'PDF generation failed',
        });
    }
});
// Generate certificate
const generateCertificate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { language = 'en' } = req.query;
    const data = req.body;
    try {
        const pdfBuffer = await pdfService_1.pdfService.generateCertificate(data, language);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
        logger_1.logger.info('Certificate generated', {
            language,
            recipientName: data.recipientName,
            programName: data.programName,
        });
    }
    catch (error) {
        logger_1.logger.error('Certificate generation failed', error);
        res.status(500).json({
            success: false,
            error: 'Certificate generation failed',
        });
    }
});
// Generate report
const generateReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { language = 'en' } = req.query;
    const data = req.body;
    try {
        const pdfBuffer = await pdfService_1.pdfService.generateReport(data, language);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
        logger_1.logger.info('Report generated', {
            language,
            reportType: data.type,
            dataPoints: Array.isArray(data.items) ? data.items.length : 0,
        });
    }
    catch (error) {
        logger_1.logger.error('Report generation failed', error);
        res.status(500).json({
            success: false,
            error: 'Report generation failed',
        });
    }
});
// Generate invoice
const generateInvoice = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { language = 'en' } = req.query;
    const data = req.body;
    try {
        const pdfBuffer = await pdfService_1.pdfService.generateInvoice(data, language);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${data.invoiceNumber || Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
        logger_1.logger.info('Invoice generated', {
            language,
            invoiceNumber: data.invoiceNumber,
            amount: data.totalAmount,
        });
    }
    catch (error) {
        logger_1.logger.error('Invoice generation failed', error);
        res.status(500).json({
            success: false,
            error: 'Invoice generation failed',
        });
    }
});
// Generate program summary
const generateProgramSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { language = 'en' } = req.query;
    const data = req.body;
    try {
        const pdfBuffer = await pdfService_1.pdfService.generateProgramSummary(data, language);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="program-summary-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
        logger_1.logger.info('Program summary generated', {
            language,
            programId: data.id,
            programName: data.title,
        });
    }
    catch (error) {
        logger_1.logger.error('Program summary generation failed', error);
        res.status(500).json({
            success: false,
            error: 'Program summary generation failed',
        });
    }
});
// Routes
router.post('/generate', [
    (0, express_validator_1.body)('template').notEmpty().withMessage('Template name is required'),
    (0, express_validator_1.body)('data').isObject().withMessage('Data object is required'),
    (0, express_validator_1.body)('language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar'),
    (0, express_validator_1.body)('format').optional().isIn(['A4', 'Letter', 'Legal']).withMessage('Invalid format'),
    (0, express_validator_1.body)('orientation').optional().isIn(['portrait', 'landscape']).withMessage('Invalid orientation'),
], generatePDF);
router.post('/certificate', [
    (0, express_validator_1.body)('recipientName').notEmpty().withMessage('Recipient name is required'),
    (0, express_validator_1.body)('programName').notEmpty().withMessage('Program name is required'),
    (0, express_validator_1.body)('completionDate').notEmpty().withMessage('Completion date is required'),
    (0, express_validator_1.query)('language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar'),
], generateCertificate);
router.post('/report', [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Report title is required'),
    (0, express_validator_1.body)('type').notEmpty().withMessage('Report type is required'),
    (0, express_validator_1.body)('data').isObject().withMessage('Report data is required'),
    (0, express_validator_1.query)('language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar'),
], generateReport);
router.post('/invoice', [
    (0, express_validator_1.body)('invoiceNumber').notEmpty().withMessage('Invoice number is required'),
    (0, express_validator_1.body)('clientName').notEmpty().withMessage('Client name is required'),
    (0, express_validator_1.body)('items').isArray().withMessage('Items must be an array'),
    (0, express_validator_1.body)('totalAmount').isNumeric().withMessage('Total amount must be a number'),
    (0, express_validator_1.query)('language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar'),
], generateInvoice);
router.post('/program-summary', [
    (0, express_validator_1.body)('id').notEmpty().withMessage('Program ID is required'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('Program title is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Program description is required'),
    (0, express_validator_1.query)('language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar'),
], generateProgramSummary);
exports.default = router;
//# sourceMappingURL=pdf.js.map