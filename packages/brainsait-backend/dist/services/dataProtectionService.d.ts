/**
 * Data Protection Service for Saudi Healthcare SME Platform
 * Implements PDPL (Personal Data Protection Law) compliance for Saudi Arabia
 *
 * @author BrainSAIT Platform
 * @version 1.0.0
 */
/**
 * Interface for personal data handling
 */
export interface PersonalData {
    userId: string;
    dataType: string;
    classification: string;
    content: any;
    encryptionStatus: boolean;
    consentId?: string;
    retentionUntil: Date;
    createdAt: Date;
    lastAccessed?: Date;
}
/**
 * Interface for data subject rights
 */
export interface DataSubjectRequest {
    requestId: string;
    userId: string;
    type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    requestDate: Date;
    completionDate?: Date;
    details: any;
}
/**
 * Interface for consent management
 */
export interface ConsentRecord {
    id: string;
    userId: string;
    type: string;
    granted: boolean;
    purpose: string;
    scope: string[];
    expiryDate?: Date;
    withdrawable: boolean;
    timestamp: Date;
    ipAddress: string;
    version: string;
}
/**
 * Main Data Protection Service Class
 */
export declare class DataProtectionService {
    private encryption;
    constructor();
    /**
     * Classify data based on Saudi PDPL requirements
     */
    classifyData(dataType: string, content: any): string;
    /**
     * Encrypt sensitive data based on classification
     */
    encryptSensitiveData(data: any, classification: string): Promise<string>;
    /**
     * Decrypt sensitive data
     */
    decryptSensitiveData(encryptedData: string, classification: string): Promise<any>;
    /**
     * Anonymize personal data
     */
    anonymizeData(data: any, fields: string[]): any;
    /**
     * Pseudonymize data for analytics
     */
    pseudonymizeData(data: any, userId: string): any;
    /**
     * Handle data subject access request (DSAR)
     */
    handleDataSubjectRequest(request: DataSubjectRequest): Promise<any>;
    /**
     * Handle access request - provide all personal data
     */
    private handleAccessRequest;
    /**
     * Handle rectification request - correct inaccurate data
     */
    private handleRectificationRequest;
    /**
     * Handle erasure request (right to be forgotten)
     */
    private handleErasureRequest;
    /**
     * Handle data portability request
     */
    private handlePortabilityRequest;
    /**
     * Handle restriction request
     */
    private handleRestrictionRequest;
    /**
     * Handle objection request
     */
    private handleObjectionRequest;
    /**
     * Manage consent records
     */
    recordConsent(consent: ConsentRecord): Promise<void>;
    /**
     * Withdraw consent
     */
    withdrawConsent(userId: string, consentType: string): Promise<void>;
    /**
     * Check consent status
     */
    checkConsent(userId: string, consentType: string): Promise<boolean>;
    /**
     * Data breach notification
     */
    handleDataBreach(breach: {
        affectedUsers: string[];
        dataTypes: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        discoveredAt: Date;
        description: string;
    }): Promise<void>;
    /**
     * Cross-border data transfer compliance
     */
    validateCrossBorderTransfer(data: any, destinationCountry: string): Promise<{
        allowed: boolean;
        requirements?: string[];
    }>;
    /**
     * Privacy impact assessment
     */
    conductPrivacyImpactAssessment(projectName: string, dataTypes: string[], processingActivities: string[]): Promise<any>;
    /**
     * Helper methods
     */
    private hashValue;
    private generatePseudonym;
    private storePseudonymMapping;
    private logDataAccess;
    private validateCorrection;
    private checkRetentionObligations;
    private performDataErasure;
    private schedulePermanentDeletion;
    private gatherPortableData;
    private convertToCSV;
    private convertToXML;
    private objectToXML;
    private flattenObject;
    private generateChecksum;
    private stopDataProcessing;
    private notifyAuthorities;
    private notifyUserOfBreach;
    private implementContainmentMeasures;
    private checkDataTransferSafeguards;
    private suggestMitigations;
    private calculatePrivacyComplianceScore;
    private updateProcessingBasedOnObjection;
}
export declare const dataProtectionService: DataProtectionService;
export default dataProtectionService;
//# sourceMappingURL=dataProtectionService.d.ts.map