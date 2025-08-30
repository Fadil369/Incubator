import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { body, param, query, validationResult, ValidationError } from 'express-validator';
import DocumentController from '../controllers/documentController';
import { logger } from '../utils/logger';

/**
 * Comprehensive API Routes for BrainSAIT Document Service
 * 
 * Features:
 * - RESTful API endpoints for document generation
 * - Saudi-specific validation and processing
 * - Multi-language support (Arabic/English)
 * - Rate limiting and security middleware
 * - Comprehensive error handling
 * - OpenAPI/Swagger documentation ready
 * 
 * @author BrainSAIT Development Team
 * @version 2.0.0
 */

const router = Router();

// Initialize document controller (convert to TypeScript class later if needed)
const documentController = new (require('../controllers/documentController'))();

// Type definitions
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    permissions: string[];
  };
}

interface DocumentGenerationRequest extends AuthenticatedRequest {
  body: {
    companyName?: string;
    executiveSummary?: string;
    crNumber?: string;
    vatNumber?: string;
    language?: 'ar' | 'en';
    [key: string]: any;
  };
}

interface BatchGenerationRequest extends AuthenticatedRequest {
  body: {
    documents: Array<{
      templateName: string;
      data: Record<string, any>;
      language?: 'ar' | 'en';
    }>;
    concurrent?: number;
    validateAll?: boolean;
  };
}

// Configure multer for file uploads (if needed for future enhancements)
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Rate limiting configuration
const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const documentGenerationLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per window
  'Too many document generation requests, please try again later'
);

const batchGenerationLimit = createRateLimit(
  30 * 60 * 1000, // 30 minutes
  3, // 3 batch requests per window
  'Too many batch generation requests, please try again later'
);

const templatePreviewLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  20, // 20 requests per window
  'Too many template preview requests, please try again later'
);

/**
 * Authentication middleware (ready for JWT integration)
 * Currently passes through - implement JWT validation as needed
 */
const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Placeholder for JWT authentication
    // const token = req.headers.authorization?.split(' ')[1];
    // if (!token) {
    //   return res.status(401).json({
    //     success: false,
    //     error: 'Authentication required',
    //     code: 'AUTH_REQUIRED'
    //   });
    // }
    
    // For now, we'll just add a placeholder user context
    req.user = {
      id: 'demo-user',
      name: 'Demo User',
      permissions: ['document:generate', 'document:batch', 'document:preview']
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Authorization middleware for specific permissions
 */
const authorize = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission
      });
    }
    next();
  };
};

/**
 * Request logging middleware
 */
const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as AuthenticatedRequest).user?.id
    });
  });
  
  next();
};

/**
 * Validation error handler
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array().map((err: ValidationError) => ({
        field: 'path' in err ? err.path : err.type,
        message: err.msg,
        value: 'value' in err ? err.value : undefined
      }))
    });
  }
  next();
};

/**
 * Language validation helper
 */
const validateLanguage = body('language')
  .optional()
  .isIn(['ar', 'en'])
  .withMessage('Language must be either "ar" (Arabic) or "en" (English)')
  .customSanitizer((value: string) => value || 'en');

/**
 * Saudi ID/CR number validation
 */
const validateSaudiId = (fieldName: string) => {
  return body(fieldName)
    .optional()
    .matches(/^\d{10}$/)
    .withMessage(`${fieldName} must be a 10-digit number`);
};

/**
 * Saudi phone number validation
 */
const validateSaudiPhone = (fieldName: string) => {
  return body(fieldName)
    .optional()
    .matches(/^(05|5)\d{8}$/)
    .withMessage(`${fieldName} must be a valid Saudi phone number`);
};

/**
 * Hijri date validation and conversion
 */
const processHijriDate = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.hijriDate) {
    try {
      // Validate and convert Hijri date if provided
      // This is a placeholder - implement proper Hijri date handling
      req.body.processedHijriDate = req.body.hijriDate;
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Hijri date format',
        code: 'INVALID_HIJRI_DATE'
      });
    }
  }
  next();
};

/**
 * Arabic text encoding validation
 */
const validateArabicEncoding = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.language === 'ar') {
    // Ensure proper UTF-8 encoding for Arabic text
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string' && /[\u0600-\u06FF]/.test(value)) {
        // Arabic text detected - ensure proper encoding
        try {
          req.body[key] = Buffer.from(value, 'utf8').toString('utf8');
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: `Invalid Arabic text encoding in field: ${key}`,
            code: 'INVALID_ARABIC_ENCODING'
          });
        }
      }
    }
  }
  next();
};

// Apply global middleware
router.use(logRequest);
router.use(authenticate);

/**
 * @swagger
 * /api/documents/business-plan:
 *   post:
 *     summary: Generate business plan document
 *     description: Creates a comprehensive business plan document with Saudi regulatory compliance
 *     tags: [Documents]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - executiveSummary
 *               - crNumber
 *             properties:
 *               companyName:
 *                 type: string
 *                 description: Company name in Arabic or English
 *                 example: "شركة التقنية المتطورة"
 *               executiveSummary:
 *                 type: string
 *                 description: Executive summary of the business plan
 *               crNumber:
 *                 type: string
 *                 pattern: ^\d{10}$
 *                 description: Saudi Commercial Registration number
 *               vatNumber:
 *                 type: string
 *                 description: VAT registration number
 *               nationalAddress:
 *                 type: object
 *                 description: Saudi national address details
 *               financials:
 *                 type: object
 *                 description: Financial projections
 *               language:
 *                 type: string
 *                 enum: [ar, en]
 *                 default: en
 *                 description: Output language
 *     responses:
 *       200:
 *         description: Business plan generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/business-plan',
  documentGenerationLimit,
  authorize('document:generate'),
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('executiveSummary').notEmpty().withMessage('Executive summary is required'),
    body('crNumber').notEmpty().matches(/^\d{10}$/).withMessage('Valid 10-digit CR number is required'),
    validateSaudiId('vatNumber'),
    validateLanguage,
    body('financials').optional().isObject().withMessage('Financials must be an object'),
    body('nationalAddress').optional().isObject().withMessage('National address must be an object'),
  ],
  handleValidationErrors,
  validateArabicEncoding,
  processHijriDate,
  async (req: DocumentGenerationRequest, res: Response) => {
    try {
      const startTime = Date.now();
      
      const result = await documentController.generateBusinessPlan(req.body, req.body.language);
      
      const generationTime = Date.now() - startTime;
      
      // Set response headers for PDF
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="business-plan-${result.documentId}.pdf"`,
        'Content-Length': result.buffer.length.toString(),
        'X-Document-ID': result.documentId,
        'X-Generation-Time': `${generationTime}ms`,
        'X-Template-Language': req.body.language || 'en',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      
      logger.info('Business plan generated successfully', {
        documentId: result.documentId,
        fileSize: result.buffer.length,
        generationTime: `${generationTime}ms`,
        language: req.body.language,
        userId: req.user?.id
      });
      
      res.send(result.buffer);
      
    } catch (error) {
      logger.error('Business plan generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Document generation failed',
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/feasibility-study:
 *   post:
 *     summary: Generate feasibility study document
 *     description: Creates a detailed feasibility study with market analysis and projections
 *     tags: [Documents]
 */
router.post('/feasibility-study',
  documentGenerationLimit,
  authorize('document:generate'),
  [
    body('projectName').notEmpty().withMessage('Project name is required'),
    body('marketAnalysis').notEmpty().withMessage('Market analysis is required'),
    body('technicalFeasibility').notEmpty().withMessage('Technical feasibility is required'),
    body('financialProjections').notEmpty().withMessage('Financial projections are required'),
    validateLanguage,
    body('industry').optional().isString(),
    body('targetMarket').optional().isObject(),
  ],
  handleValidationErrors,
  validateArabicEncoding,
  processHijriDate,
  async (req: DocumentGenerationRequest, res: Response) => {
    try {
      const startTime = Date.now();
      
      const result = await documentController.generateDocument({
        templateName: 'feasibility-study',
        data: req.body,
        language: req.body.language || 'en',
        validate: true
      });
      
      const generationTime = Date.now() - startTime;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="feasibility-study-${result.documentId}.pdf"`,
        'Content-Length': result.buffer.length.toString(),
        'X-Document-ID': result.documentId,
        'X-Generation-Time': `${generationTime}ms`,
        'X-Template-Language': req.body.language || 'en'
      });
      
      logger.info('Feasibility study generated successfully', {
        documentId: result.documentId,
        fileSize: result.buffer.length,
        generationTime: `${generationTime}ms`,
        language: req.body.language,
        userId: req.user?.id
      });
      
      res.send(result.buffer);
      
    } catch (error) {
      logger.error('Feasibility study generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Document generation failed',
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/certificate:
 *   post:
 *     summary: Generate compliance certificate
 *     description: Creates an official compliance certificate with QR code verification
 *     tags: [Documents]
 */
router.post('/certificate',
  documentGenerationLimit,
  authorize('document:generate'),
  [
    body('recipientName').notEmpty().withMessage('Recipient name is required'),
    body('programName').notEmpty().withMessage('Program name is required'),
    body('completionDate').isISO8601().withMessage('Valid completion date is required'),
    body('certificateId').optional().isString(),
    body('issuerName').optional().isString(),
    body('issuerTitle').optional().isString(),
    validateLanguage,
  ],
  handleValidationErrors,
  validateArabicEncoding,
  processHijriDate,
  async (req: DocumentGenerationRequest, res: Response) => {
    try {
      const startTime = Date.now();
      
      const result = await documentController.generateCertificate(req.body, req.body.language || 'en');
      
      const generationTime = Date.now() - startTime;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${result.documentId}.pdf"`,
        'Content-Length': result.buffer.length.toString(),
        'X-Document-ID': result.documentId,
        'X-Generation-Time': `${generationTime}ms`,
        'X-Template-Language': req.body.language || 'en',
        'X-Certificate-ID': req.body.certificateId || result.documentId
      });
      
      logger.info('Certificate generated successfully', {
        documentId: result.documentId,
        certificateId: req.body.certificateId,
        fileSize: result.buffer.length,
        generationTime: `${generationTime}ms`,
        language: req.body.language,
        userId: req.user?.id
      });
      
      res.send(result.buffer);
      
    } catch (error) {
      logger.error('Certificate generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Document generation failed',
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/compliance-report:
 *   post:
 *     summary: Generate compliance report
 *     description: Creates a detailed compliance report with government data integration
 *     tags: [Documents]
 */
router.post('/compliance-report',
  documentGenerationLimit,
  authorize('document:generate'),
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('reportPeriod').notEmpty().withMessage('Report period is required'),
    body('complianceItems').isArray().withMessage('Compliance items must be an array'),
    body('overallScore').isNumeric().withMessage('Overall score must be numeric'),
    validateSaudiId('crNumber'),
    validateLanguage,
  ],
  handleValidationErrors,
  validateArabicEncoding,
  processHijriDate,
  async (req: DocumentGenerationRequest, res: Response) => {
    try {
      const startTime = Date.now();
      
      const result = await documentController.generateComplianceReport(req.body, req.body.language || 'en');
      
      const generationTime = Date.now() - startTime;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${result.documentId}.pdf"`,
        'Content-Length': result.buffer.length.toString(),
        'X-Document-ID': result.documentId,
        'X-Generation-Time': `${generationTime}ms`,
        'X-Template-Language': req.body.language || 'en',
        'X-Compliance-Score': req.body.overallScore?.toString() || 'N/A'
      });
      
      logger.info('Compliance report generated successfully', {
        documentId: result.documentId,
        fileSize: result.buffer.length,
        generationTime: `${generationTime}ms`,
        language: req.body.language,
        complianceScore: req.body.overallScore,
        userId: req.user?.id
      });
      
      res.send(result.buffer);
      
    } catch (error) {
      logger.error('Compliance report generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Document generation failed',
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/batch:
 *   post:
 *     summary: Generate multiple documents in batch
 *     description: Creates multiple documents simultaneously with optimized processing
 *     tags: [Documents]
 */
router.post('/batch',
  batchGenerationLimit,
  authorize('document:generate'),
  [
    body('documents').isArray().withMessage('Documents must be an array'),
    body('documents.*.templateName').isIn(['business-plan', 'feasibility-study', 'certificate', 'compliance-report']).withMessage('Invalid template name'),
    body('documents.*.data').isObject().withMessage('Document data must be an object'),
    body('documents.*.language').optional().isIn(['ar', 'en']),
    body('concurrent').optional().isInt({ min: 1, max: 5 }).withMessage('Concurrent processing must be between 1-5'),
    body('validateAll').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: BatchGenerationRequest, res: Response) => {
    try {
      const { documents, concurrent = 3, validateAll = true } = req.body;
      const startTime = Date.now();
      
      if (documents.length > 20) {
        return res.status(400).json({
          success: false,
          error: 'Batch size cannot exceed 20 documents',
          code: 'BATCH_SIZE_EXCEEDED'
        });
      }
      
      const result = await documentController.generateBatchDocuments(documents, {
        concurrent,
        validateAll
      });
      
      const generationTime = Date.now() - startTime;
      
      // For batch processing, return JSON response with document metadata
      res.json({
        success: true,
        message: 'Batch generation completed',
        data: {
          summary: result.summary,
          generationTime: `${generationTime}ms`,
          results: result.results.map((doc: any) => ({
            documentId: doc.documentId,
            size: doc.buffer.length,
            metadata: doc.metadata
          })),
          errors: result.errors
        },
        timestamp: new Date().toISOString()
      });
      
      logger.info('Batch document generation completed', {
        totalDocuments: documents.length,
        successful: result.summary.successful,
        failed: result.summary.failed,
        generationTime: `${generationTime}ms`,
        userId: req.user?.id
      });
      
    } catch (error) {
      logger.error('Batch document generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Batch generation failed',
        code: 'BATCH_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/templates:
 *   get:
 *     summary: List available document templates
 *     description: Returns a list of all available document templates with their metadata
 *     tags: [Templates]
 */
router.get('/templates',
  templatePreviewLimit,
  async (req: Request, res: Response) => {
    try {
      const templates = [
        {
          name: 'business-plan',
          displayName: 'Business Plan',
          displayNameAr: 'خطة العمل',
          description: 'Comprehensive business plan with Saudi regulatory compliance',
          descriptionAr: 'خطة عمل شاملة مع الامتثال التنظيمي السعودي',
          languages: ['ar', 'en'],
          requiredFields: ['companyName', 'executiveSummary', 'crNumber'],
          optionalFields: ['vatNumber', 'nationalAddress', 'financials'],
          format: 'A4 Portrait',
          estimatedPages: '15-25'
        },
        {
          name: 'feasibility-study',
          displayName: 'Feasibility Study',
          displayNameAr: 'دراسة الجدوى',
          description: 'Detailed feasibility study with market analysis',
          descriptionAr: 'دراسة جدوى مفصلة مع تحليل السوق',
          languages: ['ar', 'en'],
          requiredFields: ['projectName', 'marketAnalysis', 'technicalFeasibility', 'financialProjections'],
          optionalFields: ['industry', 'targetMarket'],
          format: 'A4 Portrait',
          estimatedPages: '10-20'
        },
        {
          name: 'certificate',
          displayName: 'Compliance Certificate',
          displayNameAr: 'شهادة الامتثال',
          description: 'Official compliance certificate with QR verification',
          descriptionAr: 'شهادة امتثال رسمية مع التحقق برمز الاستجابة السريعة',
          languages: ['ar', 'en'],
          requiredFields: ['recipientName', 'programName', 'completionDate'],
          optionalFields: ['certificateId', 'issuerName', 'issuerTitle'],
          format: 'A4 Landscape',
          estimatedPages: '1'
        },
        {
          name: 'compliance-report',
          displayName: 'Compliance Report',
          displayNameAr: 'تقرير الامتثال',
          description: 'Comprehensive compliance report with government data',
          descriptionAr: 'تقرير امتثال شامل مع البيانات الحكومية',
          languages: ['ar', 'en'],
          requiredFields: ['companyName', 'reportPeriod', 'complianceItems', 'overallScore'],
          optionalFields: ['crNumber'],
          format: 'A4 Portrait',
          estimatedPages: '8-15'
        }
      ];
      
      res.json({
        success: true,
        data: {
          templates,
          totalCount: templates.length,
          supportedLanguages: ['ar', 'en'],
          supportedFormats: ['A4 Portrait', 'A4 Landscape']
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to fetch templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
        code: 'TEMPLATES_FETCH_ERROR'
      });
    }
  }
);

/**
 * @swagger
 * /api/documents/preview/{templateName}:
 *   get:
 *     summary: Preview template structure
 *     description: Returns the structure and sample data for a specific template
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: templateName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [business-plan, feasibility-study, certificate, compliance-report]
 */
router.get('/preview/:templateName',
  templatePreviewLimit,
  [
    param('templateName').isIn(['business-plan', 'feasibility-study', 'certificate', 'compliance-report']).withMessage('Invalid template name'),
    query('language').optional().isIn(['ar', 'en']).withMessage('Language must be ar or en'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { templateName } = req.params;
      const language = (req.query.language as string) || 'en';
      
      // Sample data for template previews
      const sampleData: Record<string, any> = {
        'business-plan': {
          companyName: language === 'ar' ? 'شركة التقنية المتطورة المحدودة' : 'Advanced Technology Company Ltd',
          executiveSummary: language === 'ar' 
            ? 'تهدف هذه الشركة إلى تطوير حلول تقنية مبتكرة للسوق السعودي'
            : 'This company aims to develop innovative technology solutions for the Saudi market',
          crNumber: '1234567890',
          vatNumber: '312345678903',
          nationalAddress: {
            buildingNumber: '1234',
            street: language === 'ar' ? 'شارع الملك فهد' : 'King Fahd Street',
            district: language === 'ar' ? 'حي العليا' : 'Al Olaya District',
            city: language === 'ar' ? 'الرياض' : 'Riyadh',
            postalCode: '12345'
          },
          financials: {
            year1: { revenue: 1000000, expenses: 750000, netProfit: 250000 },
            year2: { revenue: 1500000, expenses: 1050000, netProfit: 450000 },
            year3: { revenue: 2250000, expenses: 1462500, netProfit: 787500 }
          }
        },
        'feasibility-study': {
          projectName: language === 'ar' ? 'مشروع التقنية الطبية المتقدمة' : 'Advanced Medical Technology Project',
          marketAnalysis: language === 'ar'
            ? 'تحليل شامل للسوق السعودي للتقنيات الطبية'
            : 'Comprehensive analysis of the Saudi medical technology market',
          technicalFeasibility: language === 'ar'
            ? 'دراسة الجدوى التقنية للمشروع'
            : 'Technical feasibility study for the project',
          financialProjections: {
            initialInvestment: 2000000,
            projectedRevenue: 5000000,
            breakEvenPoint: 18
          },
          industry: 'healthcare',
          targetMarket: {
            size: '2.5B SAR',
            growth: '8.5%'
          }
        },
        'certificate': {
          recipientName: language === 'ar' ? 'أحمد محمد الأحمد' : 'Ahmed Mohammed Al-Ahmed',
          programName: language === 'ar' ? 'برنامج ريادة الأعمال المتقدم' : 'Advanced Entrepreneurship Program',
          completionDate: '2024-12-15',
          certificateId: 'CERT-2024-001',
          issuerName: language === 'ar' ? 'د. سعد الخالد' : 'Dr. Saad Al-Khalid',
          issuerTitle: language === 'ar' ? 'مدير البرنامج' : 'Program Director'
        },
        'compliance-report': {
          companyName: language === 'ar' ? 'شركة الابتكار الطبي' : 'Medical Innovation Company',
          reportPeriod: '2024 Q1-Q3',
          complianceItems: [
            {
              category: language === 'ar' ? 'التسجيل التجاري' : 'Commercial Registration',
              status: 'compliant',
              score: 100
            },
            {
              category: language === 'ar' ? 'ضريبة القيمة المضافة' : 'VAT Registration',
              status: 'compliant',
              score: 95
            }
          ],
          overallScore: 92,
          crNumber: '9876543210'
        }
      };
      
      const templateData = sampleData[templateName];
      if (!templateData) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
          code: 'TEMPLATE_NOT_FOUND'
        });
      }
      
      // Validate the sample data
      const validation = documentController.validateDocumentData(templateData, templateName);
      
      res.json({
        success: true,
        data: {
          templateName,
          language,
          sampleData: templateData,
          validation,
          structure: {
            requiredFields: documentController.getRequiredTemplateVars(templateName),
            dataTypes: typeof templateData,
            estimatedSize: JSON.stringify(templateData).length
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Template preview failed:', error);
      res.status(500).json({
        success: false,
        error: 'Template preview failed',
        code: 'TEMPLATE_PREVIEW_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Government API integration endpoint
 * @swagger
 * /api/documents/government/verify:
 *   post:
 *     summary: Verify company data with government APIs
 *     description: Integrates with Saudi government APIs to verify company information
 *     tags: [Government Integration]
 */
router.post('/government/verify',
  documentGenerationLimit,
  authorize('document:generate'),
  [
    body('crNumber').notEmpty().matches(/^\d{10}$/).withMessage('Valid 10-digit CR number is required'),
    body('verificationTypes').optional().isArray().withMessage('Verification types must be an array'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { crNumber, verificationTypes = ['commercial', 'taxation', 'zakat'] } = req.body;
      
      const verificationResults: Record<string, any> = {};
      
      // Fetch government data (these are mock calls in the controller)
      if (verificationTypes.includes('commercial') || verificationTypes.includes('all')) {
        verificationResults.commercial = await documentController.fetchGovernmentData(crNumber);
      }
      
      if (verificationTypes.includes('compliance') || verificationTypes.includes('all')) {
        verificationResults.compliance = await documentController.fetchComplianceData(crNumber);
      }
      
      res.json({
        success: true,
        data: {
          crNumber,
          verificationResults,
          verifiedAt: new Date().toISOString(),
          cacheExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        }
      });
      
    } catch (error) {
      logger.error('Government verification failed:', error);
      res.status(500).json({
        success: false,
        error: 'Government verification failed',
        code: 'GOVERNMENT_VERIFICATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Hijri date conversion endpoint
 * @swagger
 * /api/documents/utils/hijri-convert:
 *   post:
 *     summary: Convert Gregorian dates to Hijri
 *     description: Utility endpoint for date conversions used in documents
 *     tags: [Utilities]
 */
router.post('/utils/hijri-convert',
  templatePreviewLimit,
  [
    body('gregorianDate').isISO8601().withMessage('Valid Gregorian date required'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { gregorianDate } = req.body;
      
      // Use the controller's conversion method
      const hijriDate = documentController.convertToHijri(gregorianDate);
      
      res.json({
        success: true,
        data: {
          gregorianDate,
          hijriDate,
          convertedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Hijri conversion failed:', error);
      res.status(500).json({
        success: false,
        error: 'Hijri conversion failed',
        code: 'HIJRI_CONVERSION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Error handling middleware
 */
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Document routes error:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON payload',
      code: 'INVALID_JSON'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  });
});

// Cleanup on process termination
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, cleaning up document controller...');
  await documentController.cleanup();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, cleaning up document controller...');
  await documentController.cleanup();
});

export default router;