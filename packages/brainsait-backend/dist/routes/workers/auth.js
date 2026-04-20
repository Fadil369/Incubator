/**
 * Workers-compatible Auth Routes for BrainSAIT Backend
 */
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie } from 'hono/cookie';
import { authenticateUserBackedClaims, coerceWorkerAuthRole, getTokenUserId, isWorkerAdminRole, normalizeOptionalString, normalizeOrganizations, resolveUserBackedClaims, WorkerUserClaimsError, } from './userBackedClaims';
const auth = new Hono();
function readAuthToken(c) {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return undefined;
    }
    const token = authHeader.slice('Bearer '.length).trim();
    return token.length > 0 ? token : undefined;
}
// POST /api/v1/auth/login
auth.post('/login', async (c) => {
    try {
        const body = await c.req.json().catch(() => ({}));
        const email = normalizeOptionalString(body.email)?.toLowerCase();
        const password = normalizeOptionalString(body.password);
        const defaultOrg = normalizeOptionalString(c.env.GITHUB_ORG);
        const exchangeToken = normalizeOptionalString(body.token) ?? readAuthToken(c);
        let claims = null;
        if (exchangeToken) {
            const verifiedToken = (await verify(exchangeToken, c.env.JWT_SECRET, 'HS256'));
            const userId = getTokenUserId(verifiedToken);
            const tokenEmail = normalizeOptionalString(verifiedToken.email)?.toLowerCase();
            const tokenRole = coerceWorkerAuthRole(verifiedToken.role);
            if (!userId || !tokenEmail) {
                return c.json({
                    error: 'Unauthorized',
                    message: 'The provided token does not contain a valid user identity',
                }, 401);
            }
            claims = await resolveUserBackedClaims({
                db: c.env.DB,
                defaultOrg,
                userId,
            });
            if (!claims && tokenRole && isWorkerAdminRole(tokenRole)) {
                const organizations = normalizeOrganizations([], defaultOrg);
                claims = {
                    userId,
                    email: tokenEmail,
                    role: tokenRole,
                    ...(defaultOrg ? { org: defaultOrg } : {}),
                    ...(organizations.length > 0 ? { organizations } : {}),
                };
            }
        }
        else {
            if (!email || !password) {
                return c.json({
                    error: 'Missing credentials',
                    message: 'Email and password are required',
                }, 400);
            }
            claims = await authenticateUserBackedClaims({
                db: c.env.DB,
                defaultOrg,
                email,
                password,
            });
        }
        if (!claims) {
            return c.json({
                error: 'Login failed',
                message: 'Invalid credentials or startup claims could not be resolved',
            }, 401);
        }
        const token = await sign({
            ...claims,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        }, c.env.JWT_SECRET);
        const sessionRecord = {
            ...claims,
            createdAt: new Date().toISOString(),
        };
        // Store session in KV
        await c.env.SESSIONS.put(`session:${token}`, JSON.stringify(sessionRecord), {
            expirationTtl: 60 * 60 * 24 // 24 hours
        });
        // Set HTTP-only cookie
        setCookie(c, 'auth-token', token, {
            httpOnly: true,
            secure: c.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 // 24 hours
        });
        return c.json({
            message: 'Login successful',
            user: {
                id: claims.userId,
                email: claims.email,
                role: claims.role,
                org: claims.org,
                startupOrg: claims.startupOrg,
                startupSlug: claims.startupSlug,
                organizations: claims.organizations ?? []
            },
            token: token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof WorkerUserClaimsError) {
            return c.json({
                error: 'Login unavailable',
                message: error.message,
            }, error.statusCode);
        }
        return c.json({
            error: 'Login failed',
            message: 'Invalid credentials'
        }, 401);
    }
});
// POST /api/v1/auth/logout
auth.post('/logout', async (c) => {
    try {
        const token = getCookie(c, 'auth-token') || c.req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            // Remove session from KV
            await c.env.SESSIONS.delete(`session:${token}`);
        }
        // Clear cookie
        setCookie(c, 'auth-token', '', {
            httpOnly: true,
            secure: c.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 0
        });
        return c.json({
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        return c.json({
            error: 'Logout failed',
            message: 'Unable to logout'
        }, 500);
    }
});
// GET /api/v1/auth/me
auth.get('/me', async (c) => {
    try {
        const token = getCookie(c, 'auth-token') || c.req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return c.json({
                error: 'Unauthorized',
                message: 'No authentication token provided'
            }, 401);
        }
        // Verify JWT
        const payload = (await verify(token, c.env.JWT_SECRET, 'HS256'));
        // Check session in KV
        const session = await c.env.SESSIONS.get(`session:${token}`);
        if (!session) {
            return c.json({
                error: 'Unauthorized',
                message: 'Invalid or expired session'
            }, 401);
        }
        const sessionData = JSON.parse(session);
        return c.json({
            user: {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
                org: payload.org,
                startupOrg: payload.startupOrg,
                startupSlug: payload.startupSlug,
                organizations: payload.organizations ?? [],
                sessionCreated: sessionData.createdAt
            }
        });
    }
    catch (error) {
        console.error('Auth verification error:', error);
        return c.json({
            error: 'Unauthorized',
            message: 'Invalid authentication token'
        }, 401);
    }
});
// POST /api/v1/auth/refresh
auth.post('/refresh', async (c) => {
    try {
        const token = getCookie(c, 'auth-token') || c.req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return c.json({
                error: 'Unauthorized',
                message: 'No authentication token provided'
            }, 401);
        }
        // Verify current token
        const payload = (await verify(token, c.env.JWT_SECRET, 'HS256'));
        // Create new token
        const newToken = await sign({
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            ...(payload.org ? { org: payload.org } : {}),
            ...(payload.startupOrg ? { startupOrg: payload.startupOrg } : {}),
            ...(payload.startupSlug ? { startupSlug: payload.startupSlug } : {}),
            ...(Array.isArray(payload.organizations) ? { organizations: payload.organizations } : {}),
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        }, c.env.JWT_SECRET);
        const refreshedSession = {
            userId: payload.userId,
            email: payload.email,
            role: coerceWorkerAuthRole(payload.role) ?? 'SME_OWNER',
            ...(payload.org ? { org: payload.org } : {}),
            ...(payload.startupOrg ? { startupOrg: payload.startupOrg } : {}),
            ...(payload.startupSlug ? { startupSlug: payload.startupSlug } : {}),
            ...(Array.isArray(payload.organizations) ? { organizations: payload.organizations } : {}),
            createdAt: new Date().toISOString(),
        };
        // Update session in KV
        await c.env.SESSIONS.delete(`session:${token}`);
        await c.env.SESSIONS.put(`session:${newToken}`, JSON.stringify(refreshedSession), {
            expirationTtl: 60 * 60 * 24 // 24 hours
        });
        // Set new cookie
        setCookie(c, 'auth-token', newToken, {
            httpOnly: true,
            secure: c.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 60 * 60 * 24 // 24 hours
        });
        return c.json({
            message: 'Token refreshed successfully',
            token: newToken
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        return c.json({
            error: 'Unauthorized',
            message: 'Unable to refresh token'
        }, 401);
    }
});
export default auth;
//# sourceMappingURL=auth.js.map