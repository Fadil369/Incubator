/**
 * Workers-compatible Auth Routes for BrainSAIT Backend
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie } from 'hono/cookie';

type WorkerAuthRole = 'SME_OWNER' | 'MENTOR' | 'ADMIN' | 'SUPER_ADMIN';

interface WorkerAuthClaims {
  userId: string;
  email: string;
  role: WorkerAuthRole;
  org?: string;
  startupOrg?: string;
  startupSlug?: string;
  organizations?: string[];
  exp?: number;
}

interface WorkerSessionRecord {
  userId: string;
  email: string;
  role: WorkerAuthRole;
  org?: string;
  startupOrg?: string;
  startupSlug?: string;
  organizations?: string[];
  createdAt: string;
}

interface Env {
  SESSIONS: any; // KV Namespace
  JWT_SECRET: string;
  NODE_ENV: string;
  GITHUB_ORG?: string;
}

const auth = new Hono<{ Bindings: Env }>();

const SUPPORTED_ROLES: WorkerAuthRole[] = ['SME_OWNER', 'MENTOR', 'ADMIN', 'SUPER_ADMIN'];

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStartupSlug(value: unknown): string | undefined {
  const slug = normalizeOptionalString(value)?.toLowerCase();
  if (!slug) return undefined;
  return /^[a-z0-9-]+$/.test(slug) ? slug : undefined;
}

function normalizeRole(value: unknown): WorkerAuthRole {
  return typeof value === 'string' && SUPPORTED_ROLES.includes(value as WorkerAuthRole)
    ? (value as WorkerAuthRole)
    : 'SME_OWNER';
}

function normalizeOrganizations(value: unknown, defaultOrg?: string): string[] {
  const organizations = Array.isArray(value)
    ? value.map((item) => normalizeOptionalString(item)).filter((item): item is string => Boolean(item))
    : [];

  if (defaultOrg && !organizations.includes(defaultOrg)) {
    organizations.unshift(defaultOrg);
  }

  return [...new Set(organizations)];
}

// POST /api/v1/auth/login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<{
      email?: string;
      password?: string;
      role?: WorkerAuthRole;
      org?: string;
      startupOrg?: string;
      startupSlug?: string;
      organizations?: string[];
    }>();
    const email = normalizeOptionalString(body.email);
    const password = normalizeOptionalString(body.password);
    
    // Validate input
    if (!email || !password) {
      return c.json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      }, 400);
    }

    const role = normalizeRole(body.role);
    const defaultOrg = normalizeOptionalString(c.env.GITHUB_ORG);
    const requestedOrg = normalizeOptionalString(body.org) ?? defaultOrg;
    const startupSlug = normalizeOptionalString(body.startupSlug)
      ? normalizeStartupSlug(body.startupSlug)
      : undefined;

    if (normalizeOptionalString(body.startupSlug) && !startupSlug) {
      return c.json({
        error: 'Invalid startup slug',
        message: 'startupSlug must contain only lowercase letters, numbers, and hyphens',
      }, 400);
    }

    if (defaultOrg && requestedOrg && requestedOrg !== defaultOrg) {
      return c.json({
        error: 'Invalid organization',
        message: `Only the configured org (${defaultOrg}) is supported in this environment`,
      }, 400);
    }

    const requestedStartupOrg = normalizeOptionalString(body.startupOrg) ?? (startupSlug ? defaultOrg : undefined);
    if (defaultOrg && requestedStartupOrg && requestedStartupOrg !== defaultOrg) {
      return c.json({
        error: 'Invalid startup organization',
        message: `Only the configured org (${defaultOrg}) is supported in this environment`,
      }, 400);
    }

    const organizations = normalizeOrganizations(body.organizations, requestedOrg);
    const claims: WorkerAuthClaims = {
      userId: 'mock-user-id',
      email,
      role,
      ...(requestedOrg ? { org: requestedOrg } : {}),
      ...(requestedStartupOrg ? { startupOrg: requestedStartupOrg } : {}),
      ...(startupSlug ? { startupSlug } : {}),
      ...(organizations.length > 0 ? { organizations } : {}),
    };
    
    // Here you would validate against your database
    // For now, returning a mock response for deployment testing
    const token = await sign({
      ...claims,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }, c.env.JWT_SECRET);

    const sessionRecord: WorkerSessionRecord = {
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
    
  } catch (error) {
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
    
  } catch (error) {
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
    const payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as unknown as WorkerAuthClaims;
    
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
    
  } catch (error) {
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
    const payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as unknown as WorkerAuthClaims;
    
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

    const refreshedSession: WorkerSessionRecord = {
      userId: payload.userId,
      email: payload.email,
      role: normalizeRole(payload.role),
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
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({
      error: 'Unauthorized',
      message: 'Unable to refresh token'
    }, 401);
  }
});

export default auth;