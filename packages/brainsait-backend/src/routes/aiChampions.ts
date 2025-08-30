import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiter for mentorship application (e.g., 5 requests/hour per IP)
const mentorshipApplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 requests per windowMs
  message: { error: 'Too many mentorship applications from this IP, please try again later.' }
});
// AI Champion Registration Schema
const AIChampionRegistrationSchema = z.object({
  level: z.enum(['JUNIOR', 'SENIOR', 'LEAD']),
  specializations: z.array(z.enum([
    'DIAGNOSTIC_ASSISTANCE',
    'TREATMENT_PLANNING',
    'DRUG_DISCOVERY',
    'MEDICAL_IMAGING',
    'CLINICAL_DECISION_SUPPORT',
    'PATIENT_MONITORING',
    'PREDICTIVE_ANALYTICS',
    'NATURAL_LANGUAGE_PROCESSING',
    'ROBOTIC_SURGERY',
    'TELEMEDICINE',
    'HEALTH_RECORDS_MANAGEMENT',
    'RESEARCH_AUTOMATION',
    'QUALITY_ASSURANCE',
    'WORKFLOW_OPTIMIZATION'
  ])),
  mentorshipCapacity: z.number().min(0).max(20),
  availableHoursPerWeek: z.number().min(0).max(40),
  preferredMenteeLevel: z.array(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])),
  languagesOffered: z.array(z.enum(['EN', 'AR', 'FR', 'ES', 'DE', 'JA', 'ZH'])),
  timeZone: z.string(),
  bio: z.string().min(50).max(1000),
  achievements: z.array(z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    verificationUrl: z.string().optional()
  })).optional(),
  socialLinks: z.object({
    linkedIn: z.string().url().optional(),
    twitter: z.string().url().optional(),
    researchGate: z.string().url().optional(),
    personalWebsite: z.string().url().optional()
  }).optional()
});

const MentorshipApplicationSchema = z.object({
  championId: z.string(),
  goals: z.array(z.string()),
  currentLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  timeCommitment: z.enum(['LOW', 'MEDIUM', 'HIGH']), // 1-3, 3-6, 6+ hours per week
  preferredLanguage: z.enum(['EN', 'AR', 'FR', 'ES', 'DE', 'JA', 'ZH']),
  previousExperience: z.string().max(500),
  specificInterests: z.array(z.string()),
  expectedDuration: z.enum(['1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR'])
});

const SessionFeedbackSchema = z.object({
  sessionId: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().max(1000),
  topics_covered: z.array(z.string()),
  homework_completed: z.boolean(),
  next_session_goals: z.array(z.string()).optional()
});

// Register as AI Champion
router.post('/register', authenticate, validateRequest(AIChampionRegistrationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const championData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has healthcare SME profile
    const sme = await prisma.healthcareSME.findUnique({
      where: { userId }
    });

    if (!sme) {
      return res.status(400).json({ error: 'Healthcare SME profile required to become AI Champion' });
    }

    // Check if already registered as champion
    const existingChampion = await prisma.aiChampion.findUnique({
      where: { healthcareSMEId: sme.id }
    });

    if (existingChampion) {
      return res.status(400).json({ error: 'Already registered as AI Champion' });
    }

    // Validate minimum requirements
    if (sme.aiExperienceLevel === 'BEGINNER' && championData.level !== 'JUNIOR') {
      return res.status(400).json({ error: 'Beginners can only register as Junior champions' });
    }

    const champion = await prisma.aiChampion.create({
      data: {
        healthcareSMEId: sme.id,
        userId,
        ...championData,
        status: 'PENDING_REVIEW',
        applicationDate: new Date()
      }
    });

    // Create initial champion metrics
    await prisma.championMetrics.create({
      data: {
        championId: champion.id,
        menteesHelped: 0,
        sessionsCompleted: 0,
        averageRating: 0,
        totalHoursContributed: 0
      }
    });

    res.status(201).json({
      message: 'AI Champion application submitted successfully',
      championId: champion.id,
      status: champion.status
    });

  } catch (error) {
    console.error('Error registering AI Champion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available AI Champions
router.get('/available', async (req: Request, res: Response) => {
  try {
    const { specialization, language, level, page = 1, limit = 10 } = req.query;

    const where: any = {
      status: 'ACTIVE',
      availableMenteeSlots: { gt: 0 }
    };

    if (specialization) {
      where.specializations = { has: specialization };
    }

    if (language) {
      where.languagesOffered = { has: language };
    }

    if (level) {
      where.preferredMenteeLevel = { has: level };
    }

    const champions = await prisma.aiChampion.findMany({
      where,
      include: {
        healthcareSME: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePicture: true
              }
            }
          }
        },
        metrics: true,
        reviews: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: [
        { metrics: { averageRating: 'desc' } },
        { metrics: { sessionsCompleted: 'desc' } }
      ]
    });

    const total = await prisma.aiChampion.count({ where });

    res.json({
      champions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching available AI Champions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply for mentorship
router.post('/mentorship/apply', mentorshipApplyLimiter, authenticate, validateRequest(MentorshipApplicationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has healthcare SME profile
    const sme = await prisma.healthcareSME.findUnique({
      where: { userId }
    });

    if (!sme) {
      return res.status(400).json({ error: 'Healthcare SME profile required' });
    }

    // Check if champion exists and is available
    const champion = await prisma.aiChampion.findUnique({
      where: { id: applicationData.championId },
      include: { metrics: true }
    });

    if (!champion || champion.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Champion not available' });
    }

    if (champion.availableMenteeSlots <= 0) {
      return res.status(400).json({ error: 'Champion has no available mentee slots' });
    }

    // Check for existing application
    const existingApplication = await prisma.mentorshipApplication.findFirst({
      where: {
        menteeId: sme.id,
        championId: applicationData.championId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Application already exists or active mentorship in progress' });
    }

    const application = await prisma.mentorshipApplication.create({
      data: {
        menteeId: sme.id,
        championId: applicationData.championId,
        goals: applicationData.goals,
        currentLevel: applicationData.currentLevel,
        timeCommitment: applicationData.timeCommitment,
        preferredLanguage: applicationData.preferredLanguage,
        previousExperience: applicationData.previousExperience,
        specificInterests: applicationData.specificInterests,
        expectedDuration: applicationData.expectedDuration,
        status: 'PENDING',
        appliedAt: new Date()
      }
    });

    // Notify champion
    await sendMentorshipApplicationNotification(champion, application);

    res.status(201).json({
      message: 'Mentorship application submitted successfully',
      applicationId: application.id
    });

  } catch (error) {
    console.error('Error applying for mentorship:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Champion: Review mentorship applications
router.get('/mentorship/applications', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const champion = await prisma.aiChampion.findUnique({
      where: { userId }
    });

    if (!champion) {
      return res.status(403).json({ error: 'AI Champion profile required' });
    }

    const applications = await prisma.mentorshipApplication.findMany({
      where: {
        championId: champion.id,
        status: 'PENDING'
      },
      include: {
        mentee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true
              }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.json(applications);

  } catch (error) {
    console.error('Error fetching mentorship applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Champion: Accept/Reject mentorship application
router.put('/mentorship/applications/:applicationId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status, message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await prisma.mentorshipApplication.findUnique({
      where: { id: applicationId },
      include: {
        champion: true,
        mentee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.champion.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ error: 'Application already processed' });
    }

    const updatedApplication = await prisma.mentorshipApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewMessage: message
      }
    });

    if (status === 'ACCEPTED') {
      // Create mentorship relationship
      const mentorship = await prisma.mentorship.create({
        data: {
          championId: application.championId,
          menteeId: application.menteeId,
          startDate: new Date(),
          expectedEndDate: calculateEndDate(application.expectedDuration),
          goals: application.goals,
          status: 'ACTIVE'
        }
      });

      // Update champion's available slots
      await prisma.aiChampion.update({
        where: { id: application.championId },
        data: {
          availableMenteeSlots: { decrement: 1 }
        }
      });

      // Schedule first session
      await scheduleFirstSession(mentorship);
    }

    // Send notification to mentee
    await sendApplicationStatusNotification(application.mentee.user, status, message);

    res.json({
      message: `Application ${status.toLowerCase()} successfully`,
      application: updatedApplication
    });

  } catch (error) {
    console.error('Error updating mentorship application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get champion dashboard
router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const champion = await prisma.aiChampion.findUnique({
      where: { userId },
      include: {
        metrics: true,
        activeMentorships: {
          include: {
            mentee: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profilePicture: true
                  }
                }
              }
            },
            sessions: {
              take: 5,
              orderBy: { scheduledAt: 'desc' }
            }
          }
        },
        pendingApplications: {
          take: 5,
          orderBy: { appliedAt: 'desc' },
          include: {
            mentee: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!champion) {
      return res.status(404).json({ error: 'AI Champion profile not found' });
    }

    // Get recent activity
    const recentSessions = await prisma.mentorshipSession.findMany({
      where: {
        mentorship: {
          championId: champion.id
        }
      },
      take: 10,
      orderBy: { scheduledAt: 'desc' },
      include: {
        mentorship: {
          include: {
            mentee: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({
      champion,
      recentSessions,
      stats: {
        totalMentorships: champion.metrics?.menteesHelped || 0,
        activeMentorships: champion.activeMentorships.length,
        pendingApplications: champion.pendingApplications.length,
        averageRating: champion.metrics?.averageRating || 0,
        totalHours: champion.metrics?.totalHoursContributed || 0
      }
    });

  } catch (error) {
    console.error('Error fetching champion dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function sendMentorshipApplicationNotification(champion: any, application: any) {
  // Implementation would send email/notification to champion
  console.log(`Mentorship application notification sent to champion ${champion.id}`);
}

async function sendApplicationStatusNotification(user: any, status: string, message?: string) {
  // Implementation would send email/notification to user
  console.log(`Application status notification sent to user ${user.id}: ${status}`);
}

function calculateEndDate(duration: string): Date {
  const now = new Date();
  switch (duration) {
    case '1_MONTH':
      return new Date(now.setMonth(now.getMonth() + 1));
    case '3_MONTHS':
      return new Date(now.setMonth(now.getMonth() + 3));
    case '6_MONTHS':
      return new Date(now.setMonth(now.getMonth() + 6));
    case '1_YEAR':
      return new Date(now.setFullYear(now.getFullYear() + 1));
    default:
      return new Date(now.setMonth(now.getMonth() + 3));
  }
}

async function scheduleFirstSession(mentorship: any) {
  // Implementation would schedule first mentorship session
  console.log(`First session scheduled for mentorship ${mentorship.id}`);
}

export default router;