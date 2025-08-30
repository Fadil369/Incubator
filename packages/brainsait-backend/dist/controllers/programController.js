"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramStatistics = exports.updateEnrollmentProgress = exports.updateEnrollmentStatus = exports.getMyEnrollments = exports.enrollInProgram = exports.deleteProgram = exports.updateProgram = exports.createProgram = exports.getProgramById = exports.getPrograms = void 0;
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Get all programs with filtering and pagination
 */
exports.getPrograms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { type, status, search, minDuration, maxDuration, } = req.query;
    const where = {};
    if (type) {
        where.type = type;
    }
    if (status) {
        where.status = status;
    }
    else {
        // Only show published and active programs by default
        where.status = {
            in: [client_1.ProgramStatus.PUBLISHED, client_1.ProgramStatus.ACTIVE],
        };
    }
    if (search) {
        where.OR = [
            {
                title: {
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
        ];
    }
    if (minDuration || maxDuration) {
        where.duration = {};
        if (minDuration) {
            where.duration.gte = parseInt(minDuration);
        }
        if (maxDuration) {
            where.duration.lte = parseInt(maxDuration);
        }
    }
    const [programs, total] = await Promise.all([
        prisma.program.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        }),
        prisma.program.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    res.status(200).json({
        success: true,
        data: {
            programs,
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
 * Get program by ID
 */
exports.getProgramById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const program = await prisma.program.findUnique({
        where: { id },
        include: {
            enrollments: {
                include: {
                    sme: {
                        select: {
                            id: true,
                            companyName: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    enrolledAt: 'desc',
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
    });
    if (!program) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'Program not found',
            },
        });
    }
    res.status(200).json({
        success: true,
        data: {
            program,
        },
    });
});
/**
 * Create new program (Admin only)
 */
exports.createProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
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
    const { title, titleAr, description, descriptionAr, type, duration, maxParticipants, cost, requirements, curriculum, resources, startDate, endDate, } = req.body;
    const program = await prisma.program.create({
        data: {
            title,
            titleAr,
            description,
            descriptionAr,
            type,
            duration,
            maxParticipants,
            cost,
            requirements,
            curriculum,
            resources,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: client_1.ProgramStatus.DRAFT,
        },
    });
    logger_1.logger.info(`Program created: ${program.title}`, {
        adminId: req.user.id,
        programId: program.id,
    });
    res.status(201).json({
        success: true,
        message: 'Program created successfully',
        data: {
            program,
        },
    });
});
/**
 * Update program (Admin only)
 */
exports.updateProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const { id } = req.params;
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
    const existingProgram = await prisma.program.findUnique({
        where: { id },
    });
    if (!existingProgram) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'Program not found',
            },
        });
    }
    const { title, titleAr, description, descriptionAr, type, duration, maxParticipants, cost, requirements, curriculum, resources, startDate, endDate, status, } = req.body;
    const updatedProgram = await prisma.program.update({
        where: { id },
        data: {
            title,
            titleAr,
            description,
            descriptionAr,
            type,
            duration,
            maxParticipants,
            cost,
            requirements,
            curriculum,
            resources,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
        },
    });
    logger_1.logger.info(`Program updated: ${updatedProgram.title}`, {
        adminId: req.user.id,
        programId: updatedProgram.id,
    });
    res.status(200).json({
        success: true,
        message: 'Program updated successfully',
        data: {
            program: updatedProgram,
        },
    });
});
/**
 * Delete program (Admin only)
 */
exports.deleteProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const { id } = req.params;
    const existingProgram = await prisma.program.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
    });
    if (!existingProgram) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'Program not found',
            },
        });
    }
    // Check if program has active enrollments
    if (existingProgram._count.enrollments > 0) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Cannot delete program with existing enrollments',
            },
        });
    }
    await prisma.program.delete({
        where: { id },
    });
    logger_1.logger.info(`Program deleted: ${existingProgram.title}`, {
        adminId: req.user.id,
        programId: id,
    });
    res.status(200).json({
        success: true,
        message: 'Program deleted successfully',
    });
});
/**
 * Enroll SME in program
 */
exports.enrollInProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const { id } = req.params; // Program ID
    // Get user's SME profile
    const smeProfile = await prisma.smeProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!smeProfile) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'SME profile required to enroll in programs',
            },
        });
    }
    // Check if program exists and is available
    const program = await prisma.program.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    enrollments: {
                        where: {
                            status: {
                                in: [client_1.EnrollmentStatus.APPROVED, client_1.EnrollmentStatus.ACTIVE],
                            },
                        },
                    },
                },
            },
        },
    });
    if (!program) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'Program not found',
            },
        });
    }
    if (program.status !== client_1.ProgramStatus.PUBLISHED && program.status !== client_1.ProgramStatus.ACTIVE) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Program is not available for enrollment',
            },
        });
    }
    // Check if program is full
    if (program._count.enrollments >= program.maxParticipants) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Program is full',
            },
        });
    }
    // Check if SME is already enrolled
    const existingEnrollment = await prisma.programEnrollment.findUnique({
        where: {
            smeId_programId: {
                smeId: smeProfile.id,
                programId: program.id,
            },
        },
    });
    if (existingEnrollment) {
        return res.status(409).json({
            success: false,
            error: {
                message: 'Already enrolled in this program',
                data: {
                    enrollment: existingEnrollment,
                },
            },
        });
    }
    // Create enrollment
    const enrollment = await prisma.programEnrollment.create({
        data: {
            smeId: smeProfile.id,
            programId: program.id,
            status: client_1.EnrollmentStatus.PENDING,
        },
        include: {
            program: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    duration: true,
                },
            },
            sme: {
                select: {
                    id: true,
                    companyName: true,
                },
            },
        },
    });
    logger_1.logger.info(`SME enrolled in program: ${program.title}`, {
        userId: req.user.id,
        smeId: smeProfile.id,
        programId: program.id,
        enrollmentId: enrollment.id,
    });
    res.status(201).json({
        success: true,
        message: 'Enrollment successful',
        data: {
            enrollment,
        },
    });
});
/**
 * Get user's program enrollments
 */
exports.getMyEnrollments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
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
                message: 'SME profile not found',
            },
        });
    }
    const enrollments = await prisma.programEnrollment.findMany({
        where: { smeId: smeProfile.id },
        include: {
            program: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    type: true,
                    duration: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                },
            },
        },
        orderBy: {
            enrolledAt: 'desc',
        },
    });
    res.status(200).json({
        success: true,
        data: {
            enrollments,
        },
    });
});
/**
 * Update enrollment status (Admin only)
 */
exports.updateEnrollmentStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const { enrollmentId } = req.params;
    const { status, rejectionReason } = req.body;
    if (!Object.values(client_1.EnrollmentStatus).includes(status)) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid enrollment status',
            },
        });
    }
    const enrollment = await prisma.programEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            program: {
                select: {
                    id: true,
                    title: true,
                    maxParticipants: true,
                },
            },
            sme: {
                select: {
                    companyName: true,
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                        },
                    },
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
    // Check program capacity if approving
    if (status === client_1.EnrollmentStatus.APPROVED || status === client_1.EnrollmentStatus.ACTIVE) {
        const currentEnrollments = await prisma.programEnrollment.count({
            where: {
                programId: enrollment.programId,
                status: {
                    in: [client_1.EnrollmentStatus.APPROVED, client_1.EnrollmentStatus.ACTIVE],
                },
            },
        });
        if (currentEnrollments >= enrollment.program.maxParticipants) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Program is at maximum capacity',
                },
            });
        }
    }
    const updatedEnrollment = await prisma.programEnrollment.update({
        where: { id: enrollmentId },
        data: {
            status,
            ...(status === client_1.EnrollmentStatus.REJECTED && rejectionReason && {
            // Store rejection reason in a metadata field if available
            }),
        },
        include: {
            program: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                },
            },
            sme: {
                select: {
                    id: true,
                    companyName: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            },
        },
    });
    logger_1.logger.info(`Enrollment status updated: ${status}`, {
        adminId: req.user.id,
        enrollmentId,
        programTitle: enrollment.program.title,
        companyName: enrollment.sme.companyName,
        newStatus: status,
    });
    res.status(200).json({
        success: true,
        message: 'Enrollment status updated successfully',
        data: {
            enrollment: updatedEnrollment,
        },
    });
});
/**
 * Update enrollment progress
 */
exports.updateEnrollmentProgress = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const { enrollmentId } = req.params;
    const { progress } = req.body;
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Progress must be a number between 0 and 100',
            },
        });
    }
    const enrollment = await prisma.programEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            sme: {
                select: {
                    userId: true,
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
    if (enrollment.sme.userId !== req.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Insufficient permissions',
            },
        });
    }
    const updateData = {
        progress,
    };
    // Mark as completed if progress is 100%
    if (progress === 100 && enrollment.status !== client_1.EnrollmentStatus.COMPLETED) {
        updateData.status = client_1.EnrollmentStatus.COMPLETED;
        updateData.completedAt = new Date();
    }
    const updatedEnrollment = await prisma.programEnrollment.update({
        where: { id: enrollmentId },
        data: updateData,
    });
    logger_1.logger.info(`Enrollment progress updated: ${progress}%`, {
        userId: req.user.id,
        enrollmentId,
        progress,
    });
    res.status(200).json({
        success: true,
        message: 'Progress updated successfully',
        data: {
            enrollment: updatedEnrollment,
        },
    });
});
/**
 * Get program statistics (Admin only)
 */
exports.getProgramStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Admin privileges required',
            },
        });
    }
    const [totalPrograms, activePrograms, totalEnrollments, activeEnrollments, completedEnrollments, programsByType, enrollmentsByStatus,] = await Promise.all([
        prisma.program.count(),
        prisma.program.count({
            where: { status: client_1.ProgramStatus.ACTIVE },
        }),
        prisma.programEnrollment.count(),
        prisma.programEnrollment.count({
            where: { status: client_1.EnrollmentStatus.ACTIVE },
        }),
        prisma.programEnrollment.count({
            where: { status: client_1.EnrollmentStatus.COMPLETED },
        }),
        prisma.program.groupBy({
            by: ['type'],
            _count: {
                type: true,
            },
        }),
        prisma.programEnrollment.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        }),
    ]);
    res.status(200).json({
        success: true,
        data: {
            overview: {
                totalPrograms,
                activePrograms,
                totalEnrollments,
                activeEnrollments,
                completedEnrollments,
            },
            programsByType: programsByType.map(item => ({
                type: item.type,
                count: item._count.type,
            })),
            enrollmentsByStatus: enrollmentsByStatus.map(item => ({
                status: item.status,
                count: item._count.status,
            })),
        },
    });
});
//# sourceMappingURL=programController.js.map