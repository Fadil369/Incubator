"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// AI Champion Application Schema
const AIChampionApplicationSchema = zod_1.z.object({
    currentRole: zod_1.z.string().min(2).max(200),
    yearsInHealthcare: zod_1.z.number().min(0).max(60),
    aiExperience: zod_1.z.object({
        level: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
        yearsWithAI: zod_1.z.number().min(0).max(30),
        projectsCompleted: zod_1.z.number().min(0),
        toolsUsed: zod_1.z.array(zod_1.z.string()),
        certifications: zod_1.z.array(zod_1.z.string()).optional()
    }),
    mentorshipExperience: zod_1.z.object({
        hasMentoredBefore: zod_1.z.boolean(),
        menteeCount: zod_1.z.number().min(0).default(0),
        preferredMenteeLevel: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'MIXED']),
        availableHoursPerWeek: zod_1.z.number().min(1).max(40),
        timeZonePreference: zod_1.z.string()
    }),
    specializations: zod_1.z.array(zod_1.z.enum([
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
    motivation: zod_1.z.string().min(100).max(1000),
    contribution: zod_1.z.object({
        caseStudies: zod_1.z.boolean().default(false),
        research: zod_1.z.boolean().default(false),
        training: zod_1.z.boolean().default(false),
        consulting: zod_1.z.boolean().default(false),
        speaking: zod_1.z.boolean().default(false)
    }),
    references: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        position: zod_1.z.string(),
        institution: zod_1.z.string(),
        email: zod_1.z.string().email(),
        relationship: zod_1.z.string()
    })).min(2).max(5)
});
// Mentorship Session Schema
const MentorshipSessionSchema = zod_1.z.object({
    menteeId: zod_1.z.string().uuid(),
    scheduledAt: zod_1.z.coerce.date(),
    duration: zod_1.z.number().min(30).max(180), // minutes
    topic: zod_1.z.string().min(5).max(200),
    objectives: zod_1.z.array(zod_1.z.string()),
    format: zod_1.z.enum(['VIDEO_CALL', 'CHAT', 'EMAIL', 'IN_PERSON']),
    preparationMaterials: zod_1.z.array(zod_1.z.string()).optional()
});
// Session Feedback Schema
const SessionFeedbackSchema = zod_1.z.object({
    sessionId: zod_1.z.string().uuid(),
    rating: zod_1.z.number().min(1).max(5),
    feedback: zod_1.z.string().min(10).max(1000),
    objectives_met: zod_1.z.boolean(),
    follow_up_needed: zod_1.z.boolean(),
    next_session_topics: zod_1.z.array(zod_1.z.string()).optional(),
    mentor_notes: zod_1.z.string().max(500).optional()
});
// Apply to become AI Champion
router.post('/apply', auth_1.authenticate, (0, validation_1.validateRequest)(AIChampionApplicationSchema), async (req, res) => {
    try {
        const applicationData = req.body;
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
        const existingApplication = await prisma.aiChampionApplication.findUnique({
            where: { userId }
        });
        const existingChampion = await prisma.aiChampion.findUnique({
            where: { userId }
        });
        if (existingApplication || existingChampion) {
            return res.status(400).json({ error: 'Application already exists or user is already an AI Champion' });
        }
        // Create application
        const application = await prisma.aiChampionApplication.create({
            data: {
                userId,
                healthcareSMEId: sme.id,
                ...applicationData,
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
    }
    catch (error) {
        console.error('Error submitting AI Champion application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get current user's AI Champion status
router.get('/status', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        const champion = await prisma.aiChampion.findUnique({
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
                        }
                    }
                },
                sessions: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!champion) {
            // Check for pending application
            const application = await prisma.aiChampionApplication.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching AI Champion status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Schedule mentorship session
router.post('/sessions/schedule', auth_1.authenticate, (0, validation_1.validateRequest)(MentorshipSessionSchema), async (req, res) => {
    try {
        const sessionData = req.body;
        const userId = req.user?.id;
        // Verify user is an AI Champion
        const champion = await prisma.aiChampion.findUnique({
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
        const conflict = await prisma.mentorshipSession.findFirst({
            where: {
                mentorId: champion.id,
                scheduledAt: {
                    gte: new Date(sessionData.scheduledAt.getTime() - 30 * 60 * 1000), // 30 min before
                    lte: new Date(sessionData.scheduledAt.getTime() + 30 * 60 * 1000) // 30 min after
                },
                status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
            }
        });
        if (conflict) {
            return res.status(400).json({ error: 'Scheduling conflict detected' });
        }
        // Create session
        const session = await prisma.mentorshipSession.create({
            data: {
                mentorId: champion.id,
                menteeId: sessionData.menteeId,
                scheduledAt: sessionData.scheduledAt,
                duration: sessionData.duration,
                topic: sessionData.topic,
                objectives: sessionData.objectives,
                format: sessionData.format,
                preparationMaterials: sessionData.preparationMaterials || [],
                status: 'SCHEDULED'
            }
        });
        // Send notifications
        await sendSessionNotifications(session);
        res.status(201).json({
            message: 'Mentorship session scheduled successfully',
            session
        });
    }
    catch (error) {
        console.error('Error scheduling session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Submit session feedback
router.post('/sessions/:sessionId/feedback', auth_1.authenticate, (0, validation_1.validateRequest)(SessionFeedbackSchema), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const feedbackData = req.body;
        const userId = req.user?.id;
        // Verify session exists and user is the mentor
        const session = await prisma.mentorshipSession.findFirst({
            where: {
                id: sessionId,
                mentor: { userId }
            }
        });
        if (!session) {
            return res.status(404).json({ error: 'Session not found or unauthorized' });
        }
        if (session.status !== 'COMPLETED') {
            return res.status(400).json({ error: 'Session must be completed to submit feedback' });
        }
        // Update session with feedback
        const updatedSession = await prisma.mentorshipSession.update({
            where: { id: sessionId },
            data: {
                mentorRating: feedbackData.rating,
                mentorFeedback: feedbackData.feedback,
                objectivesMet: feedbackData.objectives_met,
                followUpNeeded: feedbackData.follow_up_needed,
                nextSessionTopics: feedbackData.next_session_topics || [],
                mentorNotes: feedbackData.mentor_notes,
                feedbackSubmittedAt: new Date()
            }
        });
        // Update champion statistics
        await updateChampionStats(session.mentorId);
        res.json({
            message: 'Feedback submitted successfully',
            session: updatedSession
        });
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get champion leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { timeframe = 'month', limit = 10 } = req.query;
        let dateFilter;
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
        const champions = await prisma.aiChampion.findMany({
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
                sessions: {
                    where: {
                        scheduledAt: { gte: dateFilter },
                        status: 'COMPLETED'
                    }
                },
                mentorships: {
                    where: {
                        createdAt: { gte: dateFilter }
                    }
                }
            },
            take: Number(limit)
        });
        const leaderboard = champions.map(champion => ({
            id: champion.id,
            name: `${champion.healthcareSME.user.firstName} ${champion.healthcareSME.user.lastName}`,
            profilePicture: champion.healthcareSME.user.profilePicture,
            level: champion.level,
            specializations: champion.specializations,
            stats: {
                sessionsCompleted: champion.sessions.length,
                menteesActive: champion.mentorships.length,
                averageRating: champion.averageRating,
                totalHours: champion.sessions.reduce((sum, session) => sum + session.duration, 0) / 60
            }
        })).sort((a, b) => {
            // Sort by weighted score: sessions * 2 + mentees * 3 + rating * 10
            const scoreA = a.stats.sessionsCompleted * 2 + a.stats.menteesActive * 3 + (a.stats.averageRating || 0) * 10;
            const scoreB = b.stats.sessionsCompleted * 2 + b.stats.menteesActive * 3 + (b.stats.averageRating || 0) * 10;
            return scoreB - scoreA;
        });
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Find mentors for specific needs
router.get('/find-mentors', auth_1.authenticate, async (req, res) => {
    try {
        const { specialization, level, availability } = req.query;
        const filters = {
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
        const mentors = await prisma.aiChampion.findMany({
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
        const availableMentors = mentors.filter(mentor => mentor.mentorships.length < mentor.mentorshipCapacity).map(mentor => ({
            id: mentor.id,
            name: `${mentor.healthcareSME.user.firstName} ${mentor.healthcareSME.user.lastName}`,
            profilePicture: mentor.healthcareSME.user.profilePicture,
            specialization: mentor.healthcareSME.specialization,
            aiSpecializations: mentor.specializations,
            level: mentor.level,
            rating: mentor.averageRating,
            availableSlots: mentor.mentorshipCapacity - mentor.mentorships.length,
            totalMentees: mentor.totalMentees,
            totalSessions: mentor.totalSessions
        }));
        res.json(availableMentors);
    }
    catch (error) {
        console.error('Error finding mentors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Helper functions
async function notifyAdminsNewApplication(application) {
    // Implementation would send notifications to admins
    console.log(`New AI Champion application from user ${application.userId}`);
}
async function getChampionStats(championId) {
    const sessions = await prisma.mentorshipSession.count({
        where: { mentorId: championId, status: 'COMPLETED' }
    });
    const mentees = await prisma.mentorship.count({
        where: { mentorId: championId, status: 'ACTIVE' }
    });
    const averageRating = await prisma.mentorshipSession.aggregate({
        where: { mentorId: championId, mentorRating: { not: null } },
        _avg: { mentorRating: true }
    });
    return {
        totalSessions: sessions,
        activeMentees: mentees,
        averageRating: averageRating._avg.mentorRating || 0,
        thisMonth: {
            sessions: await prisma.mentorshipSession.count({
                where: {
                    mentorId: championId,
                    status: 'COMPLETED',
                    scheduledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            })
        }
    };
}
async function sendSessionNotifications(session) {
    // Implementation would send email/SMS notifications
    console.log(`Session scheduled: ${session.id}`);
}
async function updateChampionStats(championId) {
    const stats = await getChampionStats(championId);
    await prisma.aiChampion.update({
        where: { id: championId },
        data: {
            totalSessions: stats.totalSessions,
            averageRating: stats.averageRating
        }
    });
}
exports.default = router;
//# sourceMappingURL=aiChampion.js.map