/**
 * Workers-compatible Health and Info Routes for BrainSAIT Backend
 */

import { Hono } from 'hono';

interface Env {
  NODE_ENV: string;
  API_BASE_URL: string;
}

const health = new Hono<{ Bindings: Env }>();

// GET /api/v1/health
health.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env.NODE_ENV || 'development',
    worker: 'cloudflare-workers',
    uptime: Date.now(),
    services: {
      auth: 'operational',
      database: 'operational',
      cache: 'operational',
      storage: 'operational'
    }
  });
});

// GET /api/v1/info
health.get('/info', (c) => {
  return c.json({
    name: 'BrainSAIT Healthcare SME Platform API',
    description: 'Healthcare SME Digital Transformation Platform Backend',
    version: '1.0.0',
    environment: c.env.NODE_ENV || 'development',
    runtime: 'cloudflare-workers',
    endpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        logout: 'POST /api/v1/auth/logout',
        me: 'GET /api/v1/auth/me',
        refresh: 'POST /api/v1/auth/refresh'
      },
      users: {
        profile: 'GET /api/v1/users/profile',
        update: 'PUT /api/v1/users/profile'
      },
      sme: {
        list: 'GET /api/v1/sme',
        create: 'POST /api/v1/sme',
        profile: 'GET /api/v1/sme/:id'
      },
      programs: {
        list: 'GET /api/v1/programs',
        create: 'POST /api/v1/programs',
        enroll: 'POST /api/v1/programs/:id/enroll'
      }
    },
    documentation: c.env.API_BASE_URL + '/docs',
    status: c.env.API_BASE_URL + '/health'
  });
});

// GET /api/v1/status (alias for health)
health.get('/status', (c) => {
  return c.redirect('/api/v1/health');
});

export default health;