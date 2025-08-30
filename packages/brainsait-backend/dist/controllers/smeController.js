import { PrismaClient, VerificationStatus } from '@prisma/client';
import { validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
const prisma = new PrismaClient();
/**
 * Get all SMEs (with pagination and filtering)
 */
export const getSMEs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    // Filtering options
    const { companyType, industryFocus, verificationStatus, search, } = req.query;
    const where = {};
    if (companyType) {
        where.companyType = companyType;
    }
    if (industryFocus) {
        where.industryFocus = {
            has: industryFocus,
        };
    }
    if (verificationStatus) {
        where.verificationStatus = verificationStatus;
    }
    if (search) {
        where.OR = [
            {
                companyName: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            {
                description: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            {
                user: {
                    OR: [
                        {
                            firstName: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                        {
                            lastName: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            },
        ];
    }
    const [smes, total] = await Promise.all([
        prisma.sMEProfile.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        isVerified: true,
                    },
                },
                programEnrollments: {
                    select: {
                        id: true,
                        status: true,
                        progress: true,
                        program: {
                            select: {
                                id: true,
                                title: true,
                                type: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        programEnrollments: true,
                        mentorships: true,
                    },
                },
            },
        }),
        prisma.sMEProfile.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    res.status(200).json({
        success: true,
        data: {
            smes,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        },
    });
});
/**
 * Get SME by ID
 */
export const getSMEById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sme = await prisma.sMEProfile.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    isVerified: true,
                    createdAt: true,
                },
            },
            programEnrollments: {
                include: {
                    program: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            type: true,
                            duration: true,
                            status: true,
                        },
                    },
                },
                orderBy: {
                    enrolledAt: 'desc',
                },
            },
            mentorships: {
                include: {
                    mentor: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            expertise: true,
                            currentRole: true,
                            company: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            saudiRegulatory: true,
            healthcareProfile: true,
        },
    });
    if (!sme) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME not found',
            },
        });
    }
    res.status(200).json({
        success: true,
        data: {
            sme,
        },
    });
});
/**
 * Create SME profile (for authenticated users)
 */
export const createSMEProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    // Check if user already has an SME profile
    const existingProfile = await prisma.sMEProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (existingProfile) {
        return res.status(409).json({
            success: false,
            error: {
                message: 'SME profile already exists for this user',
            },
        });
    }
    const { companyName, companyType, industryFocus, description, website, foundedYear, employeeCount, annualRevenue, address, } = req.body;
    const smeProfile = await prisma.sMEProfile.create({
        data: {
            userId: req.user.id,
            companyName,
            companyType,
            industryFocus,
            description,
            website,
            foundedYear,
            employeeCount,
            annualRevenue,
            address,
            verificationStatus: VerificationStatus.PENDING,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isVerified: true,
                },
            },
        },
    });
    logger.info(`SME profile created for user: ${req.user.email}`, {
        userId: req.user.id,
        smeId: smeProfile.id,
        companyName: smeProfile.companyName,
    });
    res.status(201).json({
        success: true,
        message: 'SME profile created successfully',
        data: {
            smeProfile,
        },
    });
});
/**
 * Update SME profile
 */
export const updateSMEProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const { id } = req.params;
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    // Check if SME profile exists and user owns it (or is admin)
    const existingProfile = await prisma.sMEProfile.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
    if (!existingProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile not found',
            },
        });
    }
    // Check ownership or admin privileges
    if (existingProfile.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Insufficient permissions to update this profile',
            },
        });
    }
    const { companyName, companyType, industryFocus, description, website, foundedYear, employeeCount, annualRevenue, address, } = req.body;
    const updatedProfile = await prisma.sMEProfile.update({
        where: { id },
        data: {
            companyName,
            companyType,
            industryFocus,
            description,
            website,
            foundedYear,
            employeeCount,
            annualRevenue,
            address,
            // Reset verification status if critical info changed
            ...(companyName !== existingProfile.companyName ||
                companyType !== existingProfile.companyType ||
                JSON.stringify(industryFocus) !== JSON.stringify(existingProfile.industryFocus)) &&
                existingProfile.verificationStatus === VerificationStatus.VERIFIED
                ? { verificationStatus: VerificationStatus.PENDING }
                : {},
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isVerified: true,
                },
            },
        },
    });
    logger.info(`SME profile updated: ${updatedProfile.companyName}`, {
        userId: req.user.id,
        smeId: updatedProfile.id,
    });
    res.status(200).json({
        success: true,
        message: 'SME profile updated successfully',
        data: {
            smeProfile: updatedProfile,
        },
    });
});
/**
 * Delete SME profile
 */
export const deleteSMEProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const { id } = req.params;
    // Check if SME profile exists and user owns it (or is admin)
    const existingProfile = await prisma.sMEProfile.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
    if (!existingProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile not found',
            },
        });
    }
    // Check ownership or admin privileges
    if (existingProfile.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Insufficient permissions to delete this profile',
            },
        });
    }
    // Delete the profile (cascade will handle related records)
    await prisma.sMEProfile.delete({
        where: { id },
    });
    logger.info(`SME profile deleted: ${existingProfile.companyName}`, {
        userId: req.user.id,
        smeId: id,
    });
    res.status(200).json({
        success: true,
        message: 'SME profile deleted successfully',
    });
});
/**
 * Get current user's SME profile
 */
export const getMySMEProfile = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const smeProfile = await prisma.sMEProfile.findUnique({
        where: { userId: req.user.id },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    isVerified: true,
                },
            },
            programEnrollments: {
                include: {
                    program: {
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            status: true,
                            duration: true,
                        },
                    },
                },
                orderBy: {
                    enrolledAt: 'desc',
                },
            },
            mentorships: {
                include: {
                    mentor: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            expertise: true,
                            currentRole: true,
                            company: true,
                            rating: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });
    if (!smeProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile not found',
            },
        });
    }
    res.status(200).json({
        success: true,
        data: {
            smeProfile,
        },
    });
});
/**
 * Update SME verification status (Admin only)
 */
export const updateSMEVerificationStatus = asyncHandler(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const { id } = req.params;
    const { verificationStatus, rejectionReason } = req.body;
    if (!Object.values(VerificationStatus).includes(verificationStatus)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid verification status',
            },
        });
    }
    // Prepare the update data
    const updateData = {
        verificationStatus,
    };
    // Add rejection reason if rejected
    if (verificationStatus === VerificationStatus.REJECTED && rejectionReason) {
        // First get the current profile to access documents
        const currentProfile = await prisma.sMEProfile.findUnique({
            where: { id }
        });
        updateData.documents = {
            ...(typeof currentProfile?.documents === 'object' ? currentProfile.documents : {}),
            rejectionReason,
        };
    }
    const smeProfile = await prisma.sMEProfile.update({
        where: { id },
        data: updateData,
        include: {
            user: {
                select: {
                    email: true,
                    firstName: true,
                },
            },
        },
    });
    logger.info(`SME verification status updated: ${smeProfile.companyName}`, {
        adminId: req.user.id,
        smeId: smeProfile.id,
        status: verificationStatus,
    });
    res.status(200).json({
        success: true,
        message: 'Verification status updated successfully',
        data: {
            smeProfile,
        },
    });
});
/**
 * Upload SME documents
 */
export const uploadSMEDocuments = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const { id } = req.params;
    const { documents } = req.body;
    // Check if SME profile exists and user owns it
    const smeProfile = await prisma.sMEProfile.findUnique({
        where: { id },
    });
    if (!smeProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile not found',
            },
        });
    }
    if (smeProfile.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Insufficient permissions',
            },
        });
    }
    const updatedProfile = await prisma.sMEProfile.update({
        where: { id },
        data: {
            documents,
            // Reset to pending if new documents uploaded
            verificationStatus: VerificationStatus.PENDING,
        },
    });
    logger.info(`SME documents uploaded: ${smeProfile.companyName}`, {
        userId: req.user.id,
        smeId: id,
    });
    res.status(200).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
            documents: updatedProfile.documents,
        },
    });
});
/**
 * Get SME statistics (Admin only)
 */
export const getSMEStatistics = asyncHandler(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const [totalSMEs, verifiedSMEs, pendingSMEs, rejectedSMEs, smesByType, smesByIndustry,] = await Promise.all([
        prisma.sMEProfile.count(),
        prisma.sMEProfile.count({
            where: { verificationStatus: VerificationStatus.VERIFIED },
        }),
        prisma.sMEProfile.count({
            where: { verificationStatus: VerificationStatus.PENDING },
        }),
        prisma.sMEProfile.count({
            where: { verificationStatus: VerificationStatus.REJECTED },
        }),
        prisma.sMEProfile.groupBy({
            by: ['companyType'],
            _count: {
                companyType: true,
            },
        }),
        prisma.sMEProfile.findMany({
            select: {
                industryFocus: true,
            },
        }),
    ]);
    // Process industry focus data
    const industryMap = new Map();
    smesByIndustry.forEach(sme => {
        sme.industryFocus.forEach(industry => {
            industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
        });
    });
    const industryStats = Array.from(industryMap.entries()).map(([industry, count]) => ({
        industry,
        count,
    }));
    res.status(200).json({
        success: true,
        data: {
            overview: {
                total: totalSMEs,
                verified: verifiedSMEs,
                pending: pendingSMEs,
                rejected: rejectedSMEs,
            },
            byCompanyType: smesByType.map(item => ({
                type: item.companyType,
                count: item._count.companyType,
            })),
            byIndustry: industryStats,
        },
    });
});
//# sourceMappingURL=smeController.js.map