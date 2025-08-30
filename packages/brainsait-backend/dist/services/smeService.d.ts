import { SMEType, IndustryFocus, VerificationStatus } from '@prisma/client';
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
export declare class SMEService {
    /**
     * Get SMEs with filtering and pagination
     */
    static getSMEs(options?: SMEFilterOptions): Promise<{
        smes: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                isVerified: boolean;
            };
            _count: {
                mentorships: number;
                programEnrollments: number;
            };
            programEnrollments: {
                id: string;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                progress: number;
                program: {
                    type: import(".prisma/client").$Enums.ProgramType;
                    id: string;
                    title: string;
                };
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            documents: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            companyName: string;
            companyType: import(".prisma/client").$Enums.SMEType;
            industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
            description: string | null;
            website: string | null;
            foundedYear: number | null;
            employeeCount: number | null;
            annualRevenue: string | null;
            address: import("@prisma/client/runtime/library").JsonValue | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            commercialRegistrationNumber: string | null;
            monocNumber: string | null;
            vatRegistrationNumber: string | null;
            saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
            saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
            lastComplianceCheck: Date | null;
            complianceNotes: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /**
     * Get SME by ID with full details
     */
    static getSMEById(id: string): Promise<{
        mentorships: ({
            mentor: {
                id: string;
                user: {
                    firstName: string;
                    lastName: string;
                };
                expertise: import(".prisma/client").$Enums.IndustryFocus[];
                currentRole: string;
                company: string;
            };
        } & {
            id: string;
            smeId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.MentorshipStatus;
            startDate: Date | null;
            endDate: Date | null;
            mentorId: string;
            championId: string | null;
            menteeId: string | null;
            expectedEndDate: Date | null;
            sessionCount: number;
            notes: string | null;
            goals: string | null;
        })[];
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isVerified: boolean;
            phoneNumber: string;
            createdAt: Date;
        };
        programEnrollments: ({
            program: {
                type: import(".prisma/client").$Enums.ProgramType;
                id: string;
                description: string;
                status: import(".prisma/client").$Enums.ProgramStatus;
                title: string;
                duration: number;
            };
        } & {
            id: string;
            smeId: string;
            updatedAt: Date;
            programId: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            progress: number;
            completedAt: Date | null;
            enrolledAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    }>;
    /**
     * Create new SME profile
     */
    static createSMEProfile(data: CreateSMEProfileData): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    }>;
    /**
     * Update SME profile
     */
    static updateSMEProfile(id: string, data: UpdateSMEProfileData, userId?: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isVerified: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    }>;
    /**
     * Delete SME profile
     */
    static deleteSMEProfile(id: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get SME profile by user ID
     */
    static getSMEProfileByUserId(userId: string): Promise<{
        mentorships: ({
            mentor: {
                id: string;
                user: {
                    firstName: string;
                    lastName: string;
                };
                expertise: import(".prisma/client").$Enums.IndustryFocus[];
                currentRole: string;
                company: string;
                rating: number;
            };
        } & {
            id: string;
            smeId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.MentorshipStatus;
            startDate: Date | null;
            endDate: Date | null;
            mentorId: string;
            championId: string | null;
            menteeId: string | null;
            expectedEndDate: Date | null;
            sessionCount: number;
            notes: string | null;
            goals: string | null;
        })[];
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isVerified: boolean;
            phoneNumber: string;
        };
        programEnrollments: ({
            program: {
                type: import(".prisma/client").$Enums.ProgramType;
                id: string;
                status: import(".prisma/client").$Enums.ProgramStatus;
                title: string;
                duration: number;
            };
        } & {
            id: string;
            smeId: string;
            updatedAt: Date;
            programId: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            progress: number;
            completedAt: Date | null;
            enrolledAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    }>;
    /**
     * Update SME verification status (Admin function)
     */
    static updateVerificationStatus(id: string, verificationStatus: VerificationStatus, rejectionReason?: string): Promise<{
        user: {
            email: string;
            firstName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    }>;
    /**
     * Upload documents for SME
     */
    static uploadDocuments(id: string, documents: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    }>;
    /**
     * Get SME statistics
     */
    static getSMEStatistics(): Promise<{
        overview: {
            total: number;
            verified: number;
            pending: number;
            inReview: number;
            rejected: number;
        };
        byCompanyType: {
            type: import(".prisma/client").$Enums.SMEType;
            count: number;
        }[];
        byIndustry: {
            industry: string;
            count: number;
        }[];
        recentSMEs: {
            id: string;
            createdAt: Date;
            user: {
                firstName: string;
                lastName: string;
            };
            companyName: string;
            companyType: import(".prisma/client").$Enums.SMEType;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        }[];
    }>;
    /**
     * Search SMEs by company name or description
     */
    static searchSMEs(query: string, limit?: number): Promise<{
        id: string;
        user: {
            firstName: string;
            lastName: string;
        };
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
    }[]>;
    /**
     * Get SMEs by industry focus
     */
    static getSMEsByIndustry(industryFocus: IndustryFocus): Promise<({
        user: {
            firstName: string;
            lastName: string;
        };
        _count: {
            mentorships: number;
            programEnrollments: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        documents: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        companyName: string;
        companyType: import(".prisma/client").$Enums.SMEType;
        industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
        description: string | null;
        website: string | null;
        foundedYear: number | null;
        employeeCount: number | null;
        annualRevenue: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        commercialRegistrationNumber: string | null;
        monocNumber: string | null;
        vatRegistrationNumber: string | null;
        saudiAddress: import("@prisma/client/runtime/library").JsonValue | null;
        saudiComplianceStatus: import(".prisma/client").$Enums.SaudiComplianceStatus;
        lastComplianceCheck: Date | null;
        complianceNotes: string | null;
    })[]>;
    /**
     * Get SME enrollment history
     */
    static getSMEEnrollmentHistory(smeId: string): Promise<({
        program: {
            type: import(".prisma/client").$Enums.ProgramType;
            id: string;
            description: string;
            status: import(".prisma/client").$Enums.ProgramStatus;
            title: string;
            duration: number;
        };
    } & {
        id: string;
        smeId: string;
        updatedAt: Date;
        programId: string;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        progress: number;
        completedAt: Date | null;
        enrolledAt: Date;
    })[]>;
    /**
     * Get SME mentorship history
     */
    static getSMEMentorshipHistory(smeId: string): Promise<({
        sessions: {
            id: string;
            rating: number;
            status: import(".prisma/client").$Enums.SessionStatus;
            scheduledAt: Date;
        }[];
        mentor: {
            id: string;
            user: {
                firstName: string;
                lastName: string;
            };
            expertise: import(".prisma/client").$Enums.IndustryFocus[];
            currentRole: string;
            company: string;
            rating: number;
        };
    } & {
        id: string;
        smeId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.MentorshipStatus;
        startDate: Date | null;
        endDate: Date | null;
        mentorId: string;
        championId: string | null;
        menteeId: string | null;
        expectedEndDate: Date | null;
        sessionCount: number;
        notes: string | null;
        goals: string | null;
    })[]>;
}
//# sourceMappingURL=smeService.d.ts.map