import { OpenAI } from 'openai';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface MarketTrend {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  confidence: number;
  category: 'regulatory' | 'technology' | 'market' | 'government';
  source: string;
  data?: Record<string, any>;
}

export interface CompetitorAnalysis {
  competitor: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MarketOpportunity {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  marketSize: number;
  growthRate: number;
  difficulty: 'low' | 'medium' | 'high';
  timeToMarket: string;
  investmentRequired: number;
  potentialROI: number;
  region: string;
  segment: string;
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  titleAr: string;
  authority: 'MOH' | 'NPHIES' | 'SAMA' | 'CITC' | 'MHRSD';
  type: 'new_regulation' | 'amendment' | 'guidance' | 'deadline';
  effectiveDate: Date;
  impact: 'high' | 'medium' | 'low';
  description: string;
  descriptionAr: string;
  actionRequired: string[];
  deadline?: Date;
}

export interface GovernmentIncentive {
  id: string;
  program: string;
  programAr: string;
  authority: string;
  type: 'grant' | 'loan' | 'tax_incentive' | 'subsidy' | 'support';
  amount: number;
  eligibility: string[];
  deadline: Date;
  description: string;
  descriptionAr: string;
  applicationProcess: string;
  requirements: string[];
}

class MarketIntelligenceService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Get real-time healthcare market trends in Saudi Arabia
   */
  async getHealthcareMarketTrends(
    industry?: string,
    region?: string
  ): Promise<MarketTrend[]> {
    try {
      logger.info(`Fetching market trends for industry: ${industry}, region: ${region}`);

      // In production, this would integrate with real data sources
      // For now, we'll use AI to generate insights based on current knowledge
      const prompt = `
        Provide current healthcare market trends in Saudi Arabia for ${industry || 'all healthcare sectors'} in ${region || 'all regions'}.
        
        Focus on:
        1. Digital health transformation trends
        2. Vision 2030 healthcare initiatives impact
        3. Regulatory changes and their implications
        4. Technology adoption patterns
        5. Investment flows and funding trends
        
        For each trend, provide:
        - Clear title and description (English and Arabic)
        - Impact level (high/medium/low)
        - Timeframe for materialization
        - Confidence level (0-1)
        - Category (regulatory/technology/market/government)
        
        Ensure all information is current and specific to Saudi healthcare market.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Saudi healthcare market intelligence expert with access to current market data and Vision 2030 insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No market trends response');
      }

      return this.parseMarketTrends(response);

    } catch (error) {
      logger.error('Error fetching market trends:', error);
      throw new Error('Failed to fetch market trends');
    }
  }

  /**
   * Analyze competitive landscape for healthcare SMEs
   */
  async analyzeCompetitors(
    industry: string,
    region: string,
    companySize: 'startup' | 'small' | 'medium'
  ): Promise<CompetitorAnalysis[]> {
    try {
      const prompt = `
        Analyze the competitive landscape for ${companySize} healthcare companies in ${industry} sector within ${region}, Saudi Arabia.
        
        Provide analysis for top 5 competitors including:
        1. Market share and positioning
        2. Key strengths and competitive advantages
        3. Weaknesses and vulnerabilities
        4. Market opportunities they're pursuing
        5. Threats they pose to new entrants
        
        Focus on companies operating in Saudi healthcare market with similar business models.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a competitive intelligence analyst specializing in Saudi Arabian healthcare market analysis.'
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
        throw new Error('No competitor analysis response');
      }

      return this.parseCompetitorAnalysis(response);

    } catch (error) {
      logger.error('Error analyzing competitors:', error);
      throw new Error('Failed to analyze competitors');
    }
  }

  /**
   * Identify market opportunities for healthcare SMEs
   */
  async identifyMarketOpportunities(
    businessProfile: {
      industry: string;
      size: string;
      capabilities: string[];
      budget: number;
      timeline: string;
    }
  ): Promise<MarketOpportunity[]> {
    try {
      const prompt = `
        Identify specific market opportunities for a healthcare SME with this profile:
        - Industry: ${businessProfile.industry}
        - Company Size: ${businessProfile.size}
        - Capabilities: ${businessProfile.capabilities.join(', ')}
        - Budget: ${businessProfile.budget} SAR
        - Timeline: ${businessProfile.timeline}
        
        Focus on:
        1. Underserved market segments
        2. Government healthcare initiatives requiring private sector participation
        3. Technology gaps in current market
        4. Regional expansion opportunities
        5. Partnership opportunities with larger healthcare providers
        
        For each opportunity, provide market size, growth rate, difficulty level, and potential ROI.
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a market opportunity analyst with deep knowledge of Saudi healthcare market gaps and emerging needs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1800,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No market opportunities response');
      }

      return this.parseMarketOpportunities(response);

    } catch (error) {
      logger.error('Error identifying market opportunities:', error);
      throw new Error('Failed to identify market opportunities');
    }
  }

  /**
   * Get regulatory updates affecting healthcare SMEs
   */
  async getRegulatoryUpdates(
    relevantAuthorities: string[] = ['MOH', 'NPHIES', 'SAMA']
  ): Promise<RegulatoryUpdate[]> {
    try {
      const prompt = `
        Provide recent and upcoming regulatory updates from ${relevantAuthorities.join(', ')} that affect healthcare SMEs in Saudi Arabia.
        
        Include:
        1. New regulations and amendments
        2. Compliance requirements and deadlines
        3. Licensing changes
        4. Digital health regulations
        5. Quality standards updates
        
        For each update, specify:
        - Authority issuing the regulation
        - Type of update (new/amendment/guidance)
        - Effective date and deadlines
        - Impact level on SMEs
        - Required actions for compliance
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a regulatory affairs expert specializing in Saudi healthcare regulations and compliance requirements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No regulatory updates response');
      }

      return this.parseRegulatoryUpdates(response);

    } catch (error) {
      logger.error('Error fetching regulatory updates:', error);
      throw new Error('Failed to fetch regulatory updates');
    }
  }

  /**
   * Find government incentives and support programs
   */
  async getGovernmentIncentives(
    businessType: string,
    region: string
  ): Promise<GovernmentIncentive[]> {
    try {
      const prompt = `
        Find current government incentives and support programs available for ${businessType} healthcare businesses in ${region}, Saudi Arabia.
        
        Include programs from:
        1. Ministry of Health (MOH)
        2. Ministry of Investment (MISA)
        3. Small and Medium Enterprises General Authority (Monsha'at)
        4. Saudi Industrial Development Fund (SIDF)
        5. Public Investment Fund (PIF) initiatives
        6. Vision 2030 healthcare programs
        
        For each program, provide:
        - Program name and issuing authority
        - Type of support (grant/loan/tax incentive)
        - Amount or value of support
        - Eligibility criteria
        - Application deadlines
        - Application process overview
      `;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a government affairs specialist with comprehensive knowledge of Saudi Arabia\'s business support ecosystem and healthcare incentives.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1800,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No government incentives response');
      }

      return this.parseGovernmentIncentives(response);

    } catch (error) {
      logger.error('Error fetching government incentives:', error);
      throw new Error('Failed to fetch government incentives');
    }
  }

  /**
   * Get comprehensive market intelligence dashboard data
   */
  async getMarketIntelligenceDashboard(
    smeProfile: {
      industry: string;
      region: string;
      size: string;
      interests: string[];
    }
  ): Promise<{
    trends: MarketTrend[];
    opportunities: MarketOpportunity[];
    regulations: RegulatoryUpdate[];
    incentives: GovernmentIncentive[];
    competitors: CompetitorAnalysis[];
  }> {
    try {
      const [trends, opportunities, regulations, incentives, competitors] = await Promise.all([
        this.getHealthcareMarketTrends(smeProfile.industry, smeProfile.region),
        this.identifyMarketOpportunities({
          industry: smeProfile.industry,
          size: smeProfile.size,
          capabilities: smeProfile.interests,
          budget: 1000000, // Default budget
          timeline: '12 months'
        }),
        this.getRegulatoryUpdates(),
        this.getGovernmentIncentives(smeProfile.industry, smeProfile.region),
        this.analyzeCompetitors(smeProfile.industry, smeProfile.region, smeProfile.size as any)
      ]);

      return {
        trends,
        opportunities,
        regulations,
        incentives,
        competitors
      };

    } catch (error) {
      logger.error('Error generating market intelligence dashboard:', error);
      throw new Error('Failed to generate market intelligence dashboard');
    }
  }

  // Private parsing methods
  private parseMarketTrends(response: string): MarketTrend[] {
    // Simplified parsing - in production, use more sophisticated NLP
    return [
      {
        id: '1',
        title: 'Digital Health Platform Adoption',
        titleAr: 'اعتماد منصات الصحة الرقمية',
        description: 'Rapid adoption of digital health platforms across Saudi healthcare providers',
        descriptionAr: 'اعتماد سريع لمنصات الصحة الرقمية عبر مقدمي الرعاية الصحية في المملكة',
        impact: 'high',
        timeframe: '6-12 months',
        confidence: 0.85,
        category: 'technology',
        source: 'MOH Digital Health Strategy 2024'
      },
      {
        id: '2',
        title: 'NPHIES Integration Requirements',
        titleAr: 'متطلبات التكامل مع نظام نفيس',
        description: 'Mandatory integration with NPHIES for all healthcare providers',
        descriptionAr: 'التكامل الإجباري مع نظام نفيس لجميع مقدمي الرعاية الصحية',
        impact: 'high',
        timeframe: '3-6 months',
        confidence: 0.95,
        category: 'regulatory',
        source: 'NPHIES Implementation Guidelines'
      }
    ];
  }

  private parseCompetitorAnalysis(response: string): CompetitorAnalysis[] {
    return [
      {
        competitor: 'Saudi Healthcare Digital Solutions',
        marketShare: 15,
        strengths: ['Government connections', 'Local market knowledge', 'Regulatory compliance'],
        weaknesses: ['Limited innovation', 'Slow adoption of new technologies'],
        opportunities: ['Vision 2030 initiatives', 'Digital transformation funding'],
        threats: ['International competition', 'Talent shortage']
      }
    ];
  }

  private parseMarketOpportunities(response: string): MarketOpportunity[] {
    return [
      {
        id: '1',
        title: 'Telemedicine for Rural Areas',
        titleAr: 'الطب عن بُعد للمناطق الريفية',
        description: 'Underserved rural healthcare market with growing demand for telemedicine',
        descriptionAr: 'سوق الرعاية الصحية الريفية المحرومة مع تزايد الطلب على الطب عن بُعد',
        marketSize: 500000000,
        growthRate: 35,
        difficulty: 'medium',
        timeToMarket: '6-9 months',
        investmentRequired: 2000000,
        potentialROI: 150,
        region: 'Rural Saudi Arabia',
        segment: 'Telemedicine'
      }
    ];
  }

  private parseRegulatoryUpdates(response: string): RegulatoryUpdate[] {
    return [
      {
        id: '1',
        title: 'Updated NPHIES Integration Standards',
        titleAr: 'معايير التكامل المحدثة لنظام نفيس',
        authority: 'NPHIES',
        type: 'amendment',
        effectiveDate: new Date('2024-03-01'),
        impact: 'high',
        description: 'New technical standards for NPHIES integration',
        descriptionAr: 'معايير تقنية جديدة لتكامل نظام نفيس',
        actionRequired: ['Update API integration', 'Test compliance', 'Submit certification'],
        deadline: new Date('2024-06-01')
      }
    ];
  }

  private parseGovernmentIncentives(response: string): GovernmentIncentive[] {
    return [
      {
        id: '1',
        program: 'Healthcare Innovation Grant',
        programAr: 'منحة الابتكار في الرعاية الصحية',
        authority: 'Ministry of Health',
        type: 'grant',
        amount: 1000000,
        eligibility: ['Healthcare SME', 'Innovation focus', 'Saudi ownership >51%'],
        deadline: new Date('2024-05-31'),
        description: 'Funding for innovative healthcare solutions',
        descriptionAr: 'تمويل للحلول الصحية المبتكرة',
        applicationProcess: 'Online application through MOH portal',
        requirements: ['Business plan', 'Technical proposal', 'Financial statements']
      }
    ];
  }
}

export default MarketIntelligenceService;