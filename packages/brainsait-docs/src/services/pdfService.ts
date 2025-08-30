import puppeteer, { Browser, Page } from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';

import { logger } from '../utils/logger';
import { config } from '../config/environment';

export interface PDFGenerationOptions {
  template: string;
  data: any;
  language?: string;
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
  scale?: number;
}

export class PDFService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      try {
        this.browser = await puppeteer.launch({
          headless: config.puppeteer.headless,
          executablePath: config.puppeteer.executablePath,
          args: config.puppeteer.args,
        });
        logger.info('Puppeteer browser initialized');
      } catch (error) {
        logger.error('Failed to initialize Puppeteer browser', error);
        throw new Error('PDF service initialization failed');
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Puppeteer browser closed');
    }
  }

  async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    await this.initialize();

    if (!this.browser) {
      throw new Error('PDF service not initialized');
    }

    let page: Page | null = null;

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
      } as const;

      const pdfBuffer = await page.pdf(pdfOptions);

      logger.info('PDF generated successfully', {
        template: options.template,
        language: options.language,
        size: pdfBuffer.length,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error('Failed to generate PDF', {
        template: options.template,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('PDF generation failed');
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async renderTemplate(options: PDFGenerationOptions): Promise<string> {
    const { template, data, language = 'en' } = options;

    try {
      // Load template file
      const templatePath = path.join(
        config.templates.basePath,
        language,
        `${template}.hbs`
      );
      
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Register common helpers
      this.registerHandlebarsHelpers();

      // Compile template
      const compiledTemplate = handlebars.compile(templateContent);

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
    } catch (error) {
      logger.error('Failed to render template', {
        template,
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Template rendering failed');
    }
  }

  private registerHandlebarsHelpers(): void {
    // Date formatting helper
    handlebars.registerHelper('formatDate', function (date: string | Date, format?: string) {
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
    handlebars.registerHelper('formatCurrency', function (amount: number, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Number formatting helper
    handlebars.registerHelper('formatNumber', function (number: number) {
      return new Intl.NumberFormat().format(number);
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', function (arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(options) : options.inverse(options);
    });

    // Loop helper with index
    handlebars.registerHelper('eachWithIndex', function (array: any[], options: any) {
      let result = '';
      for (let i = 0; i < array.length; i++) {
        result += options.fn({ ...array[i], index: i, isFirst: i === 0, isLast: i === array.length - 1 });
      }
      return result;
    });

    // QR code helper
    handlebars.registerHelper('qrCode', async function (data: string, size = 100) {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
        });
        return `<img src="${qrCodeDataURL}" width="${size}" height="${size}" alt="QR Code" />`;
      } catch (error) {
        logger.error('Failed to generate QR code', error);
        return '';
      }
    });

    // Truncate text helper
    handlebars.registerHelper('truncate', function (text: string, length: number) {
      if (text.length <= length) return text;
      return text.slice(0, length) + '...';
    });

    // Math helpers
    handlebars.registerHelper('add', function (a: number, b: number) {
      return a + b;
    });

    handlebars.registerHelper('subtract', function (a: number, b: number) {
      return a - b;
    });

    handlebars.registerHelper('multiply', function (a: number, b: number) {
      return a * b;
    });

    handlebars.registerHelper('divide', function (a: number, b: number) {
      return b !== 0 ? a / b : 0;
    });

    // Percentage helper
    handlebars.registerHelper('percentage', function (value: number, total: number) {
      return total !== 0 ? Math.round((value / total) * 100) : 0;
    });
  }

  // Generate specific document types
  async generateCertificate(data: any, language = 'en'): Promise<Buffer> {
    return this.generatePDF({
      template: 'certificate',
      data,
      language,
      format: 'A4',
      orientation: 'landscape',
      printBackground: true,
    });
  }

  async generateReport(data: any, language = 'en'): Promise<Buffer> {
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

  async generateInvoice(data: any, language = 'en'): Promise<Buffer> {
    return this.generatePDF({
      template: 'invoice',
      data,
      language,
      format: 'A4',
      orientation: 'portrait',
      printBackground: true,
    });
  }

  async generateProgramSummary(data: any, language = 'en'): Promise<Buffer> {
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

// Create singleton instance
export const pdfService = new PDFService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pdfService.close();
});

process.on('SIGINT', async () => {
  await pdfService.close();
});