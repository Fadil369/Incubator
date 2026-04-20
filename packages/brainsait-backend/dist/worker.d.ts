/**
 * Cloudflare Workers Entry Point for BrainSAIT Backend
 * Converts Express.js app to Workers-compatible handler
 */
import { Hono } from 'hono';
interface Env {
    SESSIONS: KVNamespace;
    CACHE: KVNamespace;
    RATE_LIMIT: KVNamespace;
    CONFIG: KVNamespace;
    FEATURE_FLAGS: KVNamespace;
    STARTUP_REGISTRY: KVNamespace;
    PARTNER_APPLICATIONS: KVNamespace;
    DB: D1Database;
    AUDIT_LOG: D1Database;
    DOCUMENTS: R2Bucket;
    UPLOADS: R2Bucket;
    DATA_CONTRACTS: R2Bucket;
    AI: Ai;
    NODE_ENV: string;
    JWT_SECRET: string;
    DATABASE_URL: string;
    FRONTEND_URL: string;
    API_BASE_URL: string;
    CORS_ORIGINS: string;
    ADMIN_KEY: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    SENDGRID_API_KEY: string;
    GITHUB_TOKEN: string;
    GITHUB_ORG: string;
    GITHUB_REPO: string;
    GITHUB_APP_ID: string;
    GITHUB_APP_PRIVATE_KEY: string;
}
declare const app: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default app;
//# sourceMappingURL=worker.d.ts.map