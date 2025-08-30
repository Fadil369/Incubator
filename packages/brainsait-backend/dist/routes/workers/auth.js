/**
 * Workers-compatible Auth Routes for BrainSAIT Backend
 */
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie } from 'hono/cookie';
const auth = new Hono();
// POST /api/v1/auth/login
auth.post('/login', async (c) => {
    try {
        const { email, password } = await c.req.json();
        // Validate input
        if (!email || !password) {
            return c.json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            }, 400);
        }
        // Here you would validate against your database
        // For now, returning a mock response for deployment testing
        const token = await sign({
            userId: 'mock-user-id',
            email: email,
            role: 'SME_OWNER',
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        }, c.env.JWT_SECRET);
        // Store session in KV
        await c.env.SESSIONS.put(`session:${token}`, JSON.stringify({
            userId: 'mock-user-id',
            email: email,
            createdAt: new Date().toISOString()
        }), {
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
                id: 'mock-user-id',
                email: email,
                role: 'SME_OWNER'
            },
            token: token
        });
    }
    catch (error) {
        console.error('Login error:', error);
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
        const payload = await verify(token, c.env.JWT_SECRET);
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
        const payload = await verify(token, c.env.JWT_SECRET);
        // Create new token
        const newToken = await sign({
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        }, c.env.JWT_SECRET);
        // Update session in KV
        await c.env.SESSIONS.delete(`session:${token}`);
        await c.env.SESSIONS.put(`session:${newToken}`, JSON.stringify({
            userId: payload.userId,
            email: payload.email,
            createdAt: new Date().toISOString()
        }), {
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