import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './config/environment';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import smeRoutes from './routes/sme';
import mentorRoutes from './routes/mentors';
import programRoutes from './routes/programs';
import documentRoutes from './routes/documents';
import analyticsRoutes from './routes/analytics';
import saudiComplianceRoutes from './routes/saudiCompliance';
import healthcareSMERoutes from './routes/healthcareSME';
import aiChampionsRoutes from './routes/aiChampions';
import mentorshipSessionRoutes from './routes/mentorshipSessions';
import cronRoutes from './routes/cron';

const app = express();
const prisma = new PrismaClient();
const redisClient = createClient({
  url: config.redis.url,
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
    healthy = false;
  }

  // Redis check (non-fatal — degrade gracefully)
  try {
    await redisClient.ping();
    checks.redis = 'connected';
  } catch {
    checks.redis = 'degraded';
    // Redis degradation is non-fatal for health checks — app still serves requests
  }

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: checks,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sme', smeRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/saudi-compliance', saudiComplianceRoutes);
app.use('/api/healthcare-sme', healthcareSMERoutes);
app.use('/api/ai-champions', aiChampionsRoutes);
app.use('/api/mentorship-sessions', mentorshipSessionRoutes);
app.use('/api/cron', cronRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and Redis connections
async function initializeConnections() {
  try {
    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');

    // Test database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');
  } catch (error) {
    logger.error('Failed to initialize connections', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  await prisma.$disconnect();
  await redisClient.quit();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  await prisma.$disconnect();
  await redisClient.quit();
  
  process.exit(0);
});

// Start server
const PORT = config.server.port;

initializeConnections().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 BrainSAIT Backend Server running on port ${PORT}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
  });
});

export { app, prisma, redisClient };