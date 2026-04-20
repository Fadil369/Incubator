export declare const config: {
    server: {
        port: number;
        nodeEnv: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    puppeteer: {
        headless: boolean;
        executablePath: string | undefined;
        args: string[];
    };
    templates: {
        basePath: string;
        defaultLanguage: string;
        supportedLanguages: string[];
    };
    storage: {
        outputPath: string;
        tempPath: string;
        maxFileSize: number;
        cleanupInterval: number;
    };
    security: {
        maxRequestSize: string;
        rateLimitWindow: number;
        rateLimitMax: number;
    };
};
//# sourceMappingURL=environment.d.ts.map