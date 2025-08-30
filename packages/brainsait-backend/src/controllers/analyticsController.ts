import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole, VerificationStatus, ProgramStatus, EnrollmentStatus } from '@brainsait/shared';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get platform dashboard analytics (Admin only)
 */
export const getDashboardAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

  try {
    const [
      totalUsers,
      totalSMEs,
      verifiedSMEs,
      totalPrograms,
      activePrograms,
      totalEnrollments,
      activeEnrollments,
      completedEnrollments,
      recentUsers,
      recentSMEs,
      programsByType,
      enrollmentsByStatus,
      usersByRole,
      monthlyGrowth,
    ] = await Promise.all([
      // Basic counts
      prisma.user.count(),
      prisma.smeProfile.count(),
      prisma.smeProfile.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
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

      // Recent activity
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      prisma.smeProfile.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
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

      // Distribution analytics
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
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
      }),

      // Growth analytics (last 6 months)
      getMonthlyGrowthData(),
    ]);

    const analytics = {
      overview: {
        totalUsers,
        totalSMEs,
        verifiedSMEs,
        totalPrograms,
        activePrograms,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        verificationRate: totalSMEs > 0 ? ((verifiedSMEs / totalSMEs) * 100).toFixed(1) : '0',
        completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : '0',
      },
      recentActivity: {
        users: recentUsers,
        smes: recentSMEs,
      },
      distributions: {
        programsByType: programsByType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
        enrollmentsByStatus: enrollmentsByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count.role,
        })),
      },
      growth: monthlyGrowth,
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch analytics data',
      },
    });
  }
});

/**
 * Get SME analytics
 */
export const getSMEAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

  try {
    const [
      smesByType,
      smesByIndustry,
      smesByVerificationStatus,
      smesByFoundedYear,
      smesByEmployeeCount,
    ] = await Promise.all([
      prisma.smeProfile.groupBy({
        by: ['companyType'],
        _count: {
          companyType: true,
        },
      }),
      getSMEsByIndustry(),
      prisma.smeProfile.groupBy({
        by: ['verificationStatus'],
        _count: {
          verificationStatus: true,
        },
      }),
      getSMEsByFoundedYear(),
      getSMEsByEmployeeCount(),
    ]);

    const analytics = {
      distributions: {
        byType: smesByType.map(item => ({
          type: item.companyType,
          count: item._count.companyType,
        })),
        byIndustry: smesByIndustry,
        byVerificationStatus: smesByVerificationStatus.map(item => ({
          status: item.verificationStatus,
          count: item._count.verificationStatus,
        })),
        byFoundedYear: smesByFoundedYear,
        byEmployeeCount: smesByEmployeeCount,
      },
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching SME analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch SME analytics',
      },
    });
  }
});

/**
 * Get program analytics
 */
export const getProgramAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

  try {
    const [
      programStats,
      enrollmentTrends,
      completionRates,
      popularPrograms,
    ] = await Promise.all([
      getProgramStats(),
      getEnrollmentTrends(),
      getCompletionRates(),
      getPopularPrograms(),
    ]);

    const analytics = {
      programStats,
      enrollmentTrends,
      completionRates,
      popularPrograms,
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching program analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch program analytics',
      },
    });
  }
});

/**
 * Export analytics data (Admin only)
 */
export const exportAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin privileges required',
      },
    });
  }

  const { type, format } = req.query;

  if (!type || !['users', 'smes', 'programs', 'enrollments'].includes(type as string)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid export type. Must be one of: users, smes, programs, enrollments',
      },
    });
  }

  if (!format || !['csv', 'json'].includes(format as string)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid format. Must be either csv or json',
      },
    });
  }

  try {
    let data;
    let fileName;

    switch (type) {
      case 'users':
        data = await exportUsersData();
        fileName = `users-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'smes':
        data = await exportSMEsData();
        fileName = `smes-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'programs':
        data = await exportProgramsData();
        fileName = `programs-export-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'enrollments':
        data = await exportEnrollmentsData();
        fileName = `enrollments-export-${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        throw new Error('Invalid export type');
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.json"`);
      res.json(data);
    }

    logger.info(`Analytics data exported: ${type} as ${format}`, {
      adminId: req.user.id,
      exportType: type,
      format,
    });
  } catch (error) {
    logger.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to export analytics data',
      },
    });
  }
});

/**
 * Get user's personal analytics (for SME users)
 */
export const getMyAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
        message: 'SME profile required for analytics',
      },
    });
  }

  try {
    const [
      enrollmentStats,
      progressData,
      programHistory,
    ] = await Promise.all([
      getMyEnrollmentStats(smeProfile.id),
      getMyProgressData(smeProfile.id),
      getMyProgramHistory(smeProfile.id),
    ]);

    const analytics = {
      profile: {
        companyName: smeProfile.companyName,
        companyType: smeProfile.companyType,
        industryFocus: smeProfile.industryFocus,
        verificationStatus: smeProfile.verificationStatus,
        joinedAt: smeProfile.createdAt,
      },
      enrollments: enrollmentStats,
      progress: progressData,
      history: programHistory,
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch personal analytics',
      },
    });
  }
});

// Helper functions

async function getMonthlyGrowthData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const [userCount, smeCount, enrollmentCount] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.smeProfile.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.programEnrollment.count({
        where: {
          enrolledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    monthlyData.push({
      month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      users: userCount,
      smes: smeCount,
      enrollments: enrollmentCount,
    });
  }

  return monthlyData;
}

async function getSMEsByIndustry() {
  const smes = await prisma.smeProfile.findMany({
    select: { industryFocus: true },
  });

  const industryMap = new Map<string, number>();
  smes.forEach(sme => {
    sme.industryFocus.forEach(industry => {
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
    });
  });

  return Array.from(industryMap.entries()).map(([industry, count]) => ({
    industry,
    count,
  }));
}

async function getSMEsByFoundedYear() {
  const smes = await prisma.smeProfile.findMany({
    where: { foundedYear: { not: null } },
    select: { foundedYear: true },
  });

  const yearMap = new Map<string, number>();
  smes.forEach(sme => {
    if (sme.foundedYear) {
      const decade = `${Math.floor(sme.foundedYear / 10) * 10}s`;
      yearMap.set(decade, (yearMap.get(decade) || 0) + 1);
    }
  });

  return Array.from(yearMap.entries()).map(([decade, count]) => ({
    decade,
    count,
  }));
}

async function getSMEsByEmployeeCount() {
  const smes = await prisma.smeProfile.findMany({
    where: { employeeCount: { not: null } },
    select: { employeeCount: true },
  });

  const sizeMap = new Map<string, number>();
  smes.forEach(sme => {
    if (sme.employeeCount !== null) {
      let sizeCategory;
      if (sme.employeeCount <= 10) sizeCategory = '1-10';
      else if (sme.employeeCount <= 50) sizeCategory = '11-50';
      else if (sme.employeeCount <= 200) sizeCategory = '51-200';
      else sizeCategory = '200+';
      
      sizeMap.set(sizeCategory, (sizeMap.get(sizeCategory) || 0) + 1);
    }
  });

  return Array.from(sizeMap.entries()).map(([size, count]) => ({
    size,
    count,
  }));
}

async function getProgramStats() {
  const programs = await prisma.program.findMany({
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  return programs.map(program => ({
    id: program.id,
    title: program.title,
    type: program.type,
    status: program.status,
    totalEnrollments: program._count.enrollments,
    capacity: program.maxParticipants,
    utilization: ((program._count.enrollments / program.maxParticipants) * 100).toFixed(1),
  }));
}

async function getEnrollmentTrends() {
  // Implementation would include time-based enrollment data
  return [];
}

async function getCompletionRates() {
  const programs = await prisma.program.findMany({
    include: {
      enrollments: {
        select: {
          status: true,
        },
      },
    },
  });

  return programs.map(program => {
    const total = program.enrollments.length;
    const completed = program.enrollments.filter(e => e.status === 'COMPLETED').length;
    return {
      programId: program.id,
      title: program.title,
      totalEnrollments: total,
      completedEnrollments: completed,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
    };
  });
}

async function getPopularPrograms() {
  return prisma.program.findMany({
    take: 10,
    orderBy: {
      currentParticipants: 'desc',
    },
    select: {
      id: true,
      title: true,
      type: true,
      currentParticipants: true,
      maxParticipants: true,
    },
  });
}

async function exportUsersData() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

async function exportSMEsData() {
  return prisma.smeProfile.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

async function exportProgramsData() {
  return prisma.program.findMany({
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
}

async function exportEnrollmentsData() {
  return prisma.programEnrollment.findMany({
    include: {
      sme: {
        select: {
          companyName: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      program: {
        select: {
          title: true,
          type: true,
        },
      },
    },
  });
}

async function getMyEnrollmentStats(smeId: string) {
  const enrollments = await prisma.programEnrollment.findMany({
    where: { smeId },
    include: {
      program: {
        select: {
          type: true,
        },
      },
    },
  });

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'ACTIVE').length,
    completed: enrollments.filter(e => e.status === 'COMPLETED').length,
    pending: enrollments.filter(e => e.status === 'PENDING').length,
  };

  return stats;
}

async function getMyProgressData(smeId: string) {
  return prisma.programEnrollment.findMany({
    where: { smeId },
    select: {
      progress: true,
      status: true,
      enrolledAt: true,
      completedAt: true,
      program: {
        select: {
          title: true,
          type: true,
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });
}

async function getMyProgramHistory(smeId: string) {
  return prisma.programEnrollment.findMany({
    where: { smeId },
    include: {
      program: {
        select: {
          title: true,
          type: true,
          duration: true,
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });
}

function convertToCSV(data: any[]): string {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      // Escape quotes and wrap in quotes if contains comma
      return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}