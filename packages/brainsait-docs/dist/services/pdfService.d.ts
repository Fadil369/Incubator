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
export declare class PDFService {
    private browser;
    initialize(): Promise<void>;
    close(): Promise<void>;
    generatePDF(options: PDFGenerationOptions): Promise<Buffer>;
    private renderTemplate;
    private registerHandlebarsHelpers;
    generateCertificate(data: any, language?: string): Promise<Buffer>;
    generateReport(data: any, language?: string): Promise<Buffer>;
    generateInvoice(data: any, language?: string): Promise<Buffer>;
    generateProgramSummary(data: any, language?: string): Promise<Buffer>;
}
export declare const pdfService: PDFService;
//# sourceMappingURL=pdfService.d.ts.map