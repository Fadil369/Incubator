"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSMEStatistics = exports.uploadSMEDocuments = exports.updateSMEVerificationStatus = exports.getMySMEProfile = exports.deleteSMEProfile = exports.updateSMEProfile = exports.createSMEProfile = exports.getSMEById = exports.getSMEs = void 0;
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get all SMEs (with pagination and filtering)
 */
exports.getSMEs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
        prisma.smeProfile.findMany({
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
        prisma.smeProfile.count({ where }),
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
exports.getSMEById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const sme = await prisma.smeProfile.findUnique({
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
exports.createSMEProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    // Check validation errors
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
    // Check if user already has an SME profile
    const existingProfile = await prisma.smeProfile.findUnique({
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
    const smeProfile = await prisma.smeProfile.create({
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
            verificationStatus: client_1.VerificationStatus.PENDING,
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
    logger_1.logger.info(`SME profile created for user: ${req.user.email}`, {
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
exports.updateSMEProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    // Check if SME profile exists and user owns it (or is admin)
    const existingProfile = await prisma.smeProfile.findUnique({
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
    const updatedProfile = await prisma.smeProfile.update({
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
                existingProfile.verificationStatus === client_1.VerificationStatus.VERIFIED
                ? { verificationStatus: client_1.VerificationStatus.PENDING }
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
    logger_1.logger.info(`SME profile updated: ${updatedProfile.companyName}`, {
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
exports.deleteSMEProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const existingProfile = await prisma.smeProfile.findUnique({
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
    await prisma.smeProfile.delete({
        where: { id },
    });
    logger_1.logger.info(`SME profile deleted: ${existingProfile.companyName}`, {
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
exports.getMySMEProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const smeProfile = await prisma.smeProfile.findUnique({
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
exports.updateSMEVerificationStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    if (!Object.values(client_1.VerificationStatus).includes(verificationStatus)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid verification status',
            },
        });
    }
    const smeProfile = await prisma.smeProfile.update({
        where: { id },
        data: {
            verificationStatus,
            ...(verificationStatus === client_1.VerificationStatus.REJECTED && rejectionReason && {
                documents: {
                    ...(typeof smeProfile.documents === 'object' ? smeProfile.documents : {}),
                    rejectionReason,
                },
            }),
        },
        include: {
            user: {
                select: {
                    email: true,
                    firstName: true,
                },
            },
        },
    });
    logger_1.logger.info(`SME verification status updated: ${smeProfile.companyName}`, {
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
exports.uploadSMEDocuments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const smeProfile = await prisma.smeProfile.findUnique({
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
    const updatedProfile = await prisma.smeProfile.update({
        where: { id },
        data: {
            documents,
            // Reset to pending if new documents uploaded
            verificationStatus: client_1.VerificationStatus.PENDING,
        },
    });
    logger_1.logger.info(`SME documents uploaded: ${smeProfile.companyName}`, {
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
exports.getSMEStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const [totalSMEs, verifiedSMEs, pendingSMEs, rejectedSMEs, smesByType, smesByIndustry,] = await Promise.all([
        prisma.smeProfile.count(),
        prisma.smeProfile.count({
            where: { verificationStatus: client_1.VerificationStatus.VERIFIED },
        }),
        prisma.smeProfile.count({
            where: { verificationStatus: client_1.VerificationStatus.PENDING },
        }),
        prisma.smeProfile.count({
            where: { verificationStatus: client_1.VerificationStatus.REJECTED },
        }),
        prisma.smeProfile.groupBy({
            by: ['companyType'],
            _count: {
                companyType: true,
            },
        }),
        prisma.smeProfile.findMany({
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