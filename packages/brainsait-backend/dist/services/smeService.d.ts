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
        smes: any;
        pagination: {
            page: number;
            limit: number;
            total: any;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /**
     * Get SME by ID with full details
     */
    static getSMEById(id: string): Promise<any>;
    /**
     * Create new SME profile
     */
    static createSMEProfile(data: CreateSMEProfileData): Promise<any>;
    /**
     * Update SME profile
     */
    static updateSMEProfile(id: string, data: UpdateSMEProfileData, userId?: string): Promise<any>;
    /**
     * Delete SME profile
     */
    static deleteSMEProfile(id: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get SME profile by user ID
     */
    static getSMEProfileByUserId(userId: string): Promise<any>;
    /**
     * Update SME verification status (Admin function)
     */
    static updateVerificationStatus(id: string, verificationStatus: VerificationStatus, rejectionReason?: string): Promise<any>;
    /**
     * Upload documents for SME
     */
    static uploadDocuments(id: string, documents: any): Promise<any>;
    /**
     * Get SME statistics
     */
    static getSMEStatistics(): Promise<{
        overview: {
            total: any;
            verified: any;
            pending: any;
            inReview: any;
            rejected: any;
        };
        byCompanyType: any;
        byIndustry: {
            industry: string;
            count: number;
        }[];
        recentSMEs: any;
    }>;
    /**
     * Search SMEs by company name or description
     */
    static searchSMEs(query: string, limit?: number): Promise<any>;
    /**
     * Get SMEs by industry focus
     */
    static getSMEsByIndustry(industryFocus: IndustryFocus): Promise<any>;
    /**
     * Get SME enrollment history
     */
    static getSMEEnrollmentHistory(smeId: string): Promise<any>;
    /**
     * Get SME mentorship history
     */
    static getSMEMentorshipHistory(smeId: string): Promise<any>;
}
//# sourceMappingURL=smeService.d.ts.map