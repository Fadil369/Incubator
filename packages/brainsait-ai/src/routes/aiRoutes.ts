import { Router } from 'express';
import AIAnalyticsService from '../services/aiAnalyticsService';
import MarketIntelligenceService from '../services/marketIntelligenceService';
import DocumentAIService from '../services/documentAIService';
import { logger } from '../utils/logger';

const router = Router();
const aiAnalyticsService = new AIAnalyticsService();
const marketIntelligenceService = new MarketIntelligenceService();
const documentAIService = new DocumentAIService();

/**
 * @route GET /api/ai/insights/:smeId
 * @desc Get AI-powered business insights for SME
 * @access Private
 */
router.get('/insights/:smeId', async (req, res) => {
  try {
    const { smeId } = req.params;
    
    // In production, fetch actual business data from database
    const mockBusinessData = {
      industry: 'healthcare_technology',
      region: 'riyadh',
      revenue: 1000000,
      growth: 25,
      employees: 15
    };

    const insights = await aiAnalyticsService.generateBusinessInsights({
      smeId,
      businessData: mockBusinessData
    });

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    logger.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights'
    });
  }
});

/**
 * @route GET /api/ai/market/trends
 * @desc Get healthcare market trends
 * @access Private
 */
router.get('/market/trends', async (req, res) => {
  try {
    const { industry, region } = req.query;
    
    const trends = await marketIntelligenceService.getHealthcareMarketTrends(
      industry as string,
      region as string
    );

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('Error fetching market trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market trends'
    });
  }
});

/**
 * @route GET /api/ai/market/opportunities
 * @desc Identify market opportunities
 * @access Private
 */
router.post('/market/opportunities', async (req, res) => {
  try {
    const businessProfile = req.body;
    
    const opportunities = await marketIntelligenceService.identifyMarketOpportunities(businessProfile);

    res.json({
      success: true,
      data: opportunities
    });

  } catch (error) {
    logger.error('Error identifying market opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify market opportunities'
    });
  }
});

/**
 * @route GET /api/ai/market/regulations
 * @desc Get regulatory updates
 * @access Private
 */
router.get('/market/regulations', async (req, res) => {
  try {
    const { authorities } = req.query;
    const authoritiesList = authorities ? (authorities as string).split(',') : undefined;
    
    const regulations = await marketIntelligenceService.getRegulatoryUpdates(authoritiesList);

    res.json({
      success: true,
      data: regulations
    });

  } catch (error) {
    logger.error('Error fetching regulatory updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regulatory updates'
    });
  }
});

/**
 * @route GET /api/ai/market/incentives
 * @desc Get government incentives
 * @access Private
 */
router.get('/market/incentives', async (req, res) => {
  try {
    const { businessType, region } = req.query;
    
    const incentives = await marketIntelligenceService.getGovernmentIncentives(
      businessType as string,
      region as string
    );

    res.json({
      success: true,
      data: incentives
    });

  } catch (error) {
    logger.error('Error fetching government incentives:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch government incentives'
    });
  }
});

/**
 * @route GET /api/ai/market/dashboard
 * @desc Get comprehensive market intelligence dashboard
 * @access Private
 */
router.post('/market/dashboard', async (req, res) => {
  try {
    const smeProfile = req.body;
    
    const dashboard = await marketIntelligenceService.getMarketIntelligenceDashboard(smeProfile);

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error generating market dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate market dashboard'
    });
  }
});

/**
 * @route POST /api/ai/documents/optimize
 * @desc Optimize documents using AI
 * @access Private
 */
router.post('/documents/optimize', async (req, res) => {
  try {
    const optimizationRequest = req.body;
    
    const optimizedDocument = await documentAIService.optimizeDocument(optimizationRequest);

    res.json({
      success: true,
      data: optimizedDocument
    });

  } catch (error) {
    logger.error('Error optimizing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize document'
    });
  }
});

/**
 * @route POST /api/ai/documents/analyze
 * @desc Analyze document quality and compliance
 * @access Private
 */
router.post('/documents/analyze', async (req, res) => {
  try {
    const analysisRequest = req.body;
    
    const analysis = await documentAIService.analyzeDocument(analysisRequest);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Error analyzing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze document'
    });
  }
});

/**
 * @route POST /api/ai/documents/template
 * @desc Generate intelligent document templates
 * @access Private
 */
router.post('/documents/template', async (req, res) => {
  try {
    const templateRequest = req.body;
    
    const template = await documentAIService.generateTemplate(templateRequest);

    res.json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template'
    });
  }
});

/**
 * @route POST /api/ai/documents/validate-compliance
 * @desc Validate document compliance with Saudi regulations
 * @access Private
 */
router.post('/documents/validate-compliance', async (req, res) => {
  try {
    const { documentContent, documentType, regulations } = req.body;
    
    const validation = await documentAIService.validateCompliance(
      documentContent,
      documentType,
      regulations
    );

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    logger.error('Error validating compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate compliance'
    });
  }
});

/**
 * @route POST /api/ai/analytics/financial
 * @desc Analyze financial data with AI
 * @access Private
 */
router.post('/analytics/financial', async (req, res) => {
  try {
    const financialData = req.body;
    
    const insights = await aiAnalyticsService.analyzeFinancialData(financialData);

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    logger.error('Error analyzing financial data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze financial data'
    });
  }
});

/**
 * @route POST /api/ai/analytics/predictive
 * @desc Generate predictive analytics
 * @access Private
 */
router.post('/analytics/predictive', async (req, res) => {
  try {
    const { historicalData, businessContext } = req.body;
    
    const predictions = await aiAnalyticsService.generatePredictiveAnalytics(
      historicalData,
      businessContext
    );

    res.json({
      success: true,
      data: predictions
    });

  } catch (error) {
    logger.error('Error generating predictive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictive analytics'
    });
  }
});

/**
 * @route GET /api/ai/health
 * @desc Health check for AI services
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI services are operational',
    timestamp: new Date().toISOString(),
    services: {
      aiAnalytics: 'operational',
      marketIntelligence: 'operational',
      documentAI: 'operational'
    }
  });
});

export default router;