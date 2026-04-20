import { z } from 'zod';
export declare const ChampionEnrollmentSchema: z.ZodObject<{
    userId: z.ZodString;
    department: z.ZodString;
    proposedUseCase: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    department: string;
    proposedUseCase?: string | undefined;
}, {
    userId: string;
    department: string;
    proposedUseCase?: string | undefined;
}>;
export declare const ProficiencyUpdateSchema: z.ZodObject<{
    championId: z.ZodString;
    score: z.ZodNumber;
    assessmentType: z.ZodEnum<["self", "peer", "supervisor", "automated"]>;
}, "strip", z.ZodTypeAny, {
    championId: string;
    score: number;
    assessmentType: "self" | "peer" | "supervisor" | "automated";
}, {
    championId: string;
    score: number;
    assessmentType: "self" | "peer" | "supervisor" | "automated";
}>;
export declare const UseCaseSubmissionSchema: z.ZodObject<{
    championId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    useCase: z.ZodEnum<["CLAIMS_AUTOMATION", "PATIENT_CONTACT", "CLINICAL_DOCUMENTATION", "COMPLIANCE_AUDIT", "KNOWLEDGE_MANAGEMENT"]>;
    expectedEfficiencyGain: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    championId: string;
    title: string;
    useCase: "CLAIMS_AUTOMATION" | "PATIENT_CONTACT" | "CLINICAL_DOCUMENTATION" | "COMPLIANCE_AUDIT" | "KNOWLEDGE_MANAGEMENT";
    expectedEfficiencyGain?: number | undefined;
}, {
    description: string;
    championId: string;
    title: string;
    useCase: "CLAIMS_AUTOMATION" | "PATIENT_CONTACT" | "CLINICAL_DOCUMENTATION" | "COMPLIANCE_AUDIT" | "KNOWLEDGE_MANAGEMENT";
    expectedEfficiencyGain?: number | undefined;
}>;
export interface ChampionMetrics {
    championId: string;
    totalUsageHours: number;
    tokensUsed: number;
    timeSaved: number;
    useCasesDelivered: number;
    proficiencyScore: number;
    lastActivityDate: Date | null;
    departmentRank: number;
    overallRank: number;
}
export declare class AIChampionsService {
    enrollChampion(data: z.infer<typeof ChampionEnrollmentSchema>): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        userId: string;
        status: import(".prisma/client").$Enums.ChampionStatus;
        department: string;
        proficiencyScore: number;
        useCasesDelivered: number;
        lastActivity: Date | null;
        mentorshipCapacity: number | null;
        totalSessions: number;
        availableMenteeSlots: number | null;
        specializations: import("@prisma/client/runtime/library").JsonValue | null;
        level: string | null;
        averageRating: number | null;
        totalMentees: number | null;
        createdAt: Date;
        updatedAt: Date;
        healthcareSMEId: string | null;
    }>;
    private createOnboardingTasks;
    updateProficiency(data: z.infer<typeof ProficiencyUpdateSchema>): Promise<{
        id: string;
        userId: string;
        status: import(".prisma/client").$Enums.ChampionStatus;
        department: string;
        proficiencyScore: number;
        useCasesDelivered: number;
        lastActivity: Date | null;
        mentorshipCapacity: number | null;
        totalSessions: number;
        availableMenteeSlots: number | null;
        specializations: import("@prisma/client/runtime/library").JsonValue | null;
        level: string | null;
        averageRating: number | null;
        totalMentees: number | null;
        createdAt: Date;
        updatedAt: Date;
        healthcareSMEId: string | null;
    }>;
    private calculateWeightedScore;
    submitUseCase(data: z.infer<typeof UseCaseSubmissionSchema>): Promise<{
        id: string;
        description: string;
        startDate: Date;
        endDate: Date | null;
        status: import(".prisma/client").$Enums.AIProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        championId: string;
        title: string;
        useCase: import(".prisma/client").$Enums.AIUseCase;
        expectedEfficiencyGain: number | null;
        efficiencyGain: number | null;
        roi: number | null;
    }>;
    getChampionMetrics(championId: string): Promise<ChampionMetrics>;
    getLeaderboard(limit?: number): Promise<{
        user: {
            firstName: string;
            lastName: string;
            avatar: string | null;
        };
        id: string;
        userId: string;
        status: import(".prisma/client").$Enums.ChampionStatus;
        department: string;
        proficiencyScore: number;
        useCasesDelivered: number;
        lastActivity: Date | null;
        mentorshipCapacity: number | null;
        totalSessions: number;
        availableMenteeSlots: number | null;
        specializations: import("@prisma/client/runtime/library").JsonValue | null;
        level: string | null;
        averageRating: number | null;
        totalMentees: number | null;
        createdAt: Date;
        updatedAt: Date;
        healthcareSMEId: string | null;
        rank: number;
    }[]>;
    trackUsage(data: {
        userId: string;
        feature: string;
        model: string;
        promptTokens: number;
        completionTokens: number;
        timeSaved?: number;
        qualityScore?: number;
    }): Promise<{
        id: string;
        userId: string;
        model: string;
        feature: string;
        createdAt: Date;
        championId: string | null;
        promptTokens: number;
        completionTokens: number;
        timeSaved: number | null;
        qualityScore: number | null;
    }>;
    calculateROI(projectId: string): Promise<{
        projectId: string;
        timeSavedHours: number;
        savings: number;
        costs: number;
        roi: number;
        metrics: {
            id: string;
            projectId: string;
            metricType: string;
            baseline: number;
            current: number;
            target: number;
            measuredAt: Date;
        }[];
    }>;
}
export declare const aiChampionsService: AIChampionsService;
//# sourceMappingURL=aiChampionsService.d.ts.map