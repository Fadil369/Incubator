import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { aiChampionsService } from './services/aiChampionsService';
import { llmService } from './services/llmService';
import aiRoutes from './routes/aiRoutes';
import enhancedRoutes from './routes/enhancedRoutes';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.AI_PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));

// AI-specific rate limiting
const aiRateLimit = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW || '3600000'), // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '100'),
  message: {
    error: 'Too many AI requests',
    message: 'Rate limit exceeded for AI services',
    retryAfter: 3600,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/ai', aiRateLimit);
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`AI Service: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'brainsait-ai',
    version: '1.0.0',
    checks: {
      openai: !!process.env.OPENAI_API_KEY,
      claude: !!process.env.CLAUDE_API_KEY,
      vectorDb: !!process.env.VECTOR_DB_URL,
    },
  };

  res.json(healthStatus);
});

// Add AI service routes
app.use('/api/ai', aiRoutes);

// Add enhanced AI service routes (financial intelligence, security)
app.use('/api/financial', enhancedRoutes);
app.use('/api/security', enhancedRoutes);

// AI Chat/Completion endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const requestSchema = z.object({
      prompt: z.string().min(1).max(10000),
      systemPrompt: z.string().optional(),
      provider: z.enum(['openai', 'anthropic', 'claude']).optional().default('openai'),
      model: z.string().optional(),
      maxTokens: z.number().min(1).max(4000).optional().default(1000),
      temperature: z.number().min(0).max(2).optional().default(0.7),
      userId: z.string().min(1),
      feature: z.string().min(1),
    });

    const validatedData = requestSchema.parse(req.body);
    const response = await llmService.generateCompletion(validatedData);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('AI chat error', { error, body: req.body });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Claims Analysis endpoint
app.post('/api/ai/claims/analyze', async (req, res) => {
  try {
    const claimsSchema = z.object({
      claimId: z.string(),
      patientData: z.object({
        id: z.string(),
        name: z.string(),
        age: z.number(),
        insuranceId: z.string(),
      }),
      procedures: z.array(z.object({
        code: z.string(),
        description: z.string(),
        cost: z.number(),
      })),
      facility: z.object({
        id: z.string(),
        name: z.string(),
        license: z.string(),
      }),
      userId: z.string(),
    });

    const validatedData = claimsSchema.parse(req.body);
    const analysis = await llmService.generateClaimsAnalysis(validatedData);

    res.json({
      success: true,
      data: {
        claimId: validatedData.claimId,
        analysis,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Claims analysis error', { error });
    res.status(500).json({
      success: false,
      error: 'Claims analysis failed',
    });
  }
});

// Compliance Report endpoint
app.post('/api/ai/compliance/report', async (req, res) => {
  try {
    const complianceSchema = z.object({
      smeId: z.string(),
      complianceData: z.object({
        mohLicense: z.string().optional(),
        nphiesStatus: z.string().optional(),
        lastAudit: z.string().optional(),
        staffCertifications: z.array(z.string()).optional(),
        facilityType: z.string(),
      }),
      userId: z.string(),
    });

    const validatedData = complianceSchema.parse(req.body);
    const report = await llmService.generateComplianceReport(validatedData);

    res.json({
      success: true,
      data: {
        smeId: validatedData.smeId,
        report,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Compliance report error', { error });
    res.status(500).json({
      success: false,
      error: 'Compliance report generation failed',
    });
  }
});

// Contact Center Transcription endpoint
app.post('/api/ai/contact/transcribe', async (req, res) => {
  try {
    const transcriptionSchema = z.object({
      transcription: z.string().min(1),
      context: z.object({
        patientId: z.string().optional(),
        callType: z.string(),
        duration: z.number().optional(),
      }),
      userId: z.string(),
    });

    const validatedData = transcriptionSchema.parse(req.body);
    const summary = await llmService.transcribeAndSummarize(
      validatedData.transcription,
      validatedData.context
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Transcription error', { error });
    res.status(500).json({
      success: false,
      error: 'Transcription processing failed',
    });
  }
});

// AI Champions Management endpoints
app.post('/api/ai/champions/enroll', async (req, res) => {
  try {
    const enrollmentSchema = z.object({
      userId: z.string(),
      smeId: z.string(),
      department: z.string(),
      experience: z.string(),
      goals: z.array(z.string()),
    });

    const validatedData = enrollmentSchema.parse(req.body);
    const champion = await aiChampionsService.enrollChampion(validatedData);

    res.status(201).json({
      success: true,
      data: champion,
    });
  } catch (error) {
    logger.error('Champion enrollment error', { error });
    res.status(500).json({
      success: false,
      error: 'Champion enrollment failed',
    });
  }
});

app.get('/api/ai/champions/:userId/metrics', async (req, res) => {
  try {
    const userId = req.params.userId;
    const metrics = await aiChampionsService.getChampionMetrics(userId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Champion metrics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve champion metrics',
    });
  }
});

// Usage Analytics endpoint
app.get('/api/ai/usage/analytics', async (req, res) => {
  try {
    const { startDate, endDate, userId, feature } = req.query;
    
    // Mock analytics data for now - implement with actual analytics service
    const analytics = {
      totalRequests: 1250,
      totalTokens: 125000,
      averageResponseTime: 2.3,
      topFeatures: [
        { feature: 'claims_analysis', usage: 450 },
        { feature: 'compliance_report', usage: 320 },
        { feature: 'contact_summary', usage: 280 },
      ],
      costBreakdown: {
        openai: 45.67,
        claude: 23.45,
        total: 69.12,
      },
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString(),
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Usage analytics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage analytics',
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled AI service error', { error, path: req.path });
  
  res.status(500).json({
    success: false,
    error: 'Internal AI service error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'AI service endpoint not found',
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🤖 BrainSAIT AI Service running on port ${PORT}`);
  logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
  logger.info(`🧠 AI Chat: http://localhost:${PORT}/api/ai/chat`);
  logger.info(`📊 Analytics: http://localhost:${PORT}/api/ai/usage/analytics`);
});

export { app };
