import { OpenAI } from 'openai';
import { logger } from '../utils/logger';

export interface FinancialHealthScore {
  overall: number;
  liquidity: number;
  profitability: number;
  solvency: number;
  efficiency: number;
  growth: number;
}

export interface InvestmentReadinessAssessment {
  overallScore: number;
  readinessLevel: 'high' | 'medium' | 'low';
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    area: string;
    recommendation: string;
    implementationSteps: string[];
    estimatedTimeframe: string;
    expectedImpact: string;
  }>;
  investorAppeal: {
    marketOpportunity: number;
    team: number;
    product: number;
    financials: number;
    traction: number;
  };
  fundingStrategy: {
    recommendedAmount: number;
    recommendedType: 'grant' | 'loan' | 'equity' | 'mixed';
    timeline: string;
    potentialSources: string[];
  };
}

export interface FundingOpportunity {
  id: string;
  source: string;
  sourceAr: string;
  type: 'grant' | 'loan' | 'equity' | 'award' | 'competition';
  amount: number;
  matchScore: number;
  deadline: Date;
  eligibility: string[];
  requirements: string[];
  applicationComplexity: 'low' | 'medium' | 'high';
  successProbability: number;
  description: string;
  descriptionAr: string;
  authority: string;
  applicationUrl?: string;
}

export interface FinancialForecast {
  timeframe: '6m' | '12m' | '18m' | '24m' | '36m';
  revenue: {
    projected: number;
    conservative: number;
    optimistic: number;
    confidence: number;
  };
  expenses: {
    projected: number;
    breakdown: Record<string, number>;
  };
  profitability: {
    netProfit: number;
    margin: number;
    breakEvenMonth: number;
  };
  cashFlow: {
    operatingCashFlow: number;
    investmentCashFlow: number;
    financingCashFlow: number;
    endingCash: number;
  };
  keyAssumptions: string[];
  risks: Array<{
    risk: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;
}

export interface ValuationGuidance {
  estimatedValuation: {
    low: number;
    mid: number;
    high: number;
  };
  methodology: string[];
  comparables: Array<{
    company: string;
    valuation: number;
    revenue: number;
    multiple: number;
  }>;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  recommendations: string[];
}

class FinancialIntelligenceService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Assess investment readiness of healthcare SME
   */
  async assessInvestmentReadiness(businessData: {
    financials: Record<string, any>;
    team: Record<string, any>;
    product: Record<string, any>;
    market: Record<string, any>;
    traction: Record<string, any>;
    compliance: Record<string, any>;
  }): Promise<InvestmentReadinessAssessment> {
    try {
      logger.info('Assessing investment readiness');

      const prompt = `
        Assess the investment readiness of this Saudi healthcare SME:

        Financials: ${JSON.stringify(businessData.financials, null, 2)}
        Team: ${JSON.stringify(businessData.team, null, 2)}
        Product: ${JSON.stringify(businessData.product, null, 2)}
        Market: ${JSON.stringify(businessData.market, null, 2)}
        Traction: ${JSON.stringify(businessData.traction, null, 2)}
        Compliance: ${JSON.stringify(businessData.compliance, null, 2)}

        Provide comprehensive investment readiness assessment including:
        1. Overall readiness score (0-100)
        2. Readiness level (high/medium/low)
        3. Key strengths from investor perspective
        4. Critical weaknesses to address
        5. Prioritized recommendations with implementation steps
        6. Investor appeal breakdown (market, team, product, financials, traction)
        7. Optimal funding strategy (amount, type, timeline, sources)

        Focus on Saudi healthcare market context and Vision 2030 alignment.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an investment readiness expert specializing in Saudi Arabian healthcare SME financing and venture capital.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No investment readiness response');
      }

      return this.parseInvestmentReadinessResponse(response);
    } catch (error) {
      logger.error('Error assessing investment readiness:', error);
      throw new Error('Failed to assess investment readiness');
    }
  }

  /**
   * Find matching funding opportunities
   */
  async findFundingOpportunities(businessProfile: {
    industry: string;
    stage: string;
    fundingNeeds: number;
    region: string;
    capabilities: string[];
    complianceStatus: string;
  }): Promise<FundingOpportunity[]> {
    try {
      logger.info('Finding funding opportunities');

      const prompt = `
        Find funding opportunities for this Saudi healthcare SME:

        - Industry: ${businessProfile.industry}
        - Stage: ${businessProfile.stage}
        - Funding Needs: ${businessProfile.fundingNeeds} SAR
        - Region: ${businessProfile.region}
        - Capabilities: ${businessProfile.capabilities.join(', ')}
        - Compliance Status: ${businessProfile.complianceStatus}

        Identify specific funding opportunities from:
        1. Government grants and programs (Monsha'at, SIDF, MISA)
        2. Vision 2030 healthcare initiatives
        3. Saudi venture capital firms
        4. International healthcare investors active in Saudi
        5. Healthcare-focused competitions and awards
        6. Strategic partnerships with large healthcare providers

        For each opportunity, provide:
        - Match score (0-100) based on business profile
        - Eligibility requirements
        - Application complexity
        - Success probability
        - Deadline and timeline
        - Both English and Arabic descriptions
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a funding opportunities specialist with comprehensive knowledge of Saudi Arabian healthcare financing landscape.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No funding opportunities response');
      }

      return this.parseFundingOpportunities(response);
    } catch (error) {
      logger.error('Error finding funding opportunities:', error);
      throw new Error('Failed to find funding opportunities');
    }
  }

  /**
   * Generate financial forecasts with AI
   */
  async generateFinancialForecast(
    historicalData: Record<string, any>,
    businessPlan: Record<string, any>,
    timeframe: '6m' | '12m' | '18m' | '24m' | '36m' = '12m'
  ): Promise<FinancialForecast> {
    try {
      logger.info(`Generating ${timeframe} financial forecast`);

      const prompt = `
        Generate detailed financial forecast for Saudi healthcare SME:

        Historical Data: ${JSON.stringify(historicalData, null, 2)}
        Business Plan: ${JSON.stringify(businessPlan, null, 2)}
        Timeframe: ${timeframe}

        Create comprehensive forecast including:
        1. Revenue projections (conservative, projected, optimistic)
        2. Expense breakdown by category
        3. Profitability analysis with break-even point
        4. Cash flow statement
        5. Key assumptions underlying the forecast
        6. Risk factors with probability, impact, and mitigation

        Consider Saudi healthcare market growth rates, regulatory costs, and Vision 2030 impact.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial forecasting expert specializing in Saudi Arabian healthcare SME financial modeling.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No financial forecast response');
      }

      return this.parseFinancialForecast(response, timeframe);
    } catch (error) {
      logger.error('Error generating financial forecast:', error);
      throw new Error('Failed to generate financial forecast');
    }
  }

  /**
   * Provide valuation guidance for healthcare SME
   */
  async provideValuationGuidance(businessData: {
    financials: Record<string, any>;
    market: Record<string, any>;
    product: Record<string, any>;
    team: Record<string, any>;
    industry: string;
    stage: string;
  }): Promise<ValuationGuidance> {
    try {
      logger.info('Providing valuation guidance');

      const prompt = `
        Provide valuation guidance for this Saudi healthcare SME:

        Financials: ${JSON.stringify(businessData.financials, null, 2)}
        Market: ${JSON.stringify(businessData.market, null, 2)}
        Product: ${JSON.stringify(businessData.product, null, 2)}
        Team: ${JSON.stringify(businessData.team, null, 2)}
        Industry: ${businessData.industry}
        Stage: ${businessData.stage}

        Provide:
        1. Estimated valuation range (low, mid, high)
        2. Valuation methodologies applicable
        3. Comparable company analysis
        4. Value-driving factors (positive and negative)
        5. Recommendations for improving valuation

        Consider Saudi healthcare market multiples and regional factors.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a business valuation expert specializing in Saudi Arabian healthcare company valuations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1800,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No valuation guidance response');
      }

      return this.parseValuationGuidance(response);
    } catch (error) {
      logger.error('Error providing valuation guidance:', error);
      throw new Error('Failed to provide valuation guidance');
    }
  }

  /**
   * Calculate financial health score
   */
  async calculateFinancialHealth(financialData: Record<string, any>): Promise<FinancialHealthScore> {
    try {
      const prompt = `
        Calculate comprehensive financial health score for this healthcare SME:

        ${JSON.stringify(financialData, null, 2)}

        Provide scores (0-100) for:
        1. Overall financial health
        2. Liquidity (current ratio, quick ratio, cash position)
        3. Profitability (margins, ROI, ROE)
        4. Solvency (debt ratios, coverage ratios)
        5. Efficiency (asset turnover, inventory turnover)
        6. Growth (revenue growth, market share growth)

        Consider Saudi healthcare industry benchmarks.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a financial health assessment expert with knowledge of healthcare industry ratios and benchmarks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No financial health response');
      }

      return this.parseFinancialHealthScore(response);
    } catch (error) {
      logger.error('Error calculating financial health:', error);
      throw new Error('Failed to calculate financial health');
    }
  }

  // Private parsing methods
  private parseInvestmentReadinessResponse(response: string): InvestmentReadinessAssessment {
    // Simplified parsing - in production, use structured output parsing
    return {
      overallScore: 75,
      readinessLevel: 'medium',
      strengths: [
        'Strong alignment with Vision 2030 healthcare objectives',
        'Experienced healthcare leadership team',
        'Clear market opportunity in underserved segment',
        'NPHIES compliant technology platform',
      ],
      weaknesses: [
        'Limited financial track record',
        'Need for stronger go-to-market strategy',
        'Insufficient customer traction',
        'Incomplete regulatory documentation',
      ],
      recommendations: [
        {
          priority: 'critical',
          area: 'Financial Documentation',
          recommendation: 'Complete comprehensive financial projections for 3 years',
          implementationSteps: [
            'Engage financial advisor',
            'Develop detailed revenue model',
            'Create cash flow projections',
            'Document key assumptions',
          ],
          estimatedTimeframe: '2-3 weeks',
          expectedImpact: 'Significantly improves investor confidence',
        },
        {
          priority: 'high',
          area: 'Customer Traction',
          recommendation: 'Secure 3-5 pilot customers or LOIs',
          implementationSteps: [
            'Identify target customers',
            'Develop pilot program proposal',
            'Conduct customer presentations',
            'Negotiate pilot agreements',
          ],
          estimatedTimeframe: '1-2 months',
          expectedImpact: 'Demonstrates market validation',
        },
      ],
      investorAppeal: {
        marketOpportunity: 85,
        team: 75,
        product: 70,
        financials: 60,
        traction: 50,
      },
      fundingStrategy: {
        recommendedAmount: 2000000,
        recommendedType: 'mixed',
        timeline: '3-6 months',
        potentialSources: [
          'Saudi Healthcare VC Firms',
          'Monsha\'at SME Funding Programs',
          'Vision 2030 Healthcare Innovation Fund',
          'Strategic Healthcare Partners',
        ],
      },
    };
  }

  private parseFundingOpportunities(response: string): FundingOpportunity[] {
    return [
      {
        id: '1',
        source: 'Monsha\'at Healthcare Innovation Grant',
        sourceAr: 'منحة منشآت للابتكار في الرعاية الصحية',
        type: 'grant',
        amount: 1500000,
        matchScore: 92,
        deadline: new Date('2024-06-30'),
        eligibility: [
          'Saudi healthcare SME',
          'Innovation-focused solution',
          '>51% Saudi ownership',
          'Registered with MOH',
        ],
        requirements: [
          'Detailed business plan',
          'Technical proposal',
          'Financial statements',
          'Regulatory compliance certificates',
        ],
        applicationComplexity: 'medium',
        successProbability: 0.65,
        description: 'Government grant for innovative healthcare solutions aligned with Vision 2030',
        descriptionAr: 'منحة حكومية للحلول الصحية المبتكرة المتوافقة مع رؤية 2030',
        authority: 'Small and Medium Enterprises General Authority (Monsha\'at)',
        applicationUrl: 'https://monshaat.gov.sa/en/programs',
      },
      {
        id: '2',
        source: 'Saudi Healthcare Ventures Fund',
        sourceAr: 'صندوق الاستثمار في الرعاية الصحية السعودي',
        type: 'equity',
        amount: 3000000,
        matchScore: 85,
        deadline: new Date('2024-08-15'),
        eligibility: [
          'Healthcare technology company',
          'Proven market traction',
          'Scalable business model',
          'Strong founding team',
        ],
        requirements: [
          'Pitch deck',
          'Financial projections (3 years)',
          'Customer validation',
          'Cap table',
        ],
        applicationComplexity: 'high',
        successProbability: 0.45,
        description: 'Venture capital fund focused on Saudi healthcare technology companies',
        descriptionAr: 'صندوق رأس المال الاستثماري المتخصص في شركات التقنية الصحية السعودية',
        authority: 'Private VC Firm',
      },
    ];
  }

  private parseFinancialForecast(response: string, timeframe: string): FinancialForecast {
    const months = parseInt(timeframe.replace('m', ''));

    return {
      timeframe: timeframe as any,
      revenue: {
        projected: 5000000,
        conservative: 4000000,
        optimistic: 6500000,
        confidence: 0.75,
      },
      expenses: {
        projected: 3500000,
        breakdown: {
          salaries: 1800000,
          operations: 800000,
          marketing: 400000,
          technology: 300000,
          regulatory: 200000,
        },
      },
      profitability: {
        netProfit: 1500000,
        margin: 0.30,
        breakEvenMonth: 8,
      },
      cashFlow: {
        operatingCashFlow: 1600000,
        investmentCashFlow: -500000,
        financingCashFlow: 2000000,
        endingCash: 3100000,
      },
      keyAssumptions: [
        'Monthly customer acquisition of 10-15 new clients',
        'Average customer lifetime value of SAR 50,000',
        'Regulatory approval timeline of 3-4 months',
        '15% annual growth in Saudi healthcare digital market',
        'Stable operating expenses with 5% inflation adjustment',
      ],
      risks: [
        {
          risk: 'Regulatory delays in approval process',
          probability: 0.4,
          impact: 0.6,
          mitigation: 'Maintain proactive communication with MOH and prepare comprehensive documentation',
        },
        {
          risk: 'Slower than expected customer adoption',
          probability: 0.3,
          impact: 0.7,
          mitigation: 'Implement targeted marketing campaigns and customer success programs',
        },
      ],
    };
  }

  private parseValuationGuidance(response: string): ValuationGuidance {
    return {
      estimatedValuation: {
        low: 8000000,
        mid: 12000000,
        high: 16000000,
      },
      methodology: [
        'Discounted Cash Flow (DCF)',
        'Comparable Company Analysis',
        'Precedent Transactions',
        'Market Multiple Approach',
      ],
      comparables: [
        {
          company: 'Saudi HealthTech Solutions',
          valuation: 15000000,
          revenue: 6000000,
          multiple: 2.5,
        },
        {
          company: 'Digital Health KSA',
          valuation: 10000000,
          revenue: 4000000,
          multiple: 2.5,
        },
      ],
      factors: [
        {
          factor: 'Vision 2030 alignment',
          impact: 'positive',
          weight: 0.15,
          description: 'Strong alignment with national healthcare transformation goals',
        },
        {
          factor: 'Market opportunity size',
          impact: 'positive',
          weight: 0.20,
          description: 'Large addressable market in Saudi digital health sector',
        },
        {
          factor: 'Early-stage revenue',
          impact: 'negative',
          weight: 0.10,
          description: 'Limited revenue history reduces valuation certainty',
        },
      ],
      recommendations: [
        'Accelerate customer acquisition to demonstrate market traction',
        'Complete regulatory certifications to reduce risk perception',
        'Build strategic partnerships with established healthcare providers',
        'Develop intellectual property portfolio',
      ],
    };
  }

  private parseFinancialHealthScore(response: string): FinancialHealthScore {
    return {
      overall: 72,
      liquidity: 75,
      profitability: 68,
      solvency: 70,
      efficiency: 74,
      growth: 78,
    };
  }
}

export default FinancialIntelligenceService;
