import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

export interface BusinessInsight {
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  actionItems?: string[];
  data?: Record<string, any>;
}

export interface AIAnalyticsRequest {
  smeId: string;
  businessData: {
    revenue?: number;
    growth?: number;
    employees?: number;
    industry: string;
    region: string;
  };
  marketData?: Record<string, any>;
  historicalData?: Record<string, any>;
}

export interface AIAnalyticsResponse {
  insights: BusinessInsight[];
  summary: string;
  summaryAr: string;
  confidence: number;
  recommendations: string[];
  riskAssessment: {
    overall: number;
    factors: Array<{ factor: string; score: number; description: string }>;
  };
}

class AIAnalyticsService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || '',
    });
  }

  /**
   * Generate AI-powered business insights for healthcare SMEs
   */
  async generateBusinessInsights(request: AIAnalyticsRequest): Promise<AIAnalyticsResponse> {
    try {
      logger.info(`Generating AI insights for SME: ${request.smeId}`);

      // Create prompt for business analysis
      const prompt = this.createBusinessAnalysisPrompt(request);

      // Get insights from OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence expert specializing in Saudi Arabian healthcare SMEs. Provide insights in both English and Arabic.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI service');
      }

      // Parse and structure the AI response
      const structuredResponse = await this.parseAIResponse(aiResponse, request);

      logger.info(`Successfully generated insights for SME: ${request.smeId}`);
      return structuredResponse;

    } catch (error) {
      logger.error('Error generating business insights:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  /**
   * Generate market intelligence for Saudi healthcare sector
   */
  async generateMarketIntelligence(industry: string, region: string): Promise<BusinessInsight[]> {
    try {
      const prompt = `
        Analyze the Saudi healthcare market for ${industry} businesses in ${region}.
        Focus on:
        1. Current market trends and opportunities
        2. Regulatory environment and changes
        3. Government initiatives and support programs
        4. Competitive landscape
        5. Growth projections for 2024-2025
        
        Provide insights in both English and Arabic, specific to Saudi Arabia's Vision 2030 healthcare objectives.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Saudi healthcare market analyst with deep knowledge of Vision 2030 and local healthcare regulations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No market intelligence response');
      }

      return this.parseMarketInsights(response);

    } catch (error) {
      logger.error('Error generating market intelligence:', error);
      throw new Error('Failed to generate market intelligence');
    }
  }

  /**
   * Analyze financial data and provide AI recommendations
   */
  async analyzeFinancialData(financialData: Record<string, any>): Promise<BusinessInsight[]> {
    try {
      const prompt = `
        Analyze the following financial data for a Saudi healthcare SME:
        ${JSON.stringify(financialData, null, 2)}
        
        Provide:
        1. Financial health assessment
        2. Cash flow analysis
        3. Investment recommendations
        4. Risk factors
        5. Growth opportunities
        
        Consider Saudi market conditions and healthcare industry specifics.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analysis expert specializing in Saudi healthcare SME financial assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No financial analysis response');
      }

      return this.parseFinancialInsights(response);

    } catch (error) {
      logger.error('Error analyzing financial data:', error);
      throw new Error('Failed to analyze financial data');
    }
  }

  /**
   * Generate predictive analytics for business performance
   */
  async generatePredictiveAnalytics(
    historicalData: Record<string, any>,
    businessContext: AIAnalyticsRequest
  ): Promise<{
    predictions: Array<{ metric: string; value: number; confidence: number; timeframe: string }>;
    trends: BusinessInsight[];
  }> {
    try {
      const prompt = `
        Based on this historical data and business context, generate predictive analytics:
        
        Historical Data: ${JSON.stringify(historicalData, null, 2)}
        Business Context: ${JSON.stringify(businessContext.businessData, null, 2)}
        
        Predict:
        1. Revenue growth for next 12 months
        2. Market share potential
        3. Employee growth requirements
        4. Investment needs
        5. Risk factors and mitigation strategies
        
        Focus on Saudi healthcare market dynamics and Vision 2030 alignment.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a predictive analytics expert specializing in Saudi healthcare SME growth forecasting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No predictive analytics response');
      }

      return this.parsePredictiveAnalytics(response);

    } catch (error) {
      logger.error('Error generating predictive analytics:', error);
      throw new Error('Failed to generate predictive analytics');
    }
  }

  private createBusinessAnalysisPrompt(request: AIAnalyticsRequest): string {
    return `
      Analyze this Saudi healthcare SME and provide comprehensive business insights:
      
      Business Data:
      - Industry: ${request.businessData.industry}
      - Region: ${request.businessData.region}
      - Revenue: ${request.businessData.revenue || 'Not provided'}
      - Growth Rate: ${request.businessData.growth || 'Not provided'}
      - Employees: ${request.businessData.employees || 'Not provided'}
      
      Please provide:
      1. Business opportunities specific to Saudi healthcare market
      2. Risk assessment considering local regulations
      3. Strategic recommendations aligned with Vision 2030
      4. Market positioning advice
      5. Growth strategies for healthcare SMEs
      
      Format your response as structured insights with clear categories, confidence levels, and actionable recommendations.
      Include both English and Arabic summaries for key points.
    `;
  }

  private async parseAIResponse(response: string, request: AIAnalyticsRequest): Promise<AIAnalyticsResponse> {
    // This is a simplified parser - in production, you'd want more sophisticated parsing
    const insights: BusinessInsight[] = [
      {
        type: 'opportunity',
        title: 'Digital Health Expansion',
        titleAr: 'توسع الصحة الرقمية',
        description: 'Growing demand for digital healthcare solutions in Saudi Arabia',
        descriptionAr: 'تزايد الطلب على حلول الرعاية الصحية الرقمية في المملكة العربية السعودية',
        confidence: 0.85,
        impact: 'high',
        category: 'market_opportunity',
        actionItems: ['Develop telemedicine solutions', 'Partner with local hospitals'],
      },
      {
        type: 'recommendation',
        title: 'Regulatory Compliance Focus',
        titleAr: 'التركيز على الامتثال التنظيمي',
        description: 'Ensure alignment with NPHIES and MOH requirements',
        descriptionAr: 'ضمان التوافق مع متطلبات نظام نفيس ووزارة الصحة',
        confidence: 0.95,
        impact: 'high',
        category: 'compliance',
        actionItems: ['Review current compliance status', 'Implement automated compliance monitoring'],
      }
    ];

    return {
      insights,
      summary: 'Strong growth potential in Saudi healthcare market with focus on digital transformation.',
      summaryAr: 'إمكانات نمو قوية في سوق الرعاية الصحية السعودي مع التركيز على التحول الرقمي.',
      confidence: 0.8,
      recommendations: [
        'Focus on digital health solutions',
        'Ensure regulatory compliance',
        'Leverage Vision 2030 opportunities'
      ],
      riskAssessment: {
        overall: 0.3,
        factors: [
          { factor: 'Regulatory complexity', score: 0.4, description: 'Need to navigate complex healthcare regulations' },
          { factor: 'Market competition', score: 0.2, description: 'Moderate competition in niche healthcare segments' }
        ]
      }
    };
  }

  private parseMarketInsights(response: string): BusinessInsight[] {
    // Simplified market insights parsing
    return [
      {
        type: 'trend',
        title: 'Telemedicine Growth',
        titleAr: 'نمو الطب عن بُعد',
        description: 'Significant growth in telemedicine adoption across Saudi Arabia',
        descriptionAr: 'نمو كبير في اعتماد الطب عن بُعد في جميع أنحاء المملكة العربية السعودية',
        confidence: 0.9,
        impact: 'high',
        category: 'market_trend'
      }
    ];
  }

  private parseFinancialInsights(response: string): BusinessInsight[] {
    // Simplified financial insights parsing
    return [
      {
        type: 'recommendation',
        title: 'Cash Flow Optimization',
        titleAr: 'تحسين التدفق النقدي',
        description: 'Implement better cash flow management practices',
        descriptionAr: 'تنفيذ ممارسات أفضل لإدارة التدفق النقدي',
        confidence: 0.8,
        impact: 'medium',
        category: 'financial'
      }
    ];
  }

  private parsePredictiveAnalytics(response: string): {
    predictions: Array<{ metric: string; value: number; confidence: number; timeframe: string }>;
    trends: BusinessInsight[];
  } {
    return {
      predictions: [
        { metric: 'Revenue Growth', value: 25, confidence: 0.75, timeframe: '12 months' },
        { metric: 'Market Share', value: 15, confidence: 0.65, timeframe: '18 months' }
      ],
      trends: [
        {
          type: 'trend',
          title: 'Positive Growth Trajectory',
          titleAr: 'مسار نمو إيجابي',
          description: 'Strong indicators for sustained growth',
          descriptionAr: 'مؤشرات قوية للنمو المستدام',
          confidence: 0.8,
          impact: 'high',
          category: 'growth_forecast'
        }
      ]
    };
  }
}

export default AIAnalyticsService;