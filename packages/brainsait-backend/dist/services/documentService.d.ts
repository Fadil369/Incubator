export interface FeasibilityStudyData {
    smeId: string;
    companyName: string;
    industryFocus: string[];
    businessModel: string;
    targetMarket: string;
    competitiveAdvantage: string;
    financialProjections: any;
    marketAnalysis: any;
    riskAssessment: any;
    timeline: any;
}
export interface BusinessPlanData {
    smeId: string;
    executiveSummary: string;
    businessDescription: string;
    marketAnalysis: any;
    organizationManagement: any;
    serviceProductLine: any;
    marketingSales: any;
    fundingRequest: any;
    financialProjections: any;
    appendix: any;
}
export interface CertificateData {
    recipientName: string;
    programTitle: string;
    completionDate: Date;
    certificateType: 'COMPLETION' | 'ACHIEVEMENT' | 'PARTICIPATION';
    signatory: string;
    signatoryTitle: string;
}
/**
 * Document Generation Service
 * Handles generation of various business documents
 */
export declare class DocumentService {
    private static templatesPath;
    private static outputPath;
    /**
     * Initialize document service
     */
    static initialize(): void;
    /**
     * Generate feasibility study document
     */
    static generateFeasibilityStudy(data: FeasibilityStudyData): Promise<{
        filePath: string;
        fileName: string;
        downloadUrl: string;
    }>;
    /**
     * Generate business plan document
     */
    static generateBusinessPlan(data: BusinessPlanData): Promise<{
        filePath: string;
        fileName: string;
        downloadUrl: string;
    }>;
    /**
     * Generate certificate
     */
    static generateCertificate(data: CertificateData): Promise<{
        filePath: string;
        fileName: string;
        downloadUrl: string;
    }>;
    /**
     * Generate feasibility study HTML template
     */
    private static generateFeasibilityStudyHTML;
    /**
     * Generate business plan HTML template
     */
    private static generateBusinessPlanHTML;
    /**
     * Generate certificate HTML template
     */
    private static generateCertificateHTML;
    /**
     * Get all generated documents for a user
     */
    static getUserDocuments(userId: string): Promise<{
        documents: never[];
        message: string;
    }>;
    /**
     * Delete generated document
     */
    static deleteDocument(filePath: string): Promise<void>;
}
//# sourceMappingURL=documentService.d.ts.map