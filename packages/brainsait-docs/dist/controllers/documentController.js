"use strict";
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { logger } = require('../utils/logger');
const { config } = require('../config/environment');
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
class DocumentController {
    constructor() {
        this.browser = null;
        this.templateCache = new Map();
        this.partialCache = new Map();
        this.governmentDataCache = new Map();
        this.complianceValidators = new Map();
        this.arabicNumeralMap = {
            '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
            '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
        };
        // Hijri calendar months in Arabic
        this.hijriMonths = [
            'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
            'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
        ];
        this.initializeTemplateEngine();
        this.initializeComplianceValidators();
    }
    /**
     * Initialize the template engine with custom helpers and partials
     * @private
     */
    initializeTemplateEngine() {
        // Register Arabic numeral conversion helper
        handlebars.registerHelper('arabicNumbers', (text) => {
            if (typeof text !== 'string' && typeof text !== 'number')
                return text;
            return String(text).replace(/\d/g, digit => this.arabicNumeralMap[digit] || digit);
        });
        // Register Hijri date helper
        handlebars.registerHelper('hijriDate', (gregorianDate) => {
            return this.convertToHijri(gregorianDate);
        });
        // Register Saudi currency formatter
        handlebars.registerHelper('saudiCurrency', (amount) => {
            if (typeof amount !== 'number')
                return amount;
            const formatted = new Intl.NumberFormat('ar-SA', {
                style: 'currency',
                currency: 'SAR',
                minimumFractionDigits: 2
            }).format(amount);
            return this.convertToArabicNumerals(formatted);
        });
        // Register compliance score helper
        handlebars.registerHelper('complianceScore', (data) => {
            return this.calculateComplianceScore(data);
        });
        // Register conditional Arabic/English helper
        handlebars.registerHelper('ifArabic', function (language, options) {
            return language === 'ar' ? options.fn(this) : options.inverse(this);
        });
        // Register RTL/LTR direction helper
        handlebars.registerHelper('textDirection', (language) => {
            return language === 'ar' ? 'rtl' : 'ltr';
        });
        // Register Saudi phone number formatter
        handlebars.registerHelper('saudiPhone', (phoneNumber) => {
            if (!phoneNumber)
                return '';
            const cleaned = phoneNumber.replace(/\D/g, '');
            if (cleaned.length === 10 && cleaned.startsWith('5')) {
                return this.convertToArabicNumerals(`+966 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`);
            }
            return this.convertToArabicNumerals(phoneNumber);
        });
        // Register Saudi ID/CR formatter
        handlebars.registerHelper('saudiId', (id) => {
            if (!id)
                return '';
            const cleaned = id.replace(/\D/g, '');
            if (cleaned.length === 10) {
                return this.convertToArabicNumerals(`${cleaned.slice(0, 1)}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`);
            }
            return this.convertToArabicNumerals(id);
        });
        // Register nested object access helper
        handlebars.registerHelper('get', (obj, path) => {
            return path.split('.').reduce((current, key) => current && current[key], obj);
        });
        // Register array iteration with Arabic indices
        handlebars.registerHelper('eachWithArabicIndex', function (array, options) {
            let result = '';
            if (Array.isArray(array)) {
                for (let i = 0; i < array.length; i++) {
                    const arabicIndex = this.convertToArabicNumerals(String(i + 1));
                    result += options.fn({
                        ...array[i],
                        arabicIndex,
                        index: i,
                        isFirst: i === 0,
                        isLast: i === array.length - 1
                    });
                }
            }
            return result;
        }.bind(this));
        logger.info('Template engine initialized with Saudi-specific helpers');
    }
    /**
     * Initialize compliance validators for different document types
     * @private
     */
    initializeComplianceValidators() {
        // Business Plan validator
        this.complianceValidators.set('business-plan', (data) => {
            const required = ['companyName', 'crNumber', 'vatNumber', 'nationalAddress', 'executiveSummary'];
            const missing = required.filter(field => !data[field]);
            return {
                isValid: missing.length === 0,
                missingFields: missing,
                score: Math.max(0, 100 - (missing.length * 20))
            };
        });
        // Feasibility Study validator
        this.complianceValidators.set('feasibility-study', (data) => {
            const required = ['projectName', 'marketAnalysis', 'technicalFeasibility', 'financialProjections'];
            const missing = required.filter(field => !data[field]);
            return {
                isValid: missing.length === 0,
                missingFields: missing,
                score: Math.max(0, 100 - (missing.length * 25))
            };
        });
        // Certificate validator
        this.complianceValidators.set('certificate', (data) => {
            const required = ['recipientName', 'programName', 'completionDate', 'certificateId'];
            const missing = required.filter(field => !data[field]);
            return {
                isValid: missing.length === 0,
                missingFields: missing,
                score: Math.max(0, 100 - (missing.length * 25))
            };
        });
        // Compliance Report validator
        this.complianceValidators.set('compliance-report', (data) => {
            const required = ['companyName', 'reportPeriod', 'complianceItems', 'overallScore'];
            const missing = required.filter(field => !data[field]);
            return {
                isValid: missing.length === 0,
                missingFields: missing,
                score: Math.max(0, 100 - (missing.length * 25))
            };
        });
        logger.info('Compliance validators initialized');
    }
    /**
     * Initialize Puppeteer browser with optimized settings
     * @private
     */
    async initializeBrowser() {
        if (!this.browser) {
            try {
                this.browser = await puppeteer.launch({
                    headless: 'new',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--allow-running-insecure-content'
                    ],
                    timeout: 60000
                });
                logger.info('Puppeteer browser initialized successfully');
            }
            catch (error) {
                logger.error('Failed to initialize Puppeteer browser:', error);
                throw new Error('Browser initialization failed');
            }
        }
    }
    /**
     * Convert Arabic/English text to Arabic numerals
     * @param {string} text - Text containing numbers
     * @returns {string} Text with Arabic numerals
     * @private
     */
    convertToArabicNumerals(text) {
        if (typeof text !== 'string')
            return String(text || '');
        return text.replace(/\d/g, digit => this.arabicNumeralMap[digit] || digit);
    }
    /**
     * Convert Gregorian date to Hijri date
     * @param {Date|string} gregorianDate - Gregorian date
     * @returns {string} Hijri date in Arabic
     * @private
     */
    convertToHijri(gregorianDate) {
        try {
            const date = new Date(gregorianDate);
            // Simplified Hijri conversion (in production, use a proper Hijri library)
            const hijriYear = Math.floor((date.getFullYear() - 622) * 1.030684);
            const hijriMonth = Math.floor(Math.random() * 12); // Simplified for demo
            const hijriDay = Math.floor(Math.random() * 29) + 1; // Simplified for demo
            const arabicDay = this.convertToArabicNumerals(String(hijriDay));
            const arabicYear = this.convertToArabicNumerals(String(hijriYear + 1400));
            return `${arabicDay} ${this.hijriMonths[hijriMonth]} ${arabicYear}هـ`;
        }
        catch (error) {
            logger.error('Hijri conversion failed:', error);
            return '';
        }
    }
    /**
     * Calculate compliance score based on document data
     * @param {Object} data - Document data
     * @returns {number} Compliance score (0-100)
     * @private
     */
    calculateComplianceScore(data) {
        let score = 100;
        const penalties = {
            missingCR: 20,
            missingVAT: 15,
            missingAddress: 10,
            missingLicense: 25,
            incompleteFinancials: 20
        };
        if (!data.crNumber)
            score -= penalties.missingCR;
        if (!data.vatNumber)
            score -= penalties.missingVAT;
        if (!data.nationalAddress)
            score -= penalties.missingAddress;
        if (!data.requiredLicenses || data.requiredLicenses.length === 0)
            score -= penalties.missingLicense;
        if (!data.financials || !data.financials.year1)
            score -= penalties.incompleteFinancials;
        return Math.max(0, score);
    }
    /**
     * Load and cache template with validation
     * @param {string} templateName - Template name
     * @param {string} language - Language code (ar/en)
     * @returns {Promise<Function>} Compiled template
     * @private
     */
    async loadTemplate(templateName, language = 'en') {
        const cacheKey = `${templateName}_${language}`;
        if (this.templateCache.has(cacheKey)) {
            logger.debug(`Template loaded from cache: ${cacheKey}`);
            return this.templateCache.get(cacheKey);
        }
        try {
            const templatePath = path.join(process.cwd(), 'templates', language, `${templateName}.hbs`);
            // Check if template exists
            await fs.access(templatePath);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            // Validate template syntax
            this.validateTemplate(templateContent, templateName);
            // Load partials if they exist
            await this.loadPartials(language);
            // Compile template
            const compiled = handlebars.compile(templateContent);
            // Cache compiled template
            this.templateCache.set(cacheKey, compiled);
            logger.info(`Template loaded and cached: ${cacheKey}`);
            return compiled;
        }
        catch (error) {
            logger.error(`Failed to load template ${templateName} (${language}):`, error);
            throw new Error(`Template loading failed: ${templateName}`);
        }
    }
    /**
     * Load and register template partials
     * @param {string} language - Language code
     * @private
     */
    async loadPartials(language) {
        const partialsCacheKey = `partials_${language}`;
        if (this.partialCache.has(partialsCacheKey)) {
            return;
        }
        try {
            const partialsDir = path.join(process.cwd(), 'templates', language, 'partials');
            try {
                const partialFiles = await fs.readdir(partialsDir);
                for (const file of partialFiles) {
                    if (file.endsWith('.hbs')) {
                        const partialName = path.basename(file, '.hbs');
                        const partialPath = path.join(partialsDir, file);
                        const partialContent = await fs.readFile(partialPath, 'utf-8');
                        handlebars.registerPartial(partialName, partialContent);
                        logger.debug(`Partial registered: ${partialName}`);
                    }
                }
                this.partialCache.set(partialsCacheKey, true);
            }
            catch (dirError) {
                // Partials directory doesn't exist - this is optional
                logger.debug(`No partials directory found for ${language}`);
            }
        }
        catch (error) {
            logger.error(`Failed to load partials for ${language}:`, error);
        }
    }
    /**
     * Validate template syntax and required variables
     * @param {string} templateContent - Template content
     * @param {string} templateName - Template name for logging
     * @private
     */
    validateTemplate(templateContent, templateName) {
        try {
            // Basic syntax validation by attempting compilation
            handlebars.compile(templateContent);
            // Check for required template variables based on template type
            const requiredVars = this.getRequiredTemplateVars(templateName);
            const missingVars = requiredVars.filter(varName => !templateContent.includes(`{{${varName}}`) &&
                !templateContent.includes(`{{#${varName}}}`));
            if (missingVars.length > 0) {
                logger.warn(`Template ${templateName} missing required variables:`, missingVars);
            }
        }
        catch (error) {
            throw new Error(`Template validation failed for ${templateName}: ${error.message}`);
        }
    }
    /**
     * Get required variables for each template type
     * @param {string} templateName - Template name
     * @returns {Array<string>} Required variable names
     * @private
     */
    getRequiredTemplateVars(templateName) {
        const requirements = {
            'business-plan': ['companyName', 'executiveSummary', 'hijriDate', 'gregorianDate'],
            'feasibility-study': ['projectName', 'marketAnalysis', 'technicalFeasibility'],
            'certificate': ['recipientName', 'programName', 'completionDate'],
            'compliance-report': ['companyName', 'reportPeriod', 'overallScore']
        };
        return requirements[templateName] || [];
    }
    /**
     * Transform and enrich data for template rendering
     * @param {Object} data - Raw document data
     * @param {string} templateName - Template name
     * @param {string} language - Language code
     * @returns {Promise<Object>} Transformed data
     * @private
     */
    async transformData(data, templateName, language) {
        try {
            const transformedData = { ...data };
            // Add metadata
            transformedData._meta = {
                language,
                isRTL: language === 'ar',
                generatedAt: new Date().toISOString(),
                templateName,
                documentId: this.generateDocumentId(),
                version: '2.0.0'
            };
            // Add current dates
            const now = new Date();
            transformedData.currentDate = now.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
            transformedData.hijriDate = this.convertToHijri(now);
            transformedData.gregorianDate = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            // Transform numerical values to Arabic if needed
            if (language === 'ar') {
                transformedData.arabicNumerals = true;
                this.convertDataNumerals(transformedData);
            }
            // Add compliance data
            if (data.companyName && data.crNumber) {
                transformedData.complianceData = await this.fetchComplianceData(data.crNumber);
            }
            // Add government data if available
            if (data.crNumber) {
                transformedData.governmentData = await this.fetchGovernmentData(data.crNumber);
            }
            // Calculate compliance score
            transformedData.complianceScore = this.calculateComplianceScore(transformedData);
            // Add QR code data
            transformedData.qrCodeData = this.generateQRData(transformedData);
            logger.info(`Data transformed for template: ${templateName}, language: ${language}`);
            return transformedData;
        }
        catch (error) {
            logger.error('Data transformation failed:', error);
            throw new Error('Data transformation failed');
        }
    }
    /**
     * Convert numerical values in data to Arabic numerals
     * @param {Object} data - Data object
     * @private
     */
    convertDataNumerals(data) {
        const convertValue = (value) => {
            if (typeof value === 'number') {
                return this.convertToArabicNumerals(String(value));
            }
            if (typeof value === 'string' && /\d/.test(value)) {
                return this.convertToArabicNumerals(value);
            }
            if (typeof value === 'object' && value !== null) {
                for (const key in value) {
                    value[key] = convertValue(value[key]);
                }
            }
            return value;
        };
        for (const key in data) {
            if (key !== '_meta' && data.hasOwnProperty(key)) {
                data[key] = convertValue(data[key]);
            }
        }
    }
    /**
     * Generate unique document ID
     * @returns {string} Document ID
     * @private
     */
    generateDocumentId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `BS_${timestamp}_${random}`.toUpperCase();
    }
    /**
     * Generate QR code data for document
     * @param {Object} data - Document data
     * @returns {string} QR code data string
     * @private
     */
    generateQRData(data) {
        const qrData = {
            documentId: data._meta?.documentId,
            companyName: data.companyName,
            generatedAt: data._meta?.generatedAt,
            template: data._meta?.templateName,
            checksum: this.calculateChecksum(data)
        };
        return JSON.stringify(qrData);
    }
    /**
     * Calculate checksum for document data
     * @param {Object} data - Document data
     * @returns {string} Checksum
     * @private
     */
    calculateChecksum(data) {
        const content = JSON.stringify(data, Object.keys(data).sort());
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
    /**
     * Fetch compliance data from cache or external source
     * @param {string} crNumber - Commercial registration number
     * @returns {Promise<Object>} Compliance data
     * @private
     */
    async fetchComplianceData(crNumber) {
        const cacheKey = `compliance_${crNumber}`;
        if (this.governmentDataCache.has(cacheKey)) {
            const cached = this.governmentDataCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
                return cached.data;
            }
        }
        try {
            // Mock compliance data (replace with actual API calls)
            const complianceData = {
                status: 'active',
                lastUpdated: new Date().toISOString(),
                complianceScore: 85,
                issues: [],
                licenses: [
                    {
                        type: 'Commercial Registration',
                        number: crNumber,
                        status: 'valid',
                        expiryDate: '2024-12-31'
                    }
                ]
            };
            // Cache the data
            this.governmentDataCache.set(cacheKey, {
                data: complianceData,
                timestamp: Date.now()
            });
            return complianceData;
        }
        catch (error) {
            logger.error('Failed to fetch compliance data:', error);
            return { status: 'unknown', error: error.message };
        }
    }
    /**
     * Fetch government data from APIs
     * @param {string} crNumber - Commercial registration number
     * @returns {Promise<Object>} Government data
     * @private
     */
    async fetchGovernmentData(crNumber) {
        const cacheKey = `gov_data_${crNumber}`;
        if (this.governmentDataCache.has(cacheKey)) {
            const cached = this.governmentDataCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 7200000) { // 2 hour cache
                return cached.data;
            }
        }
        try {
            // Mock government API data (replace with actual API integrations)
            const governmentData = {
                commercialRecord: {
                    number: crNumber,
                    companyNameAr: 'شركة التقنية المتطورة المحدودة',
                    companyNameEn: 'Advanced Technology Company Ltd',
                    status: 'active',
                    registrationDate: '2020-01-15',
                    expiryDate: '2025-01-15'
                },
                taxation: {
                    vatNumber: `3${crNumber}03`,
                    status: 'registered',
                    lastFiling: '2024-01-15'
                },
                zakat: {
                    status: 'compliant',
                    lastPayment: '2024-01-15'
                },
                socialInsurance: {
                    status: 'active',
                    registeredEmployees: 15
                }
            };
            // Cache the data
            this.governmentDataCache.set(cacheKey, {
                data: governmentData,
                timestamp: Date.now()
            });
            return governmentData;
        }
        catch (error) {
            logger.error('Failed to fetch government data:', error);
            return { error: error.message };
        }
    }
    /**
     * Generate PDF with advanced options
     * @param {Object} options - PDF generation options
     * @returns {Promise<Buffer>} PDF buffer
     * @private
     */
    async generatePDF(options) {
        const { html, format = 'A4', orientation = 'portrait', language = 'en', margins = { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' }, watermark = null, digitalSignature = null } = options;
        await this.initializeBrowser();
        let page = null;
        try {
            page = await this.browser.newPage();
            // Set viewport for proper rendering
            await page.setViewport({
                width: format === 'A4' ? 794 : 816,
                height: format === 'A4' ? 1123 : 1056,
                deviceScaleFactor: 2
            });
            // Load Arabic fonts if needed
            if (language === 'ar') {
                await page.addStyleTag({
                    content: `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
          `
                });
            }
            // Add watermark if specified
            let finalHtml = html;
            if (watermark) {
                finalHtml = this.addWatermark(html, watermark);
            }
            // Set content and wait for fonts to load
            await page.setContent(finalHtml, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 60000
            });
            // Wait for fonts to load
            await page.evaluateHandle('document.fonts.ready');
            // PDF options
            const pdfOptions = {
                format,
                landscape: orientation === 'landscape',
                margin: margins,
                printBackground: true,
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                timeout: 60000
            };
            // Generate PDF
            const pdfBuffer = await page.pdf(pdfOptions);
            // Add digital signature if specified
            if (digitalSignature) {
                return await this.addDigitalSignature(pdfBuffer, digitalSignature);
            }
            logger.info('PDF generated successfully', {
                size: pdfBuffer.length,
                format,
                orientation,
                language
            });
            return pdfBuffer;
        }
        catch (error) {
            logger.error('PDF generation failed:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    /**
     * Add watermark to HTML content
     * @param {string} html - Original HTML
     * @param {Object} watermark - Watermark configuration
     * @returns {string} HTML with watermark
     * @private
     */
    addWatermark(html, watermark) {
        const watermarkStyle = `
      <style>
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          color: rgba(0, 0, 0, 0.1);
          font-weight: bold;
          z-index: -1;
          user-select: none;
          pointer-events: none;
          font-family: 'Arial', sans-serif;
        }
      </style>
    `;
        const watermarkDiv = `
      <div class="watermark">${watermark.text || 'BrainSAIT'}</div>
    `;
        return html.replace('</head>', `${watermarkStyle}</head>`).replace('<body>', `<body>${watermarkDiv}`);
    }
    /**
     * Add digital signature to PDF (placeholder implementation)
     * @param {Buffer} pdfBuffer - Original PDF buffer
     * @param {Object} signature - Signature configuration
     * @returns {Promise<Buffer>} Signed PDF buffer
     * @private
     */
    async addDigitalSignature(pdfBuffer, signature) {
        // This is a placeholder implementation
        // In production, use a proper PDF signing library like node-signpdf
        logger.info('Digital signature applied (placeholder implementation)');
        return pdfBuffer;
    }
    /**
     * Validate document data against template requirements
     * @param {Object} data - Document data
     * @param {string} templateName - Template name
     * @returns {Object} Validation result
     */
    validateDocumentData(data, templateName) {
        try {
            const validator = this.complianceValidators.get(templateName);
            if (!validator) {
                return {
                    isValid: true,
                    score: 100,
                    warnings: [`No specific validator for template: ${templateName}`]
                };
            }
            const result = validator(data);
            logger.info(`Document validation completed for ${templateName}`, {
                isValid: result.isValid,
                score: result.score,
                missingFields: result.missingFields
            });
            return result;
        }
        catch (error) {
            logger.error('Document validation failed:', error);
            return {
                isValid: false,
                score: 0,
                error: error.message
            };
        }
    }
    /**
     * Generate single document
     * @param {Object} options - Document generation options
     * @returns {Promise<Buffer>} Generated document buffer
     */
    async generateDocument(options) {
        const { templateName, data, language = 'en', format = 'A4', orientation = 'portrait', watermark = null, digitalSignature = null, validate = true } = options;
        try {
            logger.info(`Starting document generation: ${templateName} (${language})`);
            // Validate data if requested
            if (validate) {
                const validation = this.validateDocumentData(data, templateName);
                if (!validation.isValid) {
                    throw new Error(`Document validation failed: ${validation.missingFields?.join(', ')}`);
                }
            }
            // Load template
            const template = await this.loadTemplate(templateName, language);
            // Transform data
            const transformedData = await this.transformData(data, templateName, language);
            // Render HTML
            const html = template(transformedData);
            // Generate PDF
            const pdfBuffer = await this.generatePDF({
                html,
                format,
                orientation,
                language,
                watermark,
                digitalSignature
            });
            logger.info(`Document generated successfully: ${templateName}`, {
                size: pdfBuffer.length,
                documentId: transformedData._meta.documentId
            });
            return {
                buffer: pdfBuffer,
                documentId: transformedData._meta.documentId,
                metadata: transformedData._meta
            };
        }
        catch (error) {
            logger.error(`Document generation failed for ${templateName}:`, error);
            throw new Error(`Document generation failed: ${error.message}`);
        }
    }
    /**
     * Generate multiple documents in batch
     * @param {Array} documentRequests - Array of document generation requests
     * @param {Object} options - Batch options
     * @returns {Promise<Array>} Array of generated documents
     */
    async generateBatchDocuments(documentRequests, options = {}) {
        const { concurrent = 3, validateAll = true } = options;
        try {
            logger.info(`Starting batch document generation: ${documentRequests.length} documents`);
            const results = [];
            const errors = [];
            // Process documents in batches to prevent memory issues
            for (let i = 0; i < documentRequests.length; i += concurrent) {
                const batch = documentRequests.slice(i, i + concurrent);
                const batchPromises = batch.map(async (request, index) => {
                    try {
                        const result = await this.generateDocument({
                            ...request,
                            validate: validateAll
                        });
                        return {
                            index: i + index,
                            success: true,
                            result
                        };
                    }
                    catch (error) {
                        logger.error(`Batch document generation failed at index ${i + index}:`, error);
                        return {
                            index: i + index,
                            success: false,
                            error: error.message,
                            templateName: request.templateName
                        };
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(result => {
                    if (result.success) {
                        results.push(result.result);
                    }
                    else {
                        errors.push(result);
                    }
                });
                // Small delay between batches to prevent overwhelming the system
                if (i + concurrent < documentRequests.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            logger.info(`Batch document generation completed`, {
                total: documentRequests.length,
                successful: results.length,
                failed: errors.length
            });
            return {
                results,
                errors,
                summary: {
                    total: documentRequests.length,
                    successful: results.length,
                    failed: errors.length
                }
            };
        }
        catch (error) {
            logger.error('Batch document generation failed:', error);
            throw new Error(`Batch generation failed: ${error.message}`);
        }
    }
    /**
     * Generate certificate with enhanced features
     * @param {Object} data - Certificate data
     * @param {string} language - Language code
     * @returns {Promise<Buffer>} Certificate PDF buffer
     */
    async generateCertificate(data, language = 'en') {
        return this.generateDocument({
            templateName: 'certificate',
            data: {
                ...data,
                certificateId: data.certificateId || this.generateDocumentId(),
                issueDate: data.issueDate || new Date().toISOString()
            },
            language,
            format: 'A4',
            orientation: 'landscape',
            watermark: {
                text: language === 'ar' ? 'برين سايت' : 'BrainSAIT'
            }
        });
    }
    /**
     * Generate business plan with comprehensive validation
     * @param {Object} data - Business plan data
     * @param {string} language - Language code
     * @returns {Promise<Buffer>} Business plan PDF buffer
     */
    async generateBusinessPlan(data, language = 'en') {
        // Enhance data with Saudi-specific calculations
        const enhancedData = {
            ...data,
            saudiMarketData: await this.fetchSaudiMarketData(data.industry),
            complianceRequirements: this.getSaudiComplianceRequirements(data.businessType),
            financialProjections: this.calculateSaudiFinancials(data.financials)
        };
        return this.generateDocument({
            templateName: 'business-plan',
            data: enhancedData,
            language,
            format: 'A4',
            orientation: 'portrait',
            validate: true
        });
    }
    /**
     * Generate compliance report with real-time data
     * @param {Object} data - Compliance data
     * @param {string} language - Language code
     * @returns {Promise<Buffer>} Compliance report PDF buffer
     */
    async generateComplianceReport(data, language = 'en') {
        const enhancedData = {
            ...data,
            complianceScore: this.calculateComplianceScore(data),
            governmentData: await this.fetchGovernmentData(data.crNumber),
            recommendations: this.generateComplianceRecommendations(data)
        };
        return this.generateDocument({
            templateName: 'compliance-report',
            data: enhancedData,
            language,
            format: 'A4',
            orientation: 'portrait'
        });
    }
    /**
     * Fetch Saudi market data (mock implementation)
     * @param {string} industry - Industry type
     * @returns {Promise<Object>} Market data
     * @private
     */
    async fetchSaudiMarketData(industry) {
        // Mock implementation - replace with actual market data API
        return {
            marketSize: '2.5 billion SAR',
            growthRate: '8.5%',
            competitorCount: 15,
            marketTrends: ['Digital transformation', 'Healthcare innovation', 'AI adoption']
        };
    }
    /**
     * Get Saudi compliance requirements by business type
     * @param {string} businessType - Type of business
     * @returns {Array} Compliance requirements
     * @private
     */
    getSaudiComplianceRequirements(businessType) {
        const requirements = {
            'healthcare': [
                'Ministry of Health License',
                'Saudi Food and Drug Authority Registration',
                'Saudi Patient Safety Center Certification',
                'Saudi Commission for Health Specialties Registration'
            ],
            'fintech': [
                'Saudi Central Bank License',
                'Capital Market Authority Registration',
                'Anti-Money Laundering Compliance',
                'Data Protection Compliance'
            ],
            'default': [
                'Commercial Registration',
                'Municipal License',
                'Zakat and Tax Registration',
                'Social Insurance Registration'
            ]
        };
        return requirements[businessType] || requirements.default;
    }
    /**
     * Calculate Saudi-specific financial projections
     * @param {Object} financials - Raw financial data
     * @returns {Object} Enhanced financial projections
     * @private
     */
    calculateSaudiFinancials(financials) {
        if (!financials)
            return {};
        const zakatRate = 0.025; // 2.5% Zakat rate
        const vatRate = 0.15; // 15% VAT rate
        return {
            ...financials,
            zakatObligations: {
                year1: Math.round(financials.year1?.netProfit * zakatRate) || 0,
                year2: Math.round(financials.year2?.netProfit * zakatRate) || 0,
                year3: Math.round(financials.year3?.netProfit * zakatRate) || 0
            },
            vatObligations: {
                year1: Math.round(financials.year1?.revenue * vatRate) || 0,
                year2: Math.round(financials.year2?.revenue * vatRate) || 0,
                year3: Math.round(financials.year3?.revenue * vatRate) || 0
            }
        };
    }
    /**
     * Generate compliance recommendations based on data
     * @param {Object} data - Compliance data
     * @returns {Array} Recommendations
     * @private
     */
    generateComplianceRecommendations(data) {
        const recommendations = [];
        const score = this.calculateComplianceScore(data);
        if (score < 70) {
            recommendations.push('Immediate action required to improve compliance score');
        }
        if (!data.crNumber) {
            recommendations.push('Obtain valid Commercial Registration');
        }
        if (!data.vatNumber) {
            recommendations.push('Register for VAT with Zakat, Tax and Customs Authority');
        }
        if (!data.requiredLicenses?.length) {
            recommendations.push('Obtain all required industry-specific licenses');
        }
        return recommendations;
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            this.templateCache.clear();
            this.partialCache.clear();
            this.governmentDataCache.clear();
            logger.info('Document controller cleanup completed');
        }
        catch (error) {
            logger.error('Document controller cleanup failed:', error);
        }
    }
}
module.exports = DocumentController;
//# sourceMappingURL=documentController.js.map