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
// AI Champion Registration Schema
const AIChampionRegistrationSchema = zod_1.z.object({
    level: zod_1.z.enum(['JUNIOR', 'SENIOR', 'LEAD']),
    specializations: zod_1.z.array(zod_1.z.enum([
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
    mentorshipCapacity: zod_1.z.number().min(0).max(20),
    availableHoursPerWeek: zod_1.z.number().min(0).max(40),
    preferredMenteeLevel: zod_1.z.array(zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])),
    languagesOffered: zod_1.z.array(zod_1.z.enum(['EN', 'AR', 'FR', 'ES', 'DE', 'JA', 'ZH'])),
    timeZone: zod_1.z.string(),
    bio: zod_1.z.string().min(50).max(1000),
    achievements: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string(),
        date: zod_1.z.string(),
        verificationUrl: zod_1.z.string().optional()
    })).optional(),
    socialLinks: zod_1.z.object({
        linkedIn: zod_1.z.string().url().optional(),
        twitter: zod_1.z.string().url().optional(),
        researchGate: zod_1.z.string().url().optional(),
        personalWebsite: zod_1.z.string().url().optional()
    }).optional()
});
const MentorshipApplicationSchema = zod_1.z.object({
    championId: zod_1.z.string(),
    goals: zod_1.z.array(zod_1.z.string()),
    currentLevel: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    timeCommitment: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']), // 1-3, 3-6, 6+ hours per week
    preferredLanguage: zod_1.z.enum(['EN', 'AR', 'FR', 'ES', 'DE', 'JA', 'ZH']),
    previousExperience: zod_1.z.string().max(500),
    specificInterests: zod_1.z.array(zod_1.z.string()),
    expectedDuration: zod_1.z.enum(['1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR'])
});
const SessionFeedbackSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    rating: zod_1.z.number().min(1).max(5),
    feedback: zod_1.z.string().max(1000),
    topics_covered: zod_1.z.array(zod_1.z.string()),
    homework_completed: zod_1.z.boolean(),
    next_session_goals: zod_1.z.array(zod_1.z.string()).optional()
});
// Register as AI Champion
router.post('/register', auth_1.authenticate, (0, validation_1.validateRequest)(AIChampionRegistrationSchema), async (req, res) => {
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
    }
    catch (error) {
        console.error('Error registering AI Champion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all available AI Champions
router.get('/available', async (req, res) => {
    try {
        const { specialization, language, level, page = 1, limit = 10 } = req.query;
        const where = {
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
    }
    catch (error) {
        console.error('Error fetching available AI Champions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Apply for mentorship
router.post('/mentorship/apply', auth_1.authenticate, (0, validation_1.validateRequest)(MentorshipApplicationSchema), async (req, res) => {
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
    }
    catch (error) {
        console.error('Error applying for mentorship:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Champion: Review mentorship applications
router.get('/mentorship/applications', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching mentorship applications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Champion: Accept/Reject mentorship application
router.put('/mentorship/applications/:applicationId', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error updating mentorship application:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get champion dashboard
router.get('/dashboard', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching champion dashboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Helper functions
async function sendMentorshipApplicationNotification(champion, application) {
    // Implementation would send email/notification to champion
    console.log(`Mentorship application notification sent to champion ${champion.id}`);
}
async function sendApplicationStatusNotification(user, status, message) {
    // Implementation would send email/notification to user
    console.log(`Application status notification sent to user ${user.id}: ${status}`);
}
function calculateEndDate(duration) {
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
async function scheduleFirstSession(mentorship) {
    // Implementation would schedule first mentorship session
    console.log(`First session scheduled for mentorship ${mentorship.id}`);
}
exports.default = router;
//# sourceMappingURL=aiChampions.js.map