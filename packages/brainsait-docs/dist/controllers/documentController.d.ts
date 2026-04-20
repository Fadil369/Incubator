export = DocumentController;
/**
 * Enhanced Document Service Controller for Saudi Healthcare SME Platform
 *
 * Features:
 * - Advanced Template Management with caching and validation
 * - Saudi-specific functionality (Hijri calendar, Arabic numerals, regulatory compliance)
 * - Multi-language support (Arabic RTL and English LTR)
 * - Enhanced PDF generation with digital signatures and watermarking
 * - Data processing pipeline with validation and transformation
 * - Government API integration and caching
 * - Batch document generation
 * - Performance optimization and comprehensive error handling
 *
 * @author BrainSAIT Development Team
 * @version 2.0.0
 */
declare class DocumentController {
    browser: puppeteer.Browser | null;
    templateCache: Map<any, any>;
    partialCache: Map<any, any>;
    governmentDataCache: Map<any, any>;
    complianceValidators: Map<any, any>;
    arabicNumeralMap: {
        '0': string;
        '1': string;
        '2': string;
        '3': string;
        '4': string;
        '5': string;
        '6': string;
        '7': string;
        '8': string;
        '9': string;
    };
    hijriMonths: string[];
    /**
     * Initialize the template engine with custom helpers and partials
     * @private
     */
    private initializeTemplateEngine;
    /**
     * Initialize compliance validators for different document types
     * @private
     */
    private initializeComplianceValidators;
    /**
     * Initialize Puppeteer browser with optimized settings
     * @private
     */
    private initializeBrowser;
    /**
     * Convert Arabic/English text to Arabic numerals
     * @param {string} text - Text containing numbers
     * @returns {string} Text with Arabic numerals
     * @private
     */
    private convertToArabicNumerals;
    /**
     * Convert Gregorian date to Hijri date
     * @param {Date|string} gregorianDate - Gregorian date
     * @returns {string} Hijri date in Arabic
     * @private
     */
    private convertToHijri;
    /**
     * Calculate compliance score based on document data
     * @param {Object} data - Document data
     * @returns {number} Compliance score (0-100)
     * @private
     */
    private calculateComplianceScore;
    /**
     * Load and cache template with validation
     * @param {string} templateName - Template name
     * @param {string} language - Language code (ar/en)
     * @returns {Promise<Function>} Compiled template
     * @private
     */
    private loadTemplate;
    /**
     * Load and register template partials
     * @param {string} language - Language code
     * @private
     */
    private loadPartials;
    /**
     * Validate template syntax and required variables
     * @param {string} templateContent - Template content
     * @param {string} templateName - Template name for logging
     * @private
     */
    private validateTemplate;
    /**
     * Get required variables for each template type
     * @param {string} templateName - Template name
     * @returns {Array<string>} Required variable names
     * @private
     */
    private getRequiredTemplateVars;
    /**
     * Transform and enrich data for template rendering
     * @param {Object} data - Raw document data
     * @param {string} templateName - Template name
     * @param {string} language - Language code
     * @returns {Promise<Object>} Transformed data
     * @private
     */
    private transformData;
    /**
     * Convert numerical values in data to Arabic numerals
     * @param {Object} data - Data object
     * @private
     */
    private convertDataNumerals;
    /**
     * Generate unique document ID
     * @returns {string} Document ID
     * @private
     */
    private generateDocumentId;
    /**
     * Generate QR code data for document
     * @param {Object} data - Document data
     * @returns {string} QR code data string
     * @private
     */
    private generateQRData;
    /**
     * Calculate checksum for document data
     * @param {Object} data - Document data
     * @returns {string} Checksum
     * @private
     */
    private calculateChecksum;
    /**
     * Fetch compliance data from cache or external source
     * @param {string} crNumber - Commercial registration number
     * @returns {Promise<Object>} Compliance data
     * @private
     */
    private fetchComplianceData;
    /**
     * Fetch government data from APIs
     * @param {string} crNumber - Commercial registration number
     * @returns {Promise<Object>} Government data
     * @private
     */
    private fetchGovernmentData;
    /**
     * Generate PDF with advanced options
     * @param {Object} options - PDF generation options
     * @returns {Promise<Buffer>} PDF buffer
     * @private
     */
    private generatePDF;
    /**
     * Add watermark to HTML content
     * @param {string} html - Original HTML
     * @param {Object} watermark - Watermark configuration
     * @returns {string} HTML with watermark
     * @private
     */
    private addWatermark;
    /**
     * Add digital signature to PDF (placeholder implementation)
     * @param {Buffer} pdfBuffer - Original PDF buffer
     * @param {Object} signature - Signature configuration
     * @returns {Promise<Buffer>} Signed PDF buffer
     * @private
     */
    private addDigitalSignature;
    /**
     * Validate document data against template requirements
     * @param {Object} data - Document data
     * @param {string} templateName - Template name
     * @returns {Object} Validation result
     */
    validateDocumentData(data: Object, templateName: string): Object;
    /**
     * Generate single document
     * @param {Object} options - Document generation options
     * @returns {Promise<Buffer>} Generated document buffer
     */
    generateDocument(options: Object): Promise<Buffer>;
    /**
     * Generate multiple documents in batch
     * @param {Array} documentRequests - Array of document generation requests
     * @param {Object} options - Batch options
     * @returns {Promise<Array>} Array of generated documents
     */
    generateBatchDocuments(documentRequests: any[], options?: Object): Promise<any[]>;
    /**
     * Generate certificate with enhanced features
     * @param {Object} data - Certificate data
     * @param {string} language - Language code
     * @returns {Promise<Buffer>} Certificate PDF buffer
     */
    generateCertificate(data: Object, language?: string): Promise<Buffer>;
    /**
     * Generate business plan with comprehensive validation
     * @param {Object} data - Business plan data
     * @param {string} language - Language code
     * @returns {Promise<Buffer>} Business plan PDF buffer
     */
    generateBusinessPlan(data: Object, language?: string): Promise<Buffer>;
    /**
     * Generate compliance report with real-time data
     * @param {Object} data - Compliance data
     * @param {string} language - Language code
     * @returns {Promise<Buffer>} Compliance report PDF buffer
     */
    generateComplianceReport(data: Object, language?: string): Promise<Buffer>;
    /**
     * Fetch Saudi market data (mock implementation)
     * @param {string} industry - Industry type
     * @returns {Promise<Object>} Market data
     * @private
     */
    private fetchSaudiMarketData;
    /**
     * Get Saudi compliance requirements by business type
     * @param {string} businessType - Type of business
     * @returns {Array} Compliance requirements
     * @private
     */
    private getSaudiComplianceRequirements;
    /**
     * Calculate Saudi-specific financial projections
     * @param {Object} financials - Raw financial data
     * @returns {Object} Enhanced financial projections
     * @private
     */
    private calculateSaudiFinancials;
    /**
     * Generate compliance recommendations based on data
     * @param {Object} data - Compliance data
     * @returns {Array} Recommendations
     * @private
     */
    private generateComplianceRecommendations;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
import puppeteer = require("puppeteer");
//# sourceMappingURL=documentController.d.ts.map