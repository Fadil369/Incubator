"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentTemplates = exports.deleteDocument = exports.downloadDocument = exports.getUserDocuments = exports.generateCertificate = exports.generateBusinessPlan = exports.generateFeasibilityStudy = void 0;
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("../middleware/errorHandler");
const documentService_1 = require("../services/documentService");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Generate feasibility study document
 */
exports.generateFeasibilityStudy = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    // Get user's SME profile
    const smeProfile = await prisma.smeProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!smeProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile required to generate documents',
            },
        });
    }
    const { businessModel, targetMarket, competitiveAdvantage, financialProjections, marketAnalysis, riskAssessment, timeline, } = req.body;
    const feasibilityStudyData = {
        smeId: smeProfile.id,
        companyName: smeProfile.companyName,
        industryFocus: smeProfile.industryFocus,
        businessModel,
        targetMarket,
        competitiveAdvantage,
        financialProjections,
        marketAnalysis,
        riskAssessment,
        timeline,
    };
    try {
        const document = await documentService_1.DocumentService.generateFeasibilityStudy(feasibilityStudyData);
        logger_1.logger.info(`Feasibility study generated for: ${smeProfile.companyName}`, {
            userId: req.user.id,
            smeId: smeProfile.id,
        });
        res.status(200).json({
            success: true,
            message: 'Feasibility study generated successfully',
            data: {
                document: {
                    fileName: document.fileName,
                    downloadUrl: document.downloadUrl,
                    generatedAt: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating feasibility study:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to generate feasibility study',
            },
        });
    }
});
/**
 * Generate business plan document
 */
exports.generateBusinessPlan = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    // Get user's SME profile
    const smeProfile = await prisma.smeProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!smeProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile required to generate documents',
            },
        });
    }
    const { executiveSummary, businessDescription, marketAnalysis, organizationManagement, serviceProductLine, marketingSales, fundingRequest, financialProjections, appendix, } = req.body;
    const businessPlanData = {
        smeId: smeProfile.id,
        executiveSummary,
        businessDescription,
        marketAnalysis,
        organizationManagement,
        serviceProductLine,
        marketingSales,
        fundingRequest,
        financialProjections,
        appendix,
    };
    try {
        const document = await documentService_1.DocumentService.generateBusinessPlan(businessPlanData);
        logger_1.logger.info(`Business plan generated for: ${smeProfile.companyName}`, {
            userId: req.user.id,
            smeId: smeProfile.id,
        });
        res.status(200).json({
            success: true,
            message: 'Business plan generated successfully',
            data: {
                document: {
                    fileName: document.fileName,
                    downloadUrl: document.downloadUrl,
                    generatedAt: new Date().toISOString(),
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating business plan:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to generate business plan',
            },
        });
    }
});
/**
 * Generate certificate (Admin only or for completed enrollments)
 */
exports.generateCertificate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    const { enrollmentId, certificateType, recipientName, programTitle, completionDate, signatory, signatoryTitle, } = req.body;
    // Verify enrollment and completion status
    if (enrollmentId) {
        const enrollment = await prisma.programEnrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                sme: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                program: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Enrollment not found',
                },
            });
        }
        // Check if user owns the enrollment or is admin
        if (enrollment.sme.user.id !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Insufficient permissions',
                },
            });
        }
        // Check if enrollment is completed (unless admin)
        if (enrollment.status !== 'COMPLETED' && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Certificate can only be generated for completed programs',
                },
            });
        }
        const certificateData = {
            recipientName: recipientName || `${enrollment.sme.user.firstName} ${enrollment.sme.user.lastName}`,
            programTitle: programTitle || enrollment.program.title,
            completionDate: completionDate ? new Date(completionDate) : new Date(),
            certificateType: certificateType || 'COMPLETION',
            signatory: signatory || 'Dr. Sarah Johnson',
            signatoryTitle: signatoryTitle || 'Program Director',
        };
        try {
            const document = await documentService_1.DocumentService.generateCertificate(certificateData);
            logger_1.logger.info(`Certificate generated for enrollment: ${enrollmentId}`, {
                userId: req.user.id,
                recipientName: certificateData.recipientName,
                programTitle: certificateData.programTitle,
            });
            res.status(200).json({
                success: true,
                message: 'Certificate generated successfully',
                data: {
                    document: {
                        fileName: document.fileName,
                        downloadUrl: document.downloadUrl,
                        generatedAt: new Date().toISOString(),
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating certificate:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to generate certificate',
                },
            });
        }
    }
    else {
        // Admin can generate certificates without enrollment reference
        if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Admin privileges required for custom certificates',
                },
            });
        }
        const certificateData = {
            recipientName,
            programTitle,
            completionDate: completionDate ? new Date(completionDate) : new Date(),
            certificateType: certificateType || 'COMPLETION',
            signatory: signatory || 'Dr. Sarah Johnson',
            signatoryTitle: signatoryTitle || 'Program Director',
        };
        try {
            const document = await documentService_1.DocumentService.generateCertificate(certificateData);
            logger_1.logger.info(`Custom certificate generated by admin`, {
                adminId: req.user.id,
                recipientName: certificateData.recipientName,
                programTitle: certificateData.programTitle,
            });
            res.status(200).json({
                success: true,
                message: 'Certificate generated successfully',
                data: {
                    document: {
                        fileName: document.fileName,
                        downloadUrl: document.downloadUrl,
                        generatedAt: new Date().toISOString(),
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating custom certificate:', error);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to generate certificate',
                },
            });
        }
    }
});
/**
 * Get user's generated documents
 */
exports.getUserDocuments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    try {
        const documents = await documentService_1.DocumentService.getUserDocuments(req.user.id);
        res.status(200).json({
            success: true,
            data: documents,
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching user documents:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to fetch documents',
            },
        });
    }
});
/**
 * Download document
 */
exports.downloadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { fileName } = req.params;
    // Basic security check - ensure filename doesn't contain path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid filename',
            },
        });
    }
    const filePath = path_1.default.join(process.cwd(), 'uploads', 'generated-documents', fileName);
    try {
        // Check if file exists
        await fs_1.default.promises.access(filePath);
        // Set appropriate headers
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        // Stream the file
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
        logger_1.logger.info(`Document downloaded: ${fileName}`);
    }
    catch (error) {
        logger_1.logger.error('Error downloading document:', error);
        res.status(404).json({
            success: false,
            error: {
                message: 'Document not found',
            },
        });
    }
});
/**
 * Delete document
 */
exports.deleteDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const { fileName } = req.params;
    // Basic security check
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid filename',
            },
        });
    }
    const filePath = path_1.default.join(process.cwd(), 'uploads', 'generated-documents', fileName);
    try {
        await documentService_1.DocumentService.deleteDocument(filePath);
        logger_1.logger.info(`Document deleted: ${fileName}`, {
            userId: req.user.id,
        });
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete document',
            },
        });
    }
});
/**
 * Get document templates (Admin only)
 */
exports.getDocumentTemplates = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const templates = [
        {
            id: 'feasibility-study',
            name: 'Feasibility Study',
            description: 'Comprehensive feasibility study template for healthcare SMEs',
            fields: [
                'businessModel',
                'targetMarket',
                'competitiveAdvantage',
                'financialProjections',
                'marketAnalysis',
                'riskAssessment',
                'timeline',
            ],
        },
        {
            id: 'business-plan',
            name: 'Business Plan',
            description: 'Professional business plan template',
            fields: [
                'executiveSummary',
                'businessDescription',
                'marketAnalysis',
                'organizationManagement',
                'serviceProductLine',
                'marketingSales',
                'fundingRequest',
                'financialProjections',
                'appendix',
            ],
        },
        {
            id: 'certificate',
            name: 'Certificate',
            description: 'Program completion certificate',
            fields: [
                'recipientName',
                'programTitle',
                'completionDate',
                'certificateType',
                'signatory',
                'signatoryTitle',
            ],
        },
    ];
    res.status(200).json({
        success: true,
        data: {
            templates,
        },
    });
});
//# sourceMappingURL=documentController.js.map