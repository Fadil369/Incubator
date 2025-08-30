export declare const config: {
    server: {
        port: number;
        nodeEnv: string;
    };
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    email: {
        smtp: {
            host: string;
            port: number;
            secure: boolean;
            user: string;
            pass: string;
        };
        from: string;
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