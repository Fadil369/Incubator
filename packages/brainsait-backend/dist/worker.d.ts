/**
 * Cloudflare Workers Entry Point for BrainSAIT Backend
 * Converts Express.js app to Workers-compatible handler
 */
import { Hono } from 'hono';
interface Env {
    SESSIONS: any;
    AI_CACHE: any;
    RATE_LIMIT_STORE: any;
    DOCUMENTS: any;
    UPLOADS: any;
    BACKUPS: any;
    DB: any;
    NODE_ENV: string;
    JWT_SECRET: string;
    REDIS_URL: string;
    DATABASE_URL: string;
    FRONTEND_URL: string;
    API_BASE_URL: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    SENDGRID_API_KEY: string;
}
declare const app: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=worker.d.ts.map