/**
 * Workers-compatible Auth Routes for BrainSAIT Backend
 */
import { Hono } from 'hono';
interface Env {
    SESSIONS: KVNamespace;
    DB: D1Database;
    JWT_SECRET: string;
    NODE_ENV: string;
    GITHUB_ORG?: string;
}
declare const auth: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default auth;
//# sourceMappingURL=auth.d.ts.map