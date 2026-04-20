export declare const config: {
    server: {
        port: number;
        nodeEnv: any;
    };
    database: {
        url: any;
    };
    redis: {
        url: any;
    };
    jwt: {
        secret: any;
        expiresIn: any;
    };
    cors: {
        allowedOrigins: any;
    };
    email: {
        smtp: {
            host: any;
            port: number;
            secure: boolean;
            user: any;
            pass: any;
        };
        from: any;
    };
    uploads: {
        maxFileSize: number;
        allowedMimeTypes: string[];
    };
    security: {
        bcryptSaltRounds: number;
        rateLimitWindow: number;
        rateLimitMax: number;
    };
};
//# sourceMappingURL=environment.d.ts.map