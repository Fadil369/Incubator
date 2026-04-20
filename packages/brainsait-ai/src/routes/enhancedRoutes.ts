import { Router } from 'express';
import FinancialIntelligenceService from '../services/financialIntelligenceService';
import SecurityService from '../services/securityService';
import { logger } from '../utils/logger';

const router = Router();
const financialService = new FinancialIntelligenceService();
const securityService = new SecurityService();

/**
 * @route POST /api/financial/investment-readiness
 * @desc Assess investment readiness of healthcare SME
 * @access Private
 */
router.post('/investment-readiness', async (req, res) => {
  try {
    const assessment = await financialService.assessInvestmentReadiness(req.body);

    // Log audit event
    await securityService.logAuditEvent({
      userId: req.body.userId || 'system',
      action: 'investment_readiness_assessment',
      resource: 'financial_intelligence',
      result: 'success',
      ipAddress: req.ip ?? '',
      userAgent: req.get('user-agent') || '',
      details: { smeId: req.body.smeId },
      riskLevel: 'low',
    });

    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    logger.error('Error assessing investment readiness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assess investment readiness',
    });
  }
});

/**
 * @route POST /api/financial/funding-opportunities
 * @desc Find matching funding opportunities
 * @access Private
 */
router.post('/funding-opportunities', async (req, res) => {
  try {
    const opportunities = await financialService.findFundingOpportunities(req.body);

    res.json({
      success: true,
      data: opportunities,
    });
  } catch (error) {
    logger.error('Error finding funding opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find funding opportunities',
    });
  }
});

/**
 * @route POST /api/financial/forecast
 * @desc Generate financial forecast
 * @access Private
 */
router.post('/forecast', async (req, res) => {
  try {
    const { historicalData, businessPlan, timeframe } = req.body;

    const forecast = await financialService.generateFinancialForecast(
      historicalData,
      businessPlan,
      timeframe
    );

    res.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    logger.error('Error generating financial forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial forecast',
    });
  }
});

/**
 * @route POST /api/financial/valuation
 * @desc Provide valuation guidance
 * @access Private
 */
router.post('/valuation', async (req, res) => {
  try {
    const guidance = await financialService.provideValuationGuidance(req.body);

    res.json({
      success: true,
      data: guidance,
    });
  } catch (error) {
    logger.error('Error providing valuation guidance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to provide valuation guidance',
    });
  }
});

/**
 * @route POST /api/financial/health-score
 * @desc Calculate financial health score
 * @access Private
 */
router.post('/health-score', async (req, res) => {
  try {
    const healthScore = await financialService.calculateFinancialHealth(req.body);

    res.json({
      success: true,
      data: healthScore,
    });
  } catch (error) {
    logger.error('Error calculating financial health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate financial health',
    });
  }
});

/**
 * @route POST /api/security/mfa/generate
 * @desc Generate MFA challenge
 * @access Private
 */
router.post('/mfa/generate', async (req, res) => {
  try {
    const { userId, method } = req.body;

    const challenge = await securityService.generateMFAChallenge(userId, method);

    res.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    logger.error('Error generating MFA challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate MFA challenge',
    });
  }
});

/**
 * @route POST /api/security/mfa/verify
 * @desc Verify MFA challenge
 * @access Private
 */
router.post('/mfa/verify', async (req, res) => {
  try {
    const { challengeId, code } = req.body;

    const isValid = await securityService.verifyMFAChallenge(challengeId, code);

    if (isValid) {
      await securityService.logAuditEvent({
        userId: req.body.userId || 'unknown',
        action: 'mfa_verification',
        resource: 'authentication',
        result: 'success',
        ipAddress: req.ip ?? '',
        userAgent: req.get('user-agent') || '',
        details: { challengeId },
        riskLevel: 'low',
      });
    } else {
      await securityService.logAuditEvent({
        userId: req.body.userId || 'unknown',
        action: 'mfa_verification',
        resource: 'authentication',
        result: 'failure',
        ipAddress: req.ip ?? '',
        userAgent: req.get('user-agent') || '',
        details: { challengeId },
        riskLevel: 'medium',
      });
    }

    res.json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error) {
    logger.error('Error verifying MFA challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify MFA challenge',
    });
  }
});

/**
 * @route GET /api/security/compliance/:organizationId
 * @desc Assess data protection compliance
 * @access Private
 */
router.get('/compliance/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;

    const compliance = await securityService.assessDataProtectionCompliance(organizationId);

    res.json({
      success: true,
      data: compliance,
    });
  } catch (error) {
    logger.error('Error assessing compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assess compliance',
    });
  }
});

/**
 * @route POST /api/security/incidents
 * @desc Create security incident
 * @access Private
 */
router.post('/incidents', async (req, res) => {
  try {
    const { type, severity, description, affectedResources } = req.body;

    const incident = await securityService.createSecurityIncident(
      type,
      severity,
      description,
      affectedResources
    );

    res.json({
      success: true,
      data: incident,
    });
  } catch (error) {
    logger.error('Error creating security incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create security incident',
    });
  }
});

/**
 * @route GET /api/security/report/:organizationId
 * @desc Generate security report
 * @access Private
 */
router.get('/report/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { startDate, endDate } = req.query;

    const report = await securityService.generateSecurityReport(
      organizationId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security report',
    });
  }
});

/**
 * @route GET /api/health
 * @desc Health check for enhanced services
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced AI services are operational',
    timestamp: new Date().toISOString(),
    services: {
      financialIntelligence: 'operational',
      security: 'operational',
    },
  });
});

export default router;
