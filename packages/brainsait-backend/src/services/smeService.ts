import { PrismaClient, SMEType, IndustryFocus, VerificationStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateSMEProfileData {
  userId: string;
  companyName: string;
  companyType: SMEType;
  industryFocus: IndustryFocus[];
  description?: string;
  website?: string;
  foundedYear?: number;
  employeeCount?: number;
  annualRevenue?: string;
  address?: any;
}

export interface UpdateSMEProfileData {
  companyName?: string;
  companyType?: SMEType;
  industryFocus?: IndustryFocus[];
  description?: string;
  website?: string;
  foundedYear?: number;
  employeeCount?: number;
  annualRevenue?: string;
  address?: any;
}

export interface SMEFilterOptions {
  page?: number;
  limit?: number;
  companyType?: SMEType;
  industryFocus?: IndustryFocus;
  verificationStatus?: VerificationStatus;
  search?: string;
}

/**
 * SME Service
 * Handles all SME-related business logic
 */
export class SMEService {
  /**
   * Get SMEs with filtering and pagination
   */
  static async getSMEs(options: SMEFilterOptions = {}) {
    const {
      page = 1,
      limit = 20,
      companyType,
      industryFocus,
      verificationStatus,
      search,
    } = options;

    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const where: any = {};

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
        take: safeLimit,
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

    const totalPages = Math.ceil(total / safeLimit);

    return {
      smes,
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get SME by ID with full details
   */
  static async getSMEById(id: string) {
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
      },
    });

    if (!sme) {
      throw new Error('SME not found');
    }

    return sme;
  }

  /**
   * Create new SME profile
   */
  static async createSMEProfile(data: CreateSMEProfileData) {
    // Check if user already has an SME profile
    const existingProfile = await prisma.sMEProfile.findUnique({
      where: { userId: data.userId },
    });

    if (existingProfile) {
      throw new Error('SME profile already exists for this user');
    }

    const smeProfile = await prisma.sMEProfile.create({
      data: {
        ...data,
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

    logger.info(`SME profile created: ${smeProfile.companyName}`, {
      userId: data.userId,
      smeId: smeProfile.id,
    });

    return smeProfile;
  }

  /**
   * Update SME profile
   */
  static async updateSMEProfile(id: string, data: UpdateSMEProfileData, userId?: string) {
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
      throw new Error('SME profile not found');
    }

    // Check if critical information changed (affects verification status)
    const criticalFieldsChanged = 
      (data.companyName && data.companyName !== existingProfile.companyName) ||
      (data.companyType && data.companyType !== existingProfile.companyType) ||
      (data.industryFocus && JSON.stringify(data.industryFocus) !== JSON.stringify(existingProfile.industryFocus));

    const updateData: any = { ...data };

    // Reset verification status if critical info changed and was previously verified
    if (criticalFieldsChanged && existingProfile.verificationStatus === VerificationStatus.VERIFIED) {
      updateData.verificationStatus = VerificationStatus.PENDING;
    }

    const updatedProfile = await prisma.sMEProfile.update({
      where: { id },
      data: updateData,
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
      userId: userId || updatedProfile.userId,
      smeId: updatedProfile.id,
      criticalFieldsChanged,
    });

    return updatedProfile;
  }

  /**
   * Delete SME profile
   */
  static async deleteSMEProfile(id: string) {
    const existingProfile = await prisma.sMEProfile.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        userId: true,
      },
    });

    if (!existingProfile) {
      throw new Error('SME profile not found');
    }

    await prisma.sMEProfile.delete({
      where: { id },
    });

    logger.info(`SME profile deleted: ${existingProfile.companyName}`, {
      smeId: id,
      userId: existingProfile.userId,
    });

    return { success: true };
  }

  /**
   * Get SME profile by user ID
   */
  static async getSMEProfileByUserId(userId: string) {
    const smeProfile = await prisma.sMEProfile.findUnique({
      where: { userId },
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
      throw new Error('SME profile not found for this user');
    }

    return smeProfile;
  }

  /**
   * Update SME verification status (Admin function)
   */
  static async updateVerificationStatus(
    id: string,
    verificationStatus: VerificationStatus,
    rejectionReason?: string
  ) {
    const smeProfile = await prisma.sMEProfile.findUnique({
      where: { id },
    });

    if (!smeProfile) {
      throw new Error('SME profile not found');
    }

    const updateData: any = {
      verificationStatus,
    };

    if (verificationStatus === VerificationStatus.REJECTED && rejectionReason) {
      updateData.documents = {
        ...(typeof smeProfile.documents === 'object' ? smeProfile.documents : {}),
        rejectionReason,
      };
    }

    const updatedProfile = await prisma.sMEProfile.update({
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

    logger.info(`SME verification status updated: ${updatedProfile.companyName}`, {
      smeId: id,
      status: verificationStatus,
      rejectionReason,
    });

    return updatedProfile;
  }

  /**
   * Upload documents for SME
   */
  static async uploadDocuments(id: string, documents: any) {
    const smeProfile = await prisma.sMEProfile.findUnique({
      where: { id },
    });

    if (!smeProfile) {
      throw new Error('SME profile not found');
    }

    const updatedProfile = await prisma.sMEProfile.update({
      where: { id },
      data: {
        documents,
        // Reset to pending when new documents are uploaded
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    logger.info(`SME documents uploaded: ${smeProfile.companyName}`, {
      smeId: id,
    });

    return updatedProfile;
  }

  /**
   * Get SME statistics
   */
  static async getSMEStatistics() {
    const [
      totalSMEs,
      verifiedSMEs,
      pendingSMEs,
      rejectedSMEs,
      inReviewSMEs,
      smesByType,
      smesByIndustry,
      recentSMEs,
    ] = await Promise.all([
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
      prisma.sMEProfile.count({
        where: { verificationStatus: VerificationStatus.IN_REVIEW },
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
      prisma.sMEProfile.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          companyName: true,
          companyType: true,
          verificationStatus: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    // Process industry focus data
    const industryMap = new Map<string, number>();
    smesByIndustry.forEach(sme => {
      sme.industryFocus.forEach(industry => {
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
      });
    });

    const industryStats = Array.from(industryMap.entries()).map(([industry, count]) => ({
      industry,
      count,
    }));

    return {
      overview: {
        total: totalSMEs,
        verified: verifiedSMEs,
        pending: pendingSMEs,
        inReview: inReviewSMEs,
        rejected: rejectedSMEs,
      },
      byCompanyType: smesByType.map(item => ({
        type: item.companyType,
        count: item._count.companyType,
      })),
      byIndustry: industryStats,
      recentSMEs,
    };
  }

  /**
   * Search SMEs by company name or description
   */
  static async searchSMEs(query: string, limit: number = 10) {
    const smes = await prisma.sMEProfile.findMany({
      where: {
        OR: [
          {
            companyName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: Math.min(limit, 50),
      select: {
        id: true,
        companyName: true,
        companyType: true,
        industryFocus: true,
        description: true,
        verificationStatus: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        verificationStatus: 'asc', // Verified first
      },
    });

    return smes;
  }

  /**
   * Get SMEs by industry focus
   */
  static async getSMEsByIndustry(industryFocus: IndustryFocus) {
    const smes = await prisma.sMEProfile.findMany({
      where: {
        industryFocus: {
          has: industryFocus,
        },
        verificationStatus: VerificationStatus.VERIFIED,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            programEnrollments: true,
            mentorships: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return smes;
  }

  /**
   * Get SME enrollment history
   */
  static async getSMEEnrollmentHistory(smeId: string) {
    const enrollments = await prisma.programEnrollment.findMany({
      where: { smeId },
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
    });

    return enrollments;
  }

  /**
   * Get SME mentorship history
   */
  static async getSMEMentorshipHistory(smeId: string) {
    const mentorships = await prisma.mentorship.findMany({
      where: { smeId },
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
        sessions: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            rating: true,
          },
          orderBy: {
            scheduledAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return mentorships;
  }
}