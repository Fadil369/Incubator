/**
 * Workers-compatible Health and Info Routes for BrainSAIT Backend
 */
import { Hono } from 'hono';
interface Env {
    NODE_ENV: string;
    API_BASE_URL: string;
}
declare const health: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default health;
//# sourceMappingURL=health.d.ts.map