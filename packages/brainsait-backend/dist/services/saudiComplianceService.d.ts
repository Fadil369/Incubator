import { SaudiAddress } from '../utils/saudiValidation';
export interface SaudiComplianceData {
    crNumber?: string;
    crIssueDate?: Date;
    crExpiryDate?: Date;
    crActivity?: string;
    monocNumber?: string;
    vatNumber?: string;
    vatRegistrationDate?: Date;
    zakatNumber?: string;
    gosiNumber?: string;
    waslAddress?: SaudiAddress;
}
export interface ComplianceCheckResult {
    score: number;
    issues: ComplianceIssue[];
    recommendations: string[];
    nextAuditDate: Date;
}
export interface ComplianceIssue {
    category: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    type: string;
    description: string;
    requiredAction: string;
    deadline?: Date;
}
export declare class SaudiComplianceService {
    /**
     * Create or update Saudi regulatory compliance record
     */
    createOrUpdateCompliance(smeId: string, data: SaudiComplianceData): Promise<any>;
    /**
     * Perform comprehensive compliance check
     */
    performComplianceCheck(smeId: string): Promise<ComplianceCheckResult>;
    /**
     * Validate CR number with government API (mock implementation)
     */
    validateCRWithGovernment(crNumber: string, smeId: string): Promise<boolean>;
    /**
     * Generate compliance recommendations based on issues
     */
    private generateRecommendations;
    /**
     * Calculate next audit date based on compliance score and issues
     */
    private calculateNextAuditDate;
    /**
     * Log API calls to government services
     */
    private logAPICall;
    /**
     * Get compliance summary for dashboard
     */
    getComplianceSummary(smeId: string): Promise<any>;
}
export declare const saudiComplianceService: SaudiComplianceService;
//# sourceMappingURL=saudiComplianceService.d.ts.map