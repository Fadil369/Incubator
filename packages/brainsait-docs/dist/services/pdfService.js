"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfService = exports.PDFService = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const handlebars_1 = __importDefault(require("handlebars"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = require("../utils/logger");
const environment_1 = require("../config/environment");
class PDFService {
    browser = null;
    async initialize() {
        if (!this.browser) {
            try {
                this.browser = await puppeteer_1.default.launch({
                    headless: environment_1.config.puppeteer.headless,
                    executablePath: environment_1.config.puppeteer.executablePath,
                    args: environment_1.config.puppeteer.args,
                });
                logger_1.logger.info('Puppeteer browser initialized');
            }
            catch (error) {
                logger_1.logger.error('Failed to initialize Puppeteer browser', error);
                throw new Error('PDF service initialization failed');
            }
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            logger_1.logger.info('Puppeteer browser closed');
        }
    }
    async generatePDF(options) {
        await this.initialize();
        if (!this.browser) {
            throw new Error('PDF service not initialized');
        }
        let page = null;
        try {
            page = await this.browser.newPage();
            // Load and compile template
            const html = await this.renderTemplate(options);
            // Set content
            await page.setContent(html, {
                waitUntil: ['networkidle0'],
                timeout: 30000,
            });
            // Generate PDF
            const pdfOptions = {
                format: options.format || 'A4',
                landscape: options.orientation === 'landscape',
                margin: options.margins || {
                    top: '1cm',
                    bottom: '1cm',
                    left: '1cm',
                    right: '1cm',
                },
                printBackground: options.printBackground !== false,
                displayHeaderFooter: options.displayHeaderFooter || false,
                headerTemplate: options.headerTemplate || '',
                footerTemplate: options.footerTemplate || '',
                scale: options.scale || 1,
                preferCSSPageSize: true,
            };
            const pdfBuffer = await page.pdf(pdfOptions);
            logger_1.logger.info('PDF generated successfully', {
                template: options.template,
                language: options.language,
                size: pdfBuffer.length,
            });
            return Buffer.from(pdfBuffer);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate PDF', {
                template: options.template,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('PDF generation failed');
        }
        finally {
            if (page) {
                await page.close();
            }
        }
    }
    async renderTemplate(options) {
        const { template, data, language = 'en' } = options;
        try {
            // Load template file
            const templatePath = path_1.default.join(environment_1.config.templates.basePath, language, `${template}.hbs`);
            const templateContent = await promises_1.default.readFile(templatePath, 'utf-8');
            // Register common helpers
            this.registerHandlebarsHelpers();
            // Compile template
            const compiledTemplate = handlebars_1.default.compile(templateContent);
            // Prepare data with additional context
            const templateData = {
                ...data,
                _meta: {
                    language,
                    isRTL: language === 'ar',
                    generatedAt: new Date().toISOString(),
                },
            };
            // Render HTML
            const html = compiledTemplate(templateData);
            return html;
        }
        catch (error) {
            logger_1.logger.error('Failed to render template', {
                template,
                language,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new Error('Template rendering failed');
        }
    }
    registerHandlebarsHelpers() {
        // Date formatting helper
        handlebars_1.default.registerHelper('formatDate', function (date, format) {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (format === 'short') {
                return dateObj.toLocaleDateString();
            }
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        });
        // Currency formatting helper
        handlebars_1.default.registerHelper('formatCurrency', function (amount, currency = 'USD') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
            }).format(amount);
        });
        // Number formatting helper
        handlebars_1.default.registerHelper('formatNumber', function (number) {
            return new Intl.NumberFormat().format(number);
        });
        // Conditional helper
        handlebars_1.default.registerHelper('ifEquals', function (arg1, arg2, options) {
            return arg1 === arg2 ? options.fn(options) : options.inverse(options);
        });
        // Loop helper with index
        handlebars_1.default.registerHelper('eachWithIndex', function (array, options) {
            let result = '';
            for (let i = 0; i < array.length; i++) {
                result += options.fn({ ...array[i], index: i, isFirst: i === 0, isLast: i === array.length - 1 });
            }
            return result;
        });
        // QR code helper
        handlebars_1.default.registerHelper('qrCode', async function (data, size = 100) {
            try {
                const qrCodeDataURL = await qrcode_1.default.toDataURL(data, {
                    width: size,
                    margin: 2,
                });
                return `<img src="${qrCodeDataURL}" width="${size}" height="${size}" alt="QR Code" />`;
            }
            catch (error) {
                logger_1.logger.error('Failed to generate QR code', error);
                return '';
            }
        });
        // Truncate text helper
        handlebars_1.default.registerHelper('truncate', function (text, length) {
            if (text.length <= length)
                return text;
            return text.slice(0, length) + '...';
        });
        // Math helpers
        handlebars_1.default.registerHelper('add', function (a, b) {
            return a + b;
        });
        handlebars_1.default.registerHelper('subtract', function (a, b) {
            return a - b;
        });
        handlebars_1.default.registerHelper('multiply', function (a, b) {
            return a * b;
        });
        handlebars_1.default.registerHelper('divide', function (a, b) {
            return b !== 0 ? a / b : 0;
        });
        // Percentage helper
        handlebars_1.default.registerHelper('percentage', function (value, total) {
            return total !== 0 ? Math.round((value / total) * 100) : 0;
        });
    }
    // Generate specific document types
    async generateCertificate(data, language = 'en') {
        return this.generatePDF({
            template: 'certificate',
            data,
            language,
            format: 'A4',
            orientation: 'landscape',
            printBackground: true,
        });
    }
    async generateReport(data, language = 'en') {
        return this.generatePDF({
            template: 'report',
            data,
            language,
            format: 'A4',
            orientation: 'portrait',
            displayHeaderFooter: true,
            headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">BrainSAIT Platform Report</div>',
            footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        });
    }
    async generateInvoice(data, language = 'en') {
        return this.generatePDF({
            template: 'invoice',
            data,
            language,
            format: 'A4',
            orientation: 'portrait',
            printBackground: true,
        });
    }
    async generateProgramSummary(data, language = 'en') {
        return this.generatePDF({
            template: 'program-summary',
            data,
            language,
            format: 'A4',
            orientation: 'portrait',
            displayHeaderFooter: true,
        });
    }
}
exports.PDFService = PDFService;
// Create singleton instance
exports.pdfService = new PDFService();
// Graceful shutdown
process.on('SIGTERM', async () => {
    await exports.pdfService.close();
});
process.on('SIGINT', async () => {
    await exports.pdfService.close();
});
//# sourceMappingURL=pdfService.js.map