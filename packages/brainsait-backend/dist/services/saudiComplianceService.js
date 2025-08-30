import { CRStatus, MOCIStatus, PrismaClient, VATStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { validateCRNumber, validateSaudiAddress, validateVATNumber } from '../utils/saudiValidation';
const prisma = new PrismaClient();
export class SaudiComplianceService {
    /**
     * Create or update Saudi regulatory compliance record
     */
    async createOrUpdateCompliance(smeId, data) {
        try {
            // Validate CR number if provided
            if (data.crNumber) {
                const crValidation = validateCRNumber(data.crNumber);
                if (!crValidation.isValid) {
                    throw new Error(`Invalid CR number: ${crValidation.errors.join(', ')}`);
                }
            }
            // Validate VAT number if provided
            if (data.vatNumber) {
                const vatValidation = validateVATNumber(data.vatNumber);
                if (!vatValidation.isValid) {
                    throw new Error(`Invalid VAT number: ${vatValidation.errors.join(', ')}`);
                }
            }
            // Validate Saudi address if provided
            let waslValidated = false;
            if (data.waslAddress) {
                const addressValidation = validateSaudiAddress(data.waslAddress);
                if (!addressValidation.isValid) {
                    throw new Error(`Invalid address: ${addressValidation.errors.join(', ')}`);
                }
                waslValidated = true;
            }
            // Check if compliance record exists
            const existingCompliance = await prisma.saudiRegulatoryCompliance.findUnique({
                where: { smeId }
            });
            const complianceData = {
                crNumber: data.crNumber,
                crIssueDate: data.crIssueDate,
                crExpiryDate: data.crExpiryDate,
                crActivity: data.crActivity,
                crStatus: data.crNumber ? CRStatus.PENDING : undefined,
                monocNumber: data.monocNumber,
                monocStatus: data.monocNumber ? MOCIStatus.PENDING : undefined,
                vatNumber: data.vatNumber,
                vatRegistrationDate: data.vatRegistrationDate,
                vatStatus: data.vatNumber ? VATStatus.PENDING_REGISTRATION : VATStatus.NOT_APPLICABLE,
                zakatNumber: data.zakatNumber,
                gosiNumber: data.gosiNumber,
                // WASL Address fields
                waslBuildingNumber: data.waslAddress?.buildingNumber,
                waslStreetName: data.waslAddress?.streetName,
                waslDistrict: data.waslAddress?.district,
                waslCity: data.waslAddress?.city,
                waslRegion: data.waslAddress?.region,
                waslPostalCode: data.waslAddress?.postalCode,
                waslAdditionalNumber: data.waslAddress?.additionalNumber,
                waslValidated,
                lastFullAudit: new Date(),
                nextAuditDue: this.calculateNextAuditDate(),
            };
            let compliance;
            if (existingCompliance) {
                compliance = await prisma.saudiRegulatoryCompliance.update({
                    where: { smeId },
                    data: complianceData
                });
            }
            else {
                compliance = await prisma.saudiRegulatoryCompliance.create({
                    data: {
                        smeId,
                        ...complianceData
                    }
                });
            }
            // Calculate compliance score
            const complianceCheck = await this.performComplianceCheck(smeId);
            // Update compliance score
            await prisma.saudiRegulatoryCompliance.update({
                where: { smeId },
                data: {
                    overallComplianceScore: complianceCheck.score
                }
            });
            // Log the API call
            await this.logAPICall(smeId, 'COMPLIANCE_UPDATE', 'SUCCESS', data);
            logger.info(`Saudi compliance updated for SME: ${smeId}`, {
                smeId,
                score: complianceCheck.score,
                issues: complianceCheck.issues.length
            });
            return { compliance, complianceCheck };
        }
        catch (error) {
            await this.logAPICall(smeId, 'COMPLIANCE_UPDATE', 'FAILED', data, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    /**
     * Perform comprehensive compliance check
     */
    async performComplianceCheck(smeId) {
        const compliance = await prisma.saudiRegulatoryCompliance.findUnique({
            where: { smeId },
            include: {
                sme: {
                    include: {
                        user: true,
                        healthcareProfile: true
                    }
                }
            }
        });
        if (!compliance) {
            throw new Error('No compliance record found');
        }
        const issues = [];
        let score = 0;
        const maxScore = 100;
        // CR Number Check (20 points)
        if (compliance.crNumber && compliance.crStatus === CRStatus.ACTIVE) {
            score += 20;
        }
        else if (compliance.crNumber && compliance.crStatus === CRStatus.PENDING) {
            score += 10;
            issues.push({
                category: 'HIGH',
                type: 'CR_PENDING',
                description: 'Commercial Registration status is pending',
                requiredAction: 'Complete CR registration process with MOCI',
                deadline: compliance.crExpiryDate || undefined
            });
        }
        else {
            issues.push({
                category: 'CRITICAL',
                type: 'CR_MISSING',
                description: 'Commercial Registration number is required',
                requiredAction: 'Register with Ministry of Commerce and Industry',
            });
        }
        // VAT Registration Check (15 points)
        if (compliance.vatStatus === VATStatus.REGISTERED) {
            score += 15;
        }
        else if (compliance.vatStatus === VATStatus.EXEMPTED) {
            score += 15; // Exemption is compliant
        }
        else if (compliance.vatStatus === VATStatus.PENDING_REGISTRATION) {
            score += 8;
            issues.push({
                category: 'HIGH',
                type: 'VAT_PENDING',
                description: 'VAT registration is pending',
                requiredAction: 'Complete VAT registration with ZATCA'
            });
        }
        else if (compliance.sme.annualRevenue && parseFloat(compliance.sme.annualRevenue) > 375000) {
            issues.push({
                category: 'CRITICAL',
                type: 'VAT_REQUIRED',
                description: 'VAT registration is required for revenue > 375,000 SAR',
                requiredAction: 'Register for VAT with ZATCA'
            });
        }
        // Address Validation Check (15 points)
        if (compliance.waslValidated && compliance.waslBuildingNumber && compliance.waslPostalCode) {
            score += 15;
        }
        else {
            issues.push({
                category: 'MEDIUM',
                type: 'ADDRESS_INCOMPLETE',
                description: 'Saudi address is not WASL validated',
                requiredAction: 'Provide complete WASL-compliant address'
            });
        }
        // Healthcare Specific Checks (25 points)
        if (compliance.sme.healthcareProfile) {
            const healthProfile = compliance.sme.healthcareProfile;
            if (healthProfile.saudiHealthLicense) {
                score += 15;
            }
            else {
                issues.push({
                    category: 'CRITICAL',
                    type: 'HEALTH_LICENSE_MISSING',
                    description: 'Saudi Health Council license is required for healthcare businesses',
                    requiredAction: 'Apply for healthcare license from Saudi Health Council'
                });
            }
            if (healthProfile.cbahiAccreditationId) {
                score += 10;
            }
            else {
                issues.push({
                    category: 'HIGH',
                    type: 'CBAHI_ACCREDITATION',
                    description: 'CBAHI accreditation recommended for healthcare quality',
                    requiredAction: 'Apply for CBAHI accreditation'
                });
            }
        }
        // GOSI Registration Check (10 points)
        if (compliance.gosiStatus === 'REGISTERED') {
            score += 10;
        }
        else if (compliance.sme.employeeCount && compliance.sme.employeeCount > 0) {
            issues.push({
                category: 'HIGH',
                type: 'GOSI_REQUIRED',
                description: 'GOSI registration required for businesses with employees',
                requiredAction: 'Register with General Organization for Social Insurance'
            });
        }
        // Document Completeness Check (15 points)
        const hasRequiredDocs = compliance.sme.documents &&
            typeof compliance.sme.documents === 'object' &&
            Object.keys(compliance.sme.documents).length > 0;
        if (hasRequiredDocs) {
            score += 15;
        }
        else {
            issues.push({
                category: 'MEDIUM',
                type: 'DOCUMENTS_MISSING',
                description: 'Required business documents are missing',
                requiredAction: 'Upload all required business registration documents'
            });
        }
        // Generate recommendations
        const recommendations = this.generateRecommendations(issues, compliance);
        return {
            score: Math.min(score, maxScore),
            issues,
            recommendations,
            nextAuditDate: this.calculateNextAuditDate(issues.length)
        };
    }
    /**
     * Validate CR number with government API (mock implementation)
     */
    async validateCRWithGovernment(crNumber, smeId) {
        try {
            // This would integrate with actual Saudi government API
            // For now, we'll simulate the API call
            const startTime = Date.now();
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            const responseTime = Date.now() - startTime;
            // Mock validation logic
            const crValidation = validateCRNumber(crNumber);
            const isValid = crValidation.isValid && crNumber.length === 10;
            // Log the API call
            await this.logAPICall(smeId, 'CR_VALIDATION', isValid ? 'SUCCESS' : 'FAILED', { crNumber }, isValid ? undefined : 'Invalid CR number format', 'https://api.moci.gov.sa/cr/validate', responseTime);
            return isValid;
        }
        catch (error) {
            await this.logAPICall(smeId, 'CR_VALIDATION', 'FAILED', { crNumber }, error instanceof Error ? error.message : 'API call failed', 'https://api.moci.gov.sa/cr/validate');
            return false;
        }
    }
    /**
     * Generate compliance recommendations based on issues
     */
    generateRecommendations(issues, compliance) {
        const recommendations = [];
        const criticalIssues = issues.filter(i => i.category === 'CRITICAL');
        const highIssues = issues.filter(i => i.category === 'HIGH');
        if (criticalIssues.length > 0) {
            recommendations.push('🚨 Address critical compliance issues immediately to avoid business disruption');
            recommendations.push('📋 Focus on completing Commercial Registration and healthcare licensing first');
        }
        if (highIssues.length > 0) {
            recommendations.push('⚠️ Resolve high priority issues within 30 days');
        }
        if (!compliance.waslValidated) {
            recommendations.push('🏢 Complete address verification with WASL for government service access');
        }
        if (compliance.sme.healthcareProfile && !compliance.sme.healthcareProfile.cbahiAccreditationId) {
            recommendations.push('🏥 Consider CBAHI accreditation to enhance healthcare service credibility');
        }
        recommendations.push('📅 Schedule regular compliance reviews every 6 months');
        recommendations.push('📞 Contact BrainSAIT compliance team for personalized guidance');
        return recommendations;
    }
    /**
     * Calculate next audit date based on compliance score and issues
     */
    calculateNextAuditDate(issueCount) {
        const now = new Date();
        const months = issueCount && issueCount > 3 ? 3 : 6; // More frequent audits for non-compliant businesses
        const nextAudit = new Date(now);
        nextAudit.setMonth(nextAudit.getMonth() + months);
        return nextAudit;
    }
    /**
     * Log API calls to government services
     */
    async logAPICall(smeId, requestType, status, requestData, errorMessage, apiEndpoint, responseTime) {
        try {
            await prisma.saudiGovernmentAPILog.create({
                data: {
                    smeId,
                    apiEndpoint: apiEndpoint || 'INTERNAL',
                    requestType,
                    requestData: requestData ? JSON.stringify(requestData) : undefined,
                    responseData: undefined, // Would contain actual response data
                    status: status,
                    responseTime,
                    errorMessage
                }
            });
        }
        catch (error) {
            logger.error('Failed to log API call', { smeId, requestType, error });
        }
    }
    /**
     * Get compliance summary for dashboard
     */
    async getComplianceSummary(smeId) {
        const compliance = await prisma.saudiRegulatoryCompliance.findUnique({
            where: { smeId },
            include: {
                sme: {
                    include: {
                        healthcareProfile: true
                    }
                }
            }
        });
        if (!compliance) {
            return {
                score: 0,
                status: 'NOT_STARTED',
                criticalIssues: 5,
                nextAction: 'Start compliance process by adding Commercial Registration details'
            };
        }
        const complianceCheck = await this.performComplianceCheck(smeId);
        return {
            score: complianceCheck.score,
            status: complianceCheck.score >= 80 ? 'COMPLIANT' :
                complianceCheck.score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
            criticalIssues: complianceCheck.issues.filter(i => i.category === 'CRITICAL').length,
            nextAction: complianceCheck.issues[0]?.requiredAction || 'All requirements met',
            nextAuditDate: complianceCheck.nextAuditDate,
            lastUpdated: compliance.updatedAt
        };
    }
}
export const saudiComplianceService = new SaudiComplianceService();
//# sourceMappingURL=saudiComplianceService.js.map