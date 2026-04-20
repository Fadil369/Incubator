import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger';
const prisma = new PrismaClient();
export const ChampionEnrollmentSchema = z.object({
    userId: z.string(),
    department: z.string(),
    proposedUseCase: z.string().optional(),
});
export const ProficiencyUpdateSchema = z.object({
    championId: z.string(),
    score: z.number().min(0).max(10),
    assessmentType: z.enum(['self', 'peer', 'supervisor', 'automated']),
});
export const UseCaseSubmissionSchema = z.object({
    championId: z.string(),
    title: z.string(),
    description: z.string(),
    useCase: z.enum([
        'CLAIMS_AUTOMATION',
        'PATIENT_CONTACT',
        'CLINICAL_DOCUMENTATION',
        'COMPLIANCE_AUDIT',
        'KNOWLEDGE_MANAGEMENT',
    ]),
    expectedEfficiencyGain: z.number().optional(),
});
export class AIChampionsService {
    async enrollChampion(data) {
        const validated = ChampionEnrollmentSchema.parse(data);
        logger.info('Enrolling new AI Champion', { userId: validated.userId });
        try {
            const existingChampion = await prisma.aIChampion.findUnique({
                where: { userId: validated.userId },
            });
            if (existingChampion) {
                throw new Error('User is already enrolled as an AI Champion');
            }
            const champion = await prisma.aIChampion.create({
                data: {
                    userId: validated.userId,
                    department: validated.department,
                    status: 'TRAINING',
                    proficiencyScore: 0,
                    useCasesDelivered: 0,
                },
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
            await this.createOnboardingTasks(champion.id);
            return champion;
        }
        catch (error) {
            logger.error('Failed to enroll champion', { error, data: validated });
            throw error;
        }
    }
    async createOnboardingTasks(championId) {
        const onboardingTasks = [
            {
                title: 'Complete AI Fundamentals Training',
                description: 'Learn the basics of AI in healthcare',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Submit First Use Case Proposal',
                description: 'Identify and propose your first AI pilot project',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
            {
                title: 'Achieve Proficiency Level 5',
                description: 'Complete assessments to reach proficiency level 5',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        ];
        for (const task of onboardingTasks) {
            await prisma.championTask.create({
                data: {
                    ...task,
                    championId,
                    status: 'PENDING',
                },
            });
        }
    }
    async updateProficiency(data) {
        const validated = ProficiencyUpdateSchema.parse(data);
        logger.info('Updating champion proficiency', validated);
        const champion = await prisma.aIChampion.findUnique({
            where: { id: validated.championId },
        });
        if (!champion) {
            throw new Error('Champion not found');
        }
        const weightedScore = this.calculateWeightedScore(champion.proficiencyScore, validated.score, validated.assessmentType);
        const updatedChampion = await prisma.aIChampion.update({
            where: { id: validated.championId },
            data: {
                proficiencyScore: weightedScore,
                status: weightedScore >= 7 ? 'ACTIVE' : champion.status,
            },
        });
        await prisma.proficiencyAssessment.create({
            data: {
                championId: validated.championId,
                score: validated.score,
                assessmentType: validated.assessmentType,
                assessedAt: new Date(),
            },
        });
        return updatedChampion;
    }
    calculateWeightedScore(currentScore, newScore, assessmentType) {
        const weights = {
            self: 0.1,
            peer: 0.2,
            supervisor: 0.3,
            automated: 0.4,
        };
        const weight = weights[assessmentType] || 0.1;
        return currentScore * (1 - weight) + newScore * weight;
    }
    async submitUseCase(data) {
        const validated = UseCaseSubmissionSchema.parse(data);
        logger.info('Submitting new use case', validated);
        const pilotProject = await prisma.aIPilotProject.create({
            data: {
                title: validated.title,
                description: validated.description,
                useCase: validated.useCase,
                championId: validated.championId,
                status: 'PLANNING',
                startDate: new Date(),
                expectedEfficiencyGain: validated.expectedEfficiencyGain,
            },
        });
        await prisma.aIChampion.update({
            where: { id: validated.championId },
            data: {
                useCasesDelivered: {
                    increment: 1,
                },
            },
        });
        return pilotProject;
    }
    async getChampionMetrics(championId) {
        const champion = await prisma.aIChampion.findUnique({
            where: { id: championId },
            include: {
                aiUsageLogs: true,
                pilotProjects: {
                    include: {
                        metrics: true,
                    },
                },
            },
        });
        if (!champion) {
            throw new Error('Champion not found');
        }
        const totalUsageHours = champion.aiUsageLogs.reduce((sum, log) => sum + (log.timeSaved || 0) / 60, 0);
        const tokensUsed = champion.aiUsageLogs.reduce((sum, log) => sum + log.promptTokens + log.completionTokens, 0);
        const timeSaved = champion.aiUsageLogs.reduce((sum, log) => sum + (log.timeSaved || 0), 0);
        const departmentChampions = await prisma.aIChampion.findMany({
            where: { department: champion.department },
            orderBy: { proficiencyScore: 'desc' },
        });
        const allChampions = await prisma.aIChampion.findMany({
            orderBy: { proficiencyScore: 'desc' },
        });
        const departmentRank = departmentChampions.findIndex(c => c.id === championId) + 1;
        const overallRank = allChampions.findIndex(c => c.id === championId) + 1;
        return {
            championId,
            totalUsageHours,
            tokensUsed,
            timeSaved,
            useCasesDelivered: champion.useCasesDelivered,
            proficiencyScore: champion.proficiencyScore,
            lastActivityDate: champion.lastActivity,
            departmentRank,
            overallRank,
        };
    }
    async getLeaderboard(limit = 10) {
        const champions = await prisma.aIChampion.findMany({
            orderBy: [
                { proficiencyScore: 'desc' },
                { useCasesDelivered: 'desc' },
            ],
            take: limit,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
        return champions.map((champion, index) => ({
            rank: index + 1,
            ...champion,
        }));
    }
    async trackUsage(data) {
        const champion = await prisma.aIChampion.findUnique({
            where: { userId: data.userId },
        });
        const usageLog = await prisma.aIUsageLog.create({
            data: {
                ...data,
                championId: champion?.id,
            },
        });
        if (champion) {
            await prisma.aIChampion.update({
                where: { id: champion.id },
                data: {
                    lastActivity: new Date(),
                },
            });
        }
        return usageLog;
    }
    async calculateROI(projectId) {
        const project = await prisma.aIPilotProject.findUnique({
            where: { id: projectId },
            include: {
                metrics: true,
                champion: {
                    include: {
                        aiUsageLogs: {
                            where: {
                                createdAt: {
                                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!project) {
            throw new Error('Project not found');
        }
        const timeSavedHours = project.champion.aiUsageLogs.reduce((sum, log) => sum + (log.timeSaved || 0) / 60, 0);
        const hourlyRate = 50;
        const tokenCost = project.champion.aiUsageLogs.reduce((sum, log) => sum + (log.promptTokens + log.completionTokens) * 0.00001, 0);
        const savings = timeSavedHours * hourlyRate;
        const costs = tokenCost;
        const roi = ((savings - costs) / costs) * 100;
        await prisma.aIPilotProject.update({
            where: { id: projectId },
            data: {
                roi,
            },
        });
        return {
            projectId,
            timeSavedHours,
            savings,
            costs,
            roi,
            metrics: project.metrics,
        };
    }
}
export const aiChampionsService = new AIChampionsService();
//# sourceMappingURL=aiChampionsService.js.map