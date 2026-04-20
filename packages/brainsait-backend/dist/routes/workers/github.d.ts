/**
 * Workers-compatible GitHub proxy & automation routes.
 *
 * Proxies GitHub REST API calls so the PAT never has to leave the Worker,
 * and provides automation endpoints (create repo from template, dispatch
 * workflow, install GitHub App) consumed by the Incubator startup portals.
 */
import { Hono } from 'hono';
import { type JWTPayload } from 'jose';
interface GithubAuthClaims extends JWTPayload {
    id?: string;
    userId?: string;
    email?: string;
    org?: string;
    startupOrg?: string;
    startupSlug?: string;
    organizations?: string[];
    role?: string;
}
interface Env {
    GITHUB_TOKEN: string;
    GITHUB_ORG: string;
    GITHUB_APP_ID?: string;
    JWT_SECRET: string;
    DB: D1Database;
}
type GithubRouteContext = {
    Bindings: Env;
    Variables: {
        authClaims: GithubAuthClaims;
    };
};
declare const github: Hono<GithubRouteContext, import("hono/types").BlankSchema, "/">;
export default github;
//# sourceMappingURL=github.d.ts.map