"use strict";
/**
 * Data Protection Service for Saudi Healthcare SME Platform
 * Implements PDPL (Personal Data Protection Law) compliance for Saudi Arabia
 *
 * @author BrainSAIT Platform
 * @version 1.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataProtectionService = exports.DataProtectionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const security_1 = require("../middleware/security");
const prisma = new client_1.PrismaClient();
// Saudi PDPL Compliance Configuration
const PDPL_CONFIG = {
    // Data classification levels as per Saudi PDPL
    DATA_CLASSIFICATION: {
        PUBLIC: 'public',
        INTERNAL: 'internal',
        CONFIDENTIAL: 'confidential',
        RESTRICTED: 'restricted', // Healthcare data, financial data
    },
    // Data retention periods (in days) as per Saudi regulations
    RETENTION_PERIODS: {
        HEALTHCARE_RECORDS: 365 * 10, // 10 years for healthcare records
        FINANCIAL_RECORDS: 365 * 5, // 5 years for financial records
        AUDIT_LOGS: 365 * 3, // 3 years for audit logs
        USER_ACTIVITY: 365 * 2, // 2 years for user activity
        TEMPORARY_DATA: 30, // 30 days for temporary data
        DELETED_DATA: 90, // 90 days retention after deletion request
    },
    // Saudi-specific data localization requirements
    DATA_LOCALIZATION: {
        requireLocalStorage: true,
        allowedRegions: ['saudi-arabia', 'gcc'],
        prohibitedRegions: [],
    },
    // Consent management
    CONSENT_TYPES: {
        DATA_COLLECTION: 'data_collection',
        DATA_PROCESSING: 'data_processing',
        DATA_SHARING: 'data_sharing',
        MARKETING: 'marketing',
        ANALYTICS: 'analytics',
        THIRD_PARTY: 'third_party',
    },
    // Anonymization settings
    ANONYMIZATION: {
        algorithms: ['sha256', 'md5'],
        saltRounds: 10,
        preserveFormat: true,
    },
};
/**
 * Main Data Protection Service Class
 */
class DataProtectionService {
    encryption;
    constructor() {
        this.encryption = new security_1.DataEncryption();
    }
    /**
     * Classify data based on Saudi PDPL requirements
     */
    classifyData(dataType, content) {
        // Healthcare-related data
        const healthcareTypes = ['medical_record', 'diagnosis', 'prescription', 'lab_result', 'patient_data'];
        if (healthcareTypes.includes(dataType)) {
            return PDPL_CONFIG.DATA_CLASSIFICATION.RESTRICTED;
        }
        // Financial data
        const financialTypes = ['bank_account', 'credit_card', 'financial_statement', 'tax_record'];
        if (financialTypes.includes(dataType)) {
            return PDPL_CONFIG.DATA_CLASSIFICATION.RESTRICTED;
        }
        // Personal identification
        const personalTypes = ['national_id', 'passport', 'iqama', 'driving_license'];
        if (personalTypes.includes(dataType)) {
            return PDPL_CONFIG.DATA_CLASSIFICATION.CONFIDENTIAL;
        }
        // Business data
        const businessTypes = ['cr_number', 'vat_number', 'business_plan', 'contract'];
        if (businessTypes.includes(dataType)) {
            return PDPL_CONFIG.DATA_CLASSIFICATION.CONFIDENTIAL;
        }
        // Contact information
        const contactTypes = ['email', 'phone', 'address'];
        if (contactTypes.includes(dataType)) {
            return PDPL_CONFIG.DATA_CLASSIFICATION.INTERNAL;
        }
        return PDPL_CONFIG.DATA_CLASSIFICATION.PUBLIC;
    }
    /**
     * Encrypt sensitive data based on classification
     */
    async encryptSensitiveData(data, classification) {
        if (classification === PDPL_CONFIG.DATA_CLASSIFICATION.RESTRICTED ||
            classification === PDPL_CONFIG.DATA_CLASSIFICATION.CONFIDENTIAL) {
            const jsonData = JSON.stringify(data);
            return this.encryption.encrypt(jsonData);
        }
        return JSON.stringify(data);
    }
    /**
     * Decrypt sensitive data
     */
    async decryptSensitiveData(encryptedData, classification) {
        if (classification === PDPL_CONFIG.DATA_CLASSIFICATION.RESTRICTED ||
            classification === PDPL_CONFIG.DATA_CLASSIFICATION.CONFIDENTIAL) {
            const decrypted = this.encryption.decrypt(encryptedData);
            return JSON.parse(decrypted);
        }
        return JSON.parse(encryptedData);
    }
    /**
     * Anonymize personal data
     */
    anonymizeData(data, fields) {
        const anonymized = { ...data };
        fields.forEach(field => {
            if (anonymized[field]) {
                const value = String(anonymized[field]);
                // Preserve format for certain fields
                if (field === 'email') {
                    const [localPart, domain] = value.split('@');
                    anonymized[field] = `${this.hashValue(localPart).substring(0, 8)}@${domain}`;
                }
                else if (field === 'phone') {
                    const prefix = value.substring(0, 3);
                    const suffix = value.substring(value.length - 2);
                    anonymized[field] = `${prefix}****${suffix}`;
                }
                else if (field === 'national_id' || field === 'iqama') {
                    anonymized[field] = `${value.substring(0, 2)}********`;
                }
                else {
                    anonymized[field] = this.hashValue(value);
                }
            }
        });
        return anonymized;
    }
    /**
     * Pseudonymize data for analytics
     */
    pseudonymizeData(data, userId) {
        const pseudonym = this.generatePseudonym(userId);
        const pseudonymized = { ...data };
        // Replace identifiable fields with pseudonym
        const identifiableFields = ['userId', 'email', 'name', 'national_id'];
        identifiableFields.forEach(field => {
            if (pseudonymized[field]) {
                pseudonymized[field] = `${field}_${pseudonym}`;
            }
        });
        return {
            pseudonym,
            data: pseudonymized,
            mapping: this.storePseudonymMapping(userId, pseudonym),
        };
    }
    /**
     * Handle data subject access request (DSAR)
     */
    async handleDataSubjectRequest(request) {
        try {
            switch (request.type) {
                case 'access':
                    return await this.handleAccessRequest(request);
                case 'rectification':
                    return await this.handleRectificationRequest(request);
                case 'erasure':
                    return await this.handleErasureRequest(request);
                case 'portability':
                    return await this.handlePortabilityRequest(request);
                case 'restriction':
                    return await this.handleRestrictionRequest(request);
                case 'objection':
                    return await this.handleObjectionRequest(request);
                default:
                    throw new Error('Invalid request type');
            }
        }
        catch (error) {
            console.error('Error handling data subject request:', error);
            throw error;
        }
    }
    /**
     * Handle access request - provide all personal data
     */
    async handleAccessRequest(request) {
        const userData = await prisma.user.findUnique({
            where: { id: request.userId },
            include: {
                sme: true,
                documents: true,
                auditLogs: {
                    take: 100,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!userData) {
            throw new Error('User not found');
        }
        // Compile comprehensive data report
        const dataReport = {
            personalInformation: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                createdAt: userData.createdAt,
            },
            businessInformation: userData.sme ? {
                companyName: userData.sme.name,
                crNumber: userData.sme.crNumber,
                vatNumber: userData.sme.vatNumber,
                address: userData.sme.address,
            } : null,
            documents: userData.documents.map(doc => ({
                id: doc.id,
                title: doc.title,
                type: doc.type,
                createdAt: doc.createdAt,
            })),
            activityLog: userData.auditLogs.map(log => ({
                action: log.action,
                timestamp: log.createdAt,
                ipAddress: log.ipAddress,
            })),
            dataProcessingPurposes: [
                'Healthcare SME incubation services',
                'Regulatory compliance verification',
                'Document generation and management',
                'Business analytics and reporting',
            ],
            dataRetentionPeriods: {
                personalData: '5 years after account closure',
                businessData: '10 years as per Saudi regulations',
                healthcareData: '10 years as per healthcare regulations',
            },
            dataSharing: {
                thirdParties: [],
                governmentEntities: ['Ministry of Commerce', 'ZATCA', 'GOSI'],
                purpose: 'Regulatory compliance and verification',
            },
        };
        // Log the access request
        await this.logDataAccess(request.userId, 'data_subject_access_request', dataReport);
        return dataReport;
    }
    /**
     * Handle rectification request - correct inaccurate data
     */
    async handleRectificationRequest(request) {
        const { userId, details } = request;
        const { corrections } = details;
        const updatedFields = {};
        // Validate and apply corrections
        for (const [field, value] of Object.entries(corrections)) {
            // Validate the correction based on field type
            if (this.validateCorrection(field, value)) {
                updatedFields[field] = value;
            }
        }
        // Update user data
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updatedFields,
        });
        // Log the rectification
        await this.logDataAccess(userId, 'data_rectification', {
            correctedFields: Object.keys(updatedFields),
            timestamp: new Date(),
        });
        return {
            success: true,
            correctedFields: Object.keys(updatedFields),
            updatedData: updatedUser,
        };
    }
    /**
     * Handle erasure request (right to be forgotten)
     */
    async handleErasureRequest(request) {
        const { userId, details } = request;
        // Check for legal obligations that prevent erasure
        const retentionObligations = await this.checkRetentionObligations(userId);
        if (retentionObligations.hasObligations) {
            return {
                success: false,
                reason: 'Legal retention obligations',
                details: retentionObligations.obligations,
                alternativeAction: 'Data will be anonymized instead of deleted',
            };
        }
        // Perform data erasure or anonymization
        const erasureResult = await this.performDataErasure(userId, details);
        // Schedule permanent deletion after retention period
        await this.schedulePermanentDeletion(userId, PDPL_CONFIG.RETENTION_PERIODS.DELETED_DATA);
        return erasureResult;
    }
    /**
     * Handle data portability request
     */
    async handlePortabilityRequest(request) {
        const { userId, details } = request;
        const { format = 'json' } = details;
        // Gather all portable data
        const portableData = await this.gatherPortableData(userId);
        // Format data according to request
        let formattedData;
        switch (format) {
            case 'json':
                formattedData = JSON.stringify(portableData, null, 2);
                break;
            case 'csv':
                formattedData = this.convertToCSV(portableData);
                break;
            case 'xml':
                formattedData = this.convertToXML(portableData);
                break;
            default:
                formattedData = portableData;
        }
        // Log the portability request
        await this.logDataAccess(userId, 'data_portability_request', {
            format,
            timestamp: new Date(),
        });
        return {
            success: true,
            format,
            data: formattedData,
            checksum: this.generateChecksum(formattedData),
        };
    }
    /**
     * Handle restriction request
     */
    async handleRestrictionRequest(request) {
        const { userId, details } = request;
        const { restrictedProcessing } = details;
        // Apply processing restrictions
        await prisma.user.update({
            where: { id: userId },
            data: {
                processingRestrictions: restrictedProcessing,
                restrictedAt: new Date(),
            },
        });
        return {
            success: true,
            restrictedProcessing,
            effectiveDate: new Date(),
        };
    }
    /**
     * Handle objection request
     */
    async handleObjectionRequest(request) {
        const { userId, details } = request;
        const { objectionTo } = details;
        // Record objection
        await prisma.dataObjection.create({
            data: {
                userId,
                objectionTo: objectionTo,
                reason: details.reason,
                timestamp: new Date(),
            },
        });
        // Update processing based on objection
        await this.updateProcessingBasedOnObjection(userId, objectionTo);
        return {
            success: true,
            objectionRecorded: objectionTo,
            processingUpdated: true,
        };
    }
    /**
     * Manage consent records
     */
    async recordConsent(consent) {
        await prisma.consent.create({
            data: {
                userId: consent.userId,
                type: consent.type,
                granted: consent.granted,
                purpose: consent.purpose,
                scope: consent.scope,
                expiryDate: consent.expiryDate,
                withdrawable: consent.withdrawable,
                ipAddress: consent.ipAddress,
                version: consent.version,
            },
        });
    }
    /**
     * Withdraw consent
     */
    async withdrawConsent(userId, consentType) {
        await prisma.consent.updateMany({
            where: {
                userId,
                type: consentType,
                withdrawable: true,
            },
            data: {
                granted: false,
                withdrawnAt: new Date(),
            },
        });
        // Stop related data processing
        await this.stopDataProcessing(userId, consentType);
    }
    /**
     * Check consent status
     */
    async checkConsent(userId, consentType) {
        const consent = await prisma.consent.findFirst({
            where: {
                userId,
                type: consentType,
                granted: true,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: new Date() } },
                ],
            },
        });
        return !!consent;
    }
    /**
     * Data breach notification
     */
    async handleDataBreach(breach) {
        // Log the breach
        const breachRecord = await prisma.dataBreach.create({
            data: {
                severity: breach.severity,
                affectedUsersCount: breach.affectedUsers.length,
                dataTypes: breach.dataTypes,
                discoveredAt: breach.discoveredAt,
                description: breach.description,
                reportedAt: new Date(),
            },
        });
        // Notify authorities within 72 hours as per PDPL
        if (breach.severity === 'high' || breach.severity === 'critical') {
            await this.notifyAuthorities(breachRecord);
        }
        // Notify affected users
        for (const userId of breach.affectedUsers) {
            await this.notifyUserOfBreach(userId, breach);
        }
        // Implement containment measures
        await this.implementContainmentMeasures(breach);
    }
    /**
     * Cross-border data transfer compliance
     */
    async validateCrossBorderTransfer(data, destinationCountry) {
        // Check if destination is in allowed regions
        const allowedRegions = PDPL_CONFIG.DATA_LOCALIZATION.allowedRegions;
        const prohibitedRegions = PDPL_CONFIG.DATA_LOCALIZATION.prohibitedRegions;
        if (prohibitedRegions.includes(destinationCountry.toLowerCase())) {
            return { allowed: false };
        }
        if (!allowedRegions.includes(destinationCountry.toLowerCase())) {
            // Check for adequacy decision or appropriate safeguards
            const safeguards = await this.checkDataTransferSafeguards(destinationCountry);
            if (!safeguards.adequate) {
                return {
                    allowed: false,
                    requirements: safeguards.missingRequirements,
                };
            }
        }
        return { allowed: true };
    }
    /**
     * Privacy impact assessment
     */
    async conductPrivacyImpactAssessment(projectName, dataTypes, processingActivities) {
        const assessment = {
            projectName,
            assessmentDate: new Date(),
            dataTypes,
            processingActivities,
            risks: [],
            mitigations: [],
            complianceScore: 0,
        };
        // Identify risks
        for (const dataType of dataTypes) {
            const classification = this.classifyData(dataType, {});
            if (classification === PDPL_CONFIG.DATA_CLASSIFICATION.RESTRICTED) {
                assessment.risks.push({
                    type: 'high_sensitivity_data',
                    dataType,
                    severity: 'high',
                    likelihood: 'medium',
                });
            }
        }
        // Identify processing risks
        const riskyProcessing = ['profiling', 'automated_decision_making', 'third_party_sharing'];
        for (const activity of processingActivities) {
            if (riskyProcessing.includes(activity)) {
                assessment.risks.push({
                    type: 'risky_processing',
                    activity,
                    severity: 'medium',
                    likelihood: 'high',
                });
            }
        }
        // Suggest mitigations
        assessment.mitigations = this.suggestMitigations(assessment.risks);
        // Calculate compliance score
        assessment.complianceScore = this.calculatePrivacyComplianceScore(assessment);
        return assessment;
    }
    /**
     * Helper methods
     */
    hashValue(value) {
        return crypto_1.default.createHash('sha256').update(value).digest('hex');
    }
    generatePseudonym(userId) {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(8).toString('hex');
        return crypto_1.default.createHash('md5').update(`${userId}${timestamp}${random}`).digest('hex').substring(0, 16);
    }
    storePseudonymMapping(userId, pseudonym) {
        // Store mapping securely for potential re-identification if legally required
        const mappingId = crypto_1.default.randomBytes(16).toString('hex');
        // In production, store this in a secure, separate database
        return mappingId;
    }
    async logDataAccess(userId, action, details) {
        await prisma.dataAccessLog.create({
            data: {
                userId,
                action,
                details: JSON.stringify(details),
                timestamp: new Date(),
            },
        });
    }
    validateCorrection(field, value) {
        // Implement field-specific validation
        const validationRules = {
            email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
            phone: (val) => /^(\+966|0)?5\d{8}$/.test(val), // Saudi phone format
            crNumber: (val) => /^\d{10}$/.test(val),
            vatNumber: (val) => /^3\d{14}$/.test(val),
        };
        return validationRules[field] ? validationRules[field](value) : true;
    }
    async checkRetentionObligations(userId) {
        // Check for legal obligations that require data retention
        const obligations = [];
        // Check healthcare records
        const healthcareRecords = await prisma.document.count({
            where: {
                userId,
                type: 'healthcare',
                createdAt: {
                    gt: new Date(Date.now() - PDPL_CONFIG.RETENTION_PERIODS.HEALTHCARE_RECORDS * 24 * 60 * 60 * 1000),
                },
            },
        });
        if (healthcareRecords > 0) {
            obligations.push('Healthcare records must be retained for 10 years');
        }
        // Check financial records
        const financialRecords = await prisma.document.count({
            where: {
                userId,
                type: 'financial',
                createdAt: {
                    gt: new Date(Date.now() - PDPL_CONFIG.RETENTION_PERIODS.FINANCIAL_RECORDS * 24 * 60 * 60 * 1000),
                },
            },
        });
        if (financialRecords > 0) {
            obligations.push('Financial records must be retained for 5 years');
        }
        return {
            hasObligations: obligations.length > 0,
            obligations,
        };
    }
    async performDataErasure(userId, options) {
        const { immediate = false, anonymize = true } = options;
        if (immediate && !anonymize) {
            // Hard delete - only if no retention obligations
            await prisma.user.delete({
                where: { id: userId },
            });
            return {
                success: true,
                action: 'deleted',
                timestamp: new Date(),
            };
        }
        else if (anonymize) {
            // Anonymize personal data
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (user) {
                const anonymizedData = this.anonymizeData(user, [
                    'email',
                    'name',
                    'phone',
                    'nationalId',
                ]);
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        ...anonymizedData,
                        isAnonymized: true,
                        anonymizedAt: new Date(),
                    },
                });
            }
            return {
                success: true,
                action: 'anonymized',
                timestamp: new Date(),
            };
        }
        return {
            success: false,
            reason: 'Invalid erasure options',
        };
    }
    async schedulePermanentDeletion(userId, daysUntilDeletion) {
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + daysUntilDeletion);
        await prisma.scheduledDeletion.create({
            data: {
                userId,
                scheduledFor: deletionDate,
                status: 'pending',
            },
        });
    }
    async gatherPortableData(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sme: true,
                documents: true,
                consents: true,
            },
        });
        return {
            personalData: {
                id: user?.id,
                email: user?.email,
                name: user?.name,
                phone: user?.phone,
            },
            businessData: user?.sme,
            documents: user?.documents,
            consents: user?.consents,
            exportDate: new Date(),
            format: 'PDPL_compliant_export',
        };
    }
    convertToCSV(data) {
        // Implement CSV conversion
        // This is a simplified version
        const flat = this.flattenObject(data);
        const headers = Object.keys(flat).join(',');
        const values = Object.values(flat).join(',');
        return `${headers}\n${values}`;
    }
    convertToXML(data) {
        // Implement XML conversion
        // This is a simplified version
        return `<?xml version="1.0" encoding="UTF-8"?>
<DataExport>
  ${this.objectToXML(data)}
</DataExport>`;
    }
    objectToXML(obj, indent = '  ') {
        let xml = '';
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                xml += `${indent}<${key}>\n${this.objectToXML(value, indent + '  ')}${indent}</${key}>\n`;
            }
            else {
                xml += `${indent}<${key}>${value}</${key}>\n`;
            }
        }
        return xml;
    }
    flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            }
            else {
                flattened[newKey] = value;
            }
        }
        return flattened;
    }
    generateChecksum(data) {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto_1.default.createHash('sha256').update(str).digest('hex');
    }
    async stopDataProcessing(userId, consentType) {
        // Implement logic to stop specific data processing based on consent type
        await prisma.dataProcessing.updateMany({
            where: {
                userId,
                type: consentType,
            },
            data: {
                status: 'stopped',
                stoppedAt: new Date(),
            },
        });
    }
    async notifyAuthorities(breach) {
        // Implement notification to Saudi Data & AI Authority (SDAIA)
        console.log('Notifying SDAIA of data breach:', breach);
        // In production, implement actual API call or email notification
    }
    async notifyUserOfBreach(userId, breach) {
        // Implement user notification
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (user) {
            // Send email notification
            console.log(`Notifying user ${user.email} of data breach`);
            // In production, implement actual email sending
        }
    }
    async implementContainmentMeasures(breach) {
        // Implement automatic containment measures
        console.log('Implementing containment measures for breach:', breach);
        // Examples: rotate keys, invalidate sessions, increase monitoring
    }
    async checkDataTransferSafeguards(country) {
        // Check if country has adequate data protection laws
        const adequateCountries = ['eu', 'uk', 'canada', 'japan', 'new-zealand'];
        if (adequateCountries.includes(country.toLowerCase())) {
            return { adequate: true };
        }
        return {
            adequate: false,
            missingRequirements: [
                'Standard Contractual Clauses required',
                'Data Processing Agreement required',
                'Additional safeguards needed',
            ],
        };
    }
    suggestMitigations(risks) {
        const mitigations = [];
        for (const risk of risks) {
            if (risk.type === 'high_sensitivity_data') {
                mitigations.push({
                    risk: risk.type,
                    mitigation: 'Implement end-to-end encryption',
                    priority: 'high',
                });
                mitigations.push({
                    risk: risk.type,
                    mitigation: 'Restrict access with role-based permissions',
                    priority: 'high',
                });
            }
            if (risk.type === 'risky_processing') {
                mitigations.push({
                    risk: risk.type,
                    mitigation: 'Obtain explicit consent',
                    priority: 'medium',
                });
                mitigations.push({
                    risk: risk.type,
                    mitigation: 'Implement audit logging',
                    priority: 'medium',
                });
            }
        }
        return mitigations;
    }
    calculatePrivacyComplianceScore(assessment) {
        let score = 100;
        // Deduct points for risks
        for (const risk of assessment.risks) {
            if (risk.severity === 'high')
                score -= 20;
            if (risk.severity === 'medium')
                score -= 10;
            if (risk.severity === 'low')
                score -= 5;
        }
        // Add points for mitigations
        for (const mitigation of assessment.mitigations) {
            if (mitigation.priority === 'high')
                score += 10;
            if (mitigation.priority === 'medium')
                score += 5;
        }
        return Math.max(0, Math.min(100, score));
    }
    async updateProcessingBasedOnObjection(userId, objectionTo) {
        // Update processing flags based on user objection
        for (const objection of objectionTo) {
            await prisma.userProcessingPreferences.upsert({
                where: {
                    userId_processingType: {
                        userId,
                        processingType: objection,
                    },
                },
                update: {
                    allowed: false,
                    objectedAt: new Date(),
                },
                create: {
                    userId,
                    processingType: objection,
                    allowed: false,
                    objectedAt: new Date(),
                },
            });
        }
    }
}
exports.DataProtectionService = DataProtectionService;
// Export singleton instance
exports.dataProtectionService = new DataProtectionService();
exports.default = exports.dataProtectionService;
//# sourceMappingURL=dataProtectionService.js.map