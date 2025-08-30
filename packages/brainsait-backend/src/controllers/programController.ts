import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient, ProgramType, ProgramStatus, EnrollmentStatus } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get all programs with filtering and pagination
 */
export const getPrograms = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const {
    type,
    status,
    search,
    minDuration,
    maxDuration,
  } = req.query;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  } else {
    // Only show published and active programs by default
    where.status = {
      in: [ProgramStatus.PUBLISHED, ProgramStatus.ACTIVE],
    };
  }

  if (search) {
    where.OR = [
      {
        title: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search as string,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (minDuration || maxDuration) {
    where.duration = {};
    if (minDuration) {
      where.duration.gte = parseInt(minDuration as string);
    }
    if (maxDuration) {
      where.duration.lte = parseInt(maxDuration as string);
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
export const getProgramById = asyncHandler(async (req: Request, res: Response) => {
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
export const createProgram = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

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

  const {
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
    startDate,
    endDate,
  } = req.body;

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
      status: ProgramStatus.DRAFT,
    },
  });

  logger.info(`Program created: ${program.title}`, {
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
export const updateProgram = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

  const { id } = req.params;

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

  const {
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
    startDate,
    endDate,
    status,
  } = req.body;

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

  logger.info(`Program updated: ${updatedProgram.title}`, {
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
export const deleteProgram = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  logger.info(`Program deleted: ${existingProgram.title}`, {
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
export const enrollInProgram = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  const smeProfile = await prisma.sMEProfile.findUnique({
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
                in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE],
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

  if (program.status !== ProgramStatus.PUBLISHED && program.status !== ProgramStatus.ACTIVE) {
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
      status: EnrollmentStatus.PENDING,
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

  logger.info(`SME enrolled in program: ${program.title}`, {
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
export const getMyEnrollments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
  }

  // Get user's SME profile
  const smeProfile = await prisma.sMEProfile.findUnique({
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
export const updateEnrollmentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  if (!Object.values(EnrollmentStatus).includes(status)) {
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
  if (status === EnrollmentStatus.APPROVED || status === EnrollmentStatus.ACTIVE) {
    const currentEnrollments = await prisma.programEnrollment.count({
      where: {
        programId: enrollment.programId,
        status: {
          in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ACTIVE],
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
      ...(status === EnrollmentStatus.REJECTED && rejectionReason && {
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

  logger.info(`Enrollment status updated: ${status}`, {
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
export const updateEnrollmentProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  const updateData: any = {
    progress,
  };

  // Mark as completed if progress is 100%
  if (progress === 100 && enrollment.status !== EnrollmentStatus.COMPLETED) {
    updateData.status = EnrollmentStatus.COMPLETED;
    updateData.completedAt = new Date();
  }

  const updatedEnrollment = await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: updateData,
  });

  logger.info(`Enrollment progress updated: ${progress}%`, {
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
export const getProgramStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

  const [
    totalPrograms,
    activePrograms,
    totalEnrollments,
    activeEnrollments,
    completedEnrollments,
    programsByType,
    enrollmentsByStatus,
  ] = await Promise.all([
    prisma.program.count(),
    prisma.program.count({
      where: { status: ProgramStatus.ACTIVE },
    }),
    prisma.programEnrollment.count(),
    prisma.programEnrollment.count({
      where: { status: EnrollmentStatus.ACTIVE },
    }),
    prisma.programEnrollment.count({
      where: { status: EnrollmentStatus.COMPLETED },
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