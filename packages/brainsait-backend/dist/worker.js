/**
 * Cloudflare Workers Entry Point for BrainSAIT Backend
 * Converts Express.js app to Workers-compatible handler
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { poweredBy } from 'hono/powered-by';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
// Import our route handlers (Workers-compatible versions)
import authRoutes from './routes/workers/auth';
import healthRoutes from './routes/workers/health';
const app = new Hono();
// Middleware
app.use('*', logger());
app.use('*', poweredBy());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', cors({
    origin: ['https://brainsait.com', 'https://staging.brainsait.com', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
}));
// Health check endpoints
app.route('/api/v1', healthRoutes);
// API routes
app.route('/api/v1/auth', authRoutes);
// Placeholder routes for other services (to be implemented)
app.get('/api/v1/users/profile', (c) => {
    return c.json({ message: 'Users service - Coming soon!' });
});
app.get('/api/v1/sme', (c) => {
    return c.json({ message: 'SME service - Coming soon!' });
});
app.get('/api/v1/programs', (c) => {
    return c.json({ message: 'Programs service - Coming soon!' });
});
app.get('/api/v1/mentors', (c) => {
    return c.json({ message: 'Mentors service - Coming soon!' });
});
app.get('/api/v1/analytics', (c) => {
    return c.json({ message: 'Analytics service - Coming soon!' });
});
// 404 handler
app.notFound((c) => {
    return c.json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: c.req.path,
        method: c.req.method,
        timestamp: new Date().toISOString()
    }, 404);
});
// Error handler
app.onError((err, c) => {
    console.error('Unhandled error in Workers', {
        error: err.message,
        stack: err.stack,
        path: c.req.path,
        method: c.req.method
    });
    return c.json({
        error: 'Internal Server Error',
        message: c.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
        timestamp: new Date().toISOString()
    }, 500);
});
export default app;
//# sourceMappingURL=worker.js.map