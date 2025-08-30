import { PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

// AI Champion Application Schema
const AIChampionApplicationSchema = z.object({
  currentRole: z.string().min(2).max(200),
  yearsInHealthcare: z.number().min(0).max(60),
  aiExperience: z.object({
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    yearsWithAI: z.number().min(0).max(30),
    projectsCompleted: z.number().min(0),
    toolsUsed: z.array(z.string()),
    certifications: z.array(z.string()).optional()
  }),
  mentorshipExperience: z.object({
    hasMentoredBefore: z.boolean(),
    menteeCount: z.number().min(0).default(0),
    preferredMenteeLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'MIXED']),
    availableHoursPerWeek: z.number().min(1).max(40),
    timeZonePreference: z.string()
  }),
  specializations: z.array(z.enum([
    'DIAGNOSTIC_AI',
    'MEDICAL_IMAGING',
    'NATURAL_LANGUAGE_PROCESSING',
    'PREDICTIVE_ANALYTICS',
    'CLINICAL_DECISION_SUPPORT',
    'DRUG_DISCOVERY',
    'ROBOTIC_SURGERY',
    'TELEMEDICINE',
    'HEALTH_INFORMATICS',
    'AI_ETHICS',
    'IMPLEMENTATION_STRATEGY',
    'CHANGE_MANAGEMENT'
  ])),
  motivation: z.string().min(100).max(1000),
  contribution: z.object({
    caseStudies: z.boolean().default(false),
    research: z.boolean().default(false),
    training: z.boolean().default(false),
    consulting: z.boolean().default(false),
    speaking: z.boolean().default(false)
  }),
  references: z.array(z.object({
    name: z.string(),
    position: z.string(),
    institution: z.string(),
    email: z.string().email(),
    relationship: z.string()
  })).min(2).max(5)
});

// Mentorship Session Schema
const MentorshipSessionSchema = z.object({
  menteeId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  duration: z.number().min(30).max(180), // minutes
  topic: z.string().min(5).max(200),
  objectives: z.array(z.string()),
  format: z.enum(['VIDEO_CALL', 'CHAT', 'EMAIL', 'IN_PERSON']),
  preparationMaterials: z.array(z.string()).optional()
});

// Session Feedback Schema
const SessionFeedbackSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  feedback: z.string().min(10).max(1000),
  objectives_met: z.boolean(),
  follow_up_needed: z.boolean(),
  next_session_topics: z.array(z.string()).optional(),
  mentor_notes: z.string().max(500).optional()
});

// Apply to become AI Champion
router.post('/apply', authenticate, validateRequest(AIChampionApplicationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const applicationData = req.body as z.infer<typeof AIChampionApplicationSchema>;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has Healthcare SME profile
    const sme = await prisma.healthcareSME.findUnique({
      where: { userId }
    });

    if (!sme) {
      return res.status(400).json({ error: 'Healthcare SME profile required' });
    }

    if (sme.status !== 'ACTIVE' && sme.status !== 'VERIFIED') {
      return res.status(400).json({ error: 'Healthcare SME profile must be verified' });
    }

    // Check if already applied or is champion
    const existingApplication = await prisma.aIChampionApplication.findFirst({
      where: { userId }
    });

    const existingChampion = await prisma.aIChampion.findUnique({
      where: { userId }
    });

    if (existingApplication || existingChampion) {
      return res.status(400).json({ error: 'Application already exists or user is already an AI Champion' });
    }

    // Create application
    const application = await prisma.aIChampionApplication.create({
      data: {
        userId,
        championId: sme.id, // Link to the champion, not healthcare SME
        applicationData: applicationData,
        status: 'PENDING',
        submittedAt: new Date()
      }
    });

    // Notify admins about new application
    await notifyAdminsNewApplication(application);

    res.status(201).json({
      message: 'AI Champion application submitted successfully',
      applicationId: application.id,
      status: application.status
    });

  } catch (error) {
    console.error('Error submitting AI Champion application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user's AI Champion status
router.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const champion = await prisma.aIChampion.findUnique({
      where: { userId },
      include: {
        healthcareSME: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        mentorships: {
          include: {
            mentee: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            sessions: {
              orderBy: { scheduledAt: 'desc' },
              take: 5
            }
          }
        }
      }
    });

    if (!champion) {
      // Check for pending application
      const application = await prisma.aIChampionApplication.findFirst({
        where: { userId }
      });

      return res.json({
        isChampion: false,
        application: application ? {
          status: application.status,
          submittedAt: application.submittedAt,
          reviewedAt: application.reviewedAt
        } : null
      });
    }

    res.json({
      isChampion: true,
      champion,
      stats: await getChampionStats(champion.id)
    });

  } catch (error) {
    console.error('Error fetching AI Champion status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule mentorship session
router.post('/sessions/schedule', authenticate, validateRequest(MentorshipSessionSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessionData = req.body as z.infer<typeof MentorshipSessionSchema>;
    const userId = req.user?.id;

    // Verify user is an AI Champion
    const champion = await prisma.aIChampion.findUnique({
      where: { userId },
      include: { mentorships: true }
    });

    if (!champion) {
      return res.status(403).json({ error: 'AI Champion status required' });
    }

    // Verify mentee relationship
    const mentorship = champion.mentorships.find(m => m.menteeId === sessionData.menteeId);
    if (!mentorship) {
      return res.status(403).json({ error: 'Mentorship relationship not found' });
    }

    // Check for scheduling conflicts
    const conflict = await prisma.mentorSession.findFirst({
      where: {
        mentorId: champion.id,
        scheduledAt: {
          gte: new Date(sessionData.scheduledAt.getTime() - 30 * 60 * 1000), // 30 min before
          lte: new Date(sessionData.scheduledAt.getTime() + 30 * 60 * 1000)  // 30 min after
        },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      }
    });

    if (conflict) {
      return res.status(400).json({ error: 'Scheduling conflict detected' });
    }

    // Create session
    const session = await prisma.mentorSession.create({
      data: {
        mentorshipId: mentorship.id,
        mentorId: champion.id,
        menteeId: sessionData.menteeId,
        scheduledAt: sessionData.scheduledAt,
        duration: sessionData.duration,
        topic: sessionData.topic,
        objectivesMet: false, // Will be updated after session completion
        status: 'SCHEDULED'
      }
    });

    // Send notifications
    await sendSessionNotifications(session);

    res.status(201).json({
      message: 'Mentorship session scheduled successfully',
      session
    });

  } catch (error) {
    console.error('Error scheduling session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit session feedback
router.post('/sessions/:sessionId/feedback', authenticate, validateRequest(SessionFeedbackSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const feedbackData = req.body as z.infer<typeof SessionFeedbackSchema>;
    const userId = req.user?.id;

    // Verify session exists and user is the mentor
    const session = await prisma.mentorSession.findFirst({
      where: {
        id: sessionId,
        mentorship: {
          championId: userId
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or unauthorized' });
    }

    if (session.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Session must be completed to submit feedback' });
    }

    // Update session with feedback
    const updatedSession = await prisma.mentorSession.update({
      where: { id: sessionId },
      data: {
        mentorRating: feedbackData.rating,
        mentorFeedback: feedbackData.feedback,
        objectivesMet: feedbackData.objectives_met
      }
    });

    // Update champion statistics
    if (session.mentorId) {
      await updateChampionStats(session.mentorId);
    }

    res.json({
      message: 'Feedback submitted successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get champion leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { timeframe = 'month', limit = 10 } = req.query;

    let dateFilter: Date;
    switch (timeframe) {
      case 'week':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const champions = await prisma.aIChampion.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        healthcareSME: {
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
        mentorships: {
          where: {
            createdAt: { gte: dateFilter }
          },
          include: {
            sessions: {
              where: {
                scheduledAt: { gte: dateFilter },
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      take: Number(limit)
    });

    const leaderboard = champions.map(champion => ({
      id: champion.id,
      name: champion.healthcareSME ? `${champion.healthcareSME.user.firstName} ${champion.healthcareSME.user.lastName}` : 'Unknown',
      profilePicture: champion.healthcareSME?.user.profilePicture || null,
      level: champion.level,
      specializations: champion.specializations,
      stats: {
        sessionsCompleted: champion.mentorships.reduce((total, mentorship) => total + mentorship.sessions.length, 0),
        menteesActive: champion.mentorships.length,
        averageRating: champion.averageRating,
        totalHours: champion.mentorships.reduce((total, mentorship) => 
          total + mentorship.sessions.reduce((sum: number, session: any) => sum + session.duration, 0), 0) / 60
      }
    })).sort((a, b) => {
      // Sort by weighted score: sessions * 2 + mentees * 3 + rating * 10
      const scoreA = a.stats.sessionsCompleted * 2 + a.stats.menteesActive * 3 + (a.stats.averageRating || 0) * 10;
      const scoreB = b.stats.sessionsCompleted * 2 + b.stats.menteesActive * 3 + (b.stats.averageRating || 0) * 10;
      return scoreB - scoreA;
    });

    res.json(leaderboard);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Find mentors for specific needs
router.get('/find-mentors', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { specialization, level, availability } = req.query;

    const filters: any = {
      status: 'ACTIVE',
      mentorshipCapacity: { gt: 0 }
    };

    if (specialization) {
      filters.specializations = {
        has: specialization
      };
    }

    if (level) {
      filters.level = level;
    }

    const mentors = await prisma.aIChampion.findMany({
      where: filters,
      include: {
        healthcareSME: {
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
        mentorships: {
          where: { status: 'ACTIVE' }
        }
      },
      take: 20
    });

    const availableMentors = mentors.filter(mentor => 
      mentor.mentorshipCapacity && mentor.mentorships.length < mentor.mentorshipCapacity
    ).map(mentor => ({
      id: mentor.id,
      name: mentor.healthcareSME ? `${mentor.healthcareSME.user.firstName} ${mentor.healthcareSME.user.lastName}` : 'Unknown',
      profilePicture: mentor.healthcareSME?.user.profilePicture || null,
      specialization: mentor.healthcareSME?.specialization || null,
      aiSpecializations: mentor.specializations,
      level: mentor.level,
      rating: mentor.averageRating,
      availableSlots: (mentor.mentorshipCapacity || 0) - mentor.mentorships.length,
      totalMentees: mentor.totalMentees,
      totalSessions: mentor.totalSessions
    }));

    res.json(availableMentors);

  } catch (error) {
    console.error('Error finding mentors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
async function notifyAdminsNewApplication(application: any) {
  // Implementation would send notifications to admins
  console.log(`New AI Champion application from user ${application.userId}`);
}

async function getChampionStats(championId: string) {
  const sessions = await prisma.mentorSession.count({
    where: { mentorId: championId, status: 'COMPLETED' }
  });

  const mentees = await prisma.mentorship.count({
    where: { mentorId: championId, status: 'ACTIVE' }
  });

  const averageRating = await prisma.mentorSession.aggregate({
    where: { mentorId: championId, mentorRating: { not: null } },
    _avg: { mentorRating: true }
  });

  return {
    totalSessions: sessions,
    activeMentees: mentees,
    averageRating: averageRating._avg.mentorRating || 0,
    thisMonth: {
      sessions: await prisma.mentorSession.count({
        where: {
          mentorId: championId,
          status: 'COMPLETED',
          scheduledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    }
  };
}

async function sendSessionNotifications(session: any) {
  // Implementation would send email/SMS notifications
  console.log(`Session scheduled: ${session.id}`);
}

async function updateChampionStats(championId: string) {
  const stats = await getChampionStats(championId);
  
  await prisma.aIChampion.update({
    where: { id: championId },
    data: {
      totalSessions: stats.totalSessions,
      averageRating: stats.averageRating
    }
  });
}

export default router;