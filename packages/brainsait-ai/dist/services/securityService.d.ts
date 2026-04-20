export interface SecurityAuditLog {
    id: string;
    timestamp: Date;
    userId: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'warning';
    ipAddress: string;
    userAgent: string;
    details: Record<string, any>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface MFAChallenge {
    challengeId: string;
    method: 'sms' | 'email' | 'totp' | 'biometric';
    expiresAt: Date;
    attempts: number;
    maxAttempts: number;
}
export interface DataProtectionCompliance {
    pdplCompliant: boolean;
    dataResidency: 'saudi' | 'gcc' | 'international';
    consentManagement: {
        enabled: boolean;
        lastUpdated: Date;
        version: string;
    };
    dataRetention: {
        policy: string;
        retentionPeriod: number;
        autoDelete: boolean;
    };
    encryption: {
        atRest: boolean;
        inTransit: boolean;
        algorithm: string;
    };
    accessControl: {
        rbacEnabled: boolean;
        mfaRequired: boolean;
        sessionTimeout: number;
    };
}
export interface SecurityIncident {
    id: string;
    timestamp: Date;
    type: 'unauthorized_access' | 'data_breach' | 'malware' | 'dos' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'detected' | 'investigating' | 'contained' | 'resolved';
    affectedResources: string[];
    description: string;
    responseActions: string[];
    assignedTo?: string;
}
declare class SecurityService {
    /**
     * Generate MFA challenge for user authentication
     */
    generateMFAChallenge(userId: string, method: 'sms' | 'email' | 'totp'): Promise<MFAChallenge>;
    /**
     * Verify MFA challenge response
     */
    verifyMFAChallenge(challengeId: string, code: string): Promise<boolean>;
    /**
     * Log security audit event
     */
    logAuditEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void>;
    /**
     * Assess data protection compliance
     */
    assessDataProtectionCompliance(organizationId: string): Promise<DataProtectionCompliance>;
    /**
     * Create security incident
     */
    createSecurityIncident(type: SecurityIncident['type'], severity: SecurityIncident['severity'], description: string, affectedResources: string[]): Promise<SecurityIncident>;
    /**
     * Generate comprehensive security report
     */
    generateSecurityReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
        summary: {
            totalEvents: number;
            criticalIncidents: number;
            failedLogins: number;
            dataAccesses: number;
            complianceScore: number;
        };
        incidents: SecurityIncident[];
        topRisks: Array<{
            risk: string;
            occurrences: number;
            severity: string;
        }>;
        recommendations: string[];
    }>;
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encryptSensitiveData(data: string, key: string): {
        encrypted: string;
        iv: string;
        tag: string;
    };
    /**
     * Decrypt sensitive data
     */
    decryptSensitiveData(encrypted: string, key: string, iv: string, tag: string): string;
    private generateSecureCode;
    private storeMFAChallenge;
    private retrieveMFAChallenge;
    private updateMFAChallenge;
    private deleteMFAChallenge;
    private storeAuditLog;
    private analyzeSuspiciousActivity;
    private triggerSecurityAlert;
    private storeSecurityIncident;
    private notifySecurityTeam;
    private executeAutomatedResponse;
    private getDefaultResponseActions;
    private getAuditLogs;
    private getSecurityIncidents;
    private calculateComplianceScore;
    private analyzeTopRisks;
    private generateSecurityRecommendations;
}
export default SecurityService;
//# sourceMappingURL=securityService.d.ts.map