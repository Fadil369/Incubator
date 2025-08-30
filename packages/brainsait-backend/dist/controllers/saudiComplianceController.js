import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { saudiComplianceService } from '../services/saudiComplianceService';
import { validateCRNumber, validateVATNumber, validateSaudiAddress } from '../utils/saudiValidation';
import { logger } from '../utils/logger';
const prisma = new PrismaClient();
/**
 * Create or update Saudi regulatory compliance data
 */
export const createOrUpdateCompliance = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: { message: 'Validation failed', details: errors.array() }
        });
    }
    const { smeId } = req.params;
    const complianceData = req.body;
    // Verify SME ownership or admin privileges
    const sme = await prisma.sMEProfile.findUnique({
        where: { id: smeId }
    });
    if (!sme) {
        return res.status(404).json({
            success: false,
            error: { message: 'SME profile not found' }
        });
    }
    if (sme.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: { message: 'Insufficient permissions' }
        });
    }
    try {
        const result = await saudiComplianceService.createOrUpdateCompliance(smeId, complianceData);
        logger.info(`Saudi compliance updated for SME: ${smeId}`, {
            userId: req.user.id,
            smeId,
            score: result.complianceCheck.score
        });
        res.status(200).json({
            success: true,
            message: 'Saudi compliance data updated successfully',
            data: {
                compliance: result.compliance,
                complianceCheck: result.complianceCheck
            }
        });
    }
    catch (error) {
        logger.error('Failed to update Saudi compliance', {
            smeId,
            userId: req.user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(400).json({
            success: false,
            error: {
                message: 'Failed to update compliance data',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Get Saudi compliance data for an SME
 */
export const getCompliance = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
    }
    const { smeId } = req.params;
    // Verify SME ownership or admin privileges
    const sme = await prisma.sMEProfile.findUnique({
        where: { id: smeId }
    });
    if (!sme) {
        return res.status(404).json({
            success: false,
            error: { message: 'SME profile not found' }
        });
    }
    if (sme.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: { message: 'Insufficient permissions' }
        });
    }
    const compliance = await prisma.saudiRegulatoryCompliance.findUnique({
        where: { smeId },
        include: {
            sme: {
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    healthcareProfile: true
                }
            }
        }
    });
    if (!compliance) {
        return res.status(404).json({
            success: false,
            error: { message: 'No compliance data found' }
        });
    }
    // Perform fresh compliance check
    const complianceCheck = await saudiComplianceService.performComplianceCheck(smeId);
    res.status(200).json({
        success: true,
        data: {
            compliance,
            complianceCheck
        }
    });
});
/**
 * Get compliance summary (for dashboard)
 */
export const getComplianceSummary = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
    }
    const { smeId } = req.params;
    // Verify SME ownership or admin privileges
    const sme = await prisma.sMEProfile.findUnique({
        where: { id: smeId }
    });
    if (!sme) {
        return res.status(404).json({
            success: false,
            error: { message: 'SME profile not found' }
        });
    }
    if (sme.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: { message: 'Insufficient permissions' }
        });
    }
    const summary = await saudiComplianceService.getComplianceSummary(smeId);
    res.status(200).json({
        success: true,
        data: { summary }
    });
});
/**
 * Validate CR Number with government API
 */
export const validateCR = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: { message: 'Authentication required' }
        });
    }
    const { crNumber } = req.body;
    const { smeId } = req.params;
    if (!crNumber) {
        return res.status(400).json({
            success: false,
            error: { message: 'CR number is required' }
        });
    }
    // Basic validation first
    const validation = validateCRNumber(crNumber);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid CR number format',
                details: validation.errors
            }
        });
    }
    // Validate with government API
    const isValid = await saudiComplianceService.validateCRWithGovernment(crNumber, smeId);
    res.status(200).json({
        success: true,
        data: {
            crNumber: validation.formattedCR,
            isValid,
            governmentValidated: isValid
        }
    });
});
/**
 * Validate VAT Number
 */
export const validateVAT = asyncHandler(async (req, res) => {
    const { vatNumber } = req.body;
    if (!vatNumber) {
        return res.status(400).json({
            success: false,
            error: { message: 'VAT number is required' }
        });
    }
    const validation = validateVATNumber(vatNumber);
    res.status(200).json({
        success: true,
        data: {
            vatNumber: validation.formattedVAT,
            isValid: validation.isValid,
            errors: validation.errors
        }
    });
});
/**
 * Validate Saudi Address (WASL)
 */
export const validateAddress = asyncHandler(async (req, res) => {
    const address = req.body;
    const validation = validateSaudiAddress(address);
    res.status(200).json({
        success: true,
        data: {
            address: validation.formattedAddress,
            isValid: validation.isValid,
            errors: validation.errors
        }
    });
});
/**
 * Get compliance statistics (Admin only)
 */
export const getComplianceStatistics = asyncHandler(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: { message: 'Admin privileges required' }
        });
    }
    const [totalSMEs, withCompliance, compliantSMEs, partiallyCompliant, nonCompliant, avgScore, regionStats, recentAPILogs] = await Promise.all([
        prisma.sMEProfile.count(),
        prisma.saudiRegulatoryCompliance.count(),
        prisma.saudiRegulatoryCompliance.count({
            where: { overallComplianceScore: { gte: 80 } }
        }),
        prisma.saudiRegulatoryCompliance.count({
            where: {
                overallComplianceScore: { gte: 60, lt: 80 }
            }
        }),
        prisma.saudiRegulatoryCompliance.count({
            where: { overallComplianceScore: { lt: 60 } }
        }),
        prisma.saudiRegulatoryCompliance.aggregate({
            _avg: { overallComplianceScore: true }
        }),
        prisma.saudiRegulatoryCompliance.groupBy({
            by: ['waslRegion'],
            _count: { waslRegion: true },
            where: { waslRegion: { not: null } }
        }),
        prisma.saudiGovernmentAPILog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                requestType: true,
                status: true,
                responseTime: true,
                createdAt: true,
                smeId: true
            }
        })
    ]);
    res.status(200).json({
        success: true,
        data: {
            overview: {
                totalSMEs,
                withCompliance,
                compliantSMEs,
                partiallyCompliant,
                nonCompliant,
                averageScore: avgScore._avg.overallComplianceScore || 0,
                complianceRate: totalSMEs > 0 ? (compliantSMEs / totalSMEs) * 100 : 0
            },
            regionDistribution: regionStats.map(stat => ({
                region: stat.waslRegion,
                count: stat._count.waslRegion
            })),
            recentAPIActivity: recentAPILogs
        }
    });
});
/**
 * Trigger compliance audit for SME
 */
export const triggerComplianceAudit = asyncHandler(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: { message: 'Admin privileges required' }
        });
    }
    const { smeId } = req.params;
    const complianceCheck = await saudiComplianceService.performComplianceCheck(smeId);
    // Update audit date
    await prisma.saudiRegulatoryCompliance.update({
        where: { smeId },
        data: {
            lastFullAudit: new Date(),
            nextAuditDue: complianceCheck.nextAuditDate,
            overallComplianceScore: complianceCheck.score,
            complianceOfficer: req.user.id
        }
    });
    logger.info(`Compliance audit triggered for SME: ${smeId}`, {
        auditedBy: req.user.id,
        score: complianceCheck.score,
        issues: complianceCheck.issues.length
    });
    res.status(200).json({
        success: true,
        message: 'Compliance audit completed successfully',
        data: { complianceCheck }
    });
});
/**
 * Get Saudi regions list
 */
export const getSaudiRegions = asyncHandler(async (req, res) => {
    const { lang } = req.query;
    const regions = [
        { code: 'RIYADH', nameEn: 'Riyadh', nameAr: 'الرياض' },
        { code: 'MAKKAH', nameEn: 'Makkah', nameAr: 'مكة المكرمة' },
        { code: 'MADINAH', nameEn: 'Madinah', nameAr: 'المدينة المنورة' },
        { code: 'EASTERN_PROVINCE', nameEn: 'Eastern Province', nameAr: 'المنطقة الشرقية' },
        { code: 'ASIR', nameEn: 'Asir', nameAr: 'عسير' },
        { code: 'TABUK', nameEn: 'Tabuk', nameAr: 'تبوك' },
        { code: 'QASSIM', nameEn: 'Qassim', nameAr: 'القصيم' },
        { code: 'HAIL', nameEn: 'Hail', nameAr: 'حائل' },
        { code: 'NORTHERN_BORDERS', nameEn: 'Northern Borders', nameAr: 'الحدود الشمالية' },
        { code: 'JAZAN', nameEn: 'Jazan', nameAr: 'جازان' },
        { code: 'NAJRAN', nameEn: 'Najran', nameAr: 'نجران' },
        { code: 'AL_BAHAH', nameEn: 'Al Bahah', nameAr: 'الباحة' },
        { code: 'AL_JAWF', nameEn: 'Al Jawf', nameAr: 'الجوف' }
    ];
    res.status(200).json({
        success: true,
        data: { regions }
    });
});
//# sourceMappingURL=saudiComplianceController.js.map