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
declare class MarketIntelligenceService {
    private openai;
    constructor();
    /**
     * Get real-time healthcare market trends in Saudi Arabia
     */
    getHealthcareMarketTrends(industry?: string, region?: string): Promise<MarketTrend[]>;
    /**
     * Analyze competitive landscape for healthcare SMEs
     */
    analyzeCompetitors(industry: string, region: string, companySize: 'startup' | 'small' | 'medium'): Promise<CompetitorAnalysis[]>;
    /**
     * Identify market opportunities for healthcare SMEs
     */
    identifyMarketOpportunities(businessProfile: {
        industry: string;
        size: string;
        capabilities: string[];
        budget: number;
        timeline: string;
    }): Promise<MarketOpportunity[]>;
    /**
     * Get regulatory updates affecting healthcare SMEs
     */
    getRegulatoryUpdates(relevantAuthorities?: string[]): Promise<RegulatoryUpdate[]>;
    /**
     * Find government incentives and support programs
     */
    getGovernmentIncentives(businessType: string, region: string): Promise<GovernmentIncentive[]>;
    /**
     * Get comprehensive market intelligence dashboard data
     */
    getMarketIntelligenceDashboard(smeProfile: {
        industry: string;
        region: string;
        size: string;
        interests: string[];
    }): Promise<{
        trends: MarketTrend[];
        opportunities: MarketOpportunity[];
        regulations: RegulatoryUpdate[];
        incentives: GovernmentIncentive[];
        competitors: CompetitorAnalysis[];
    }>;
    private parseMarketTrends;
    private parseCompetitorAnalysis;
    private parseMarketOpportunities;
    private parseRegulatoryUpdates;
    private parseGovernmentIncentives;
}
export default MarketIntelligenceService;
//# sourceMappingURL=marketIntelligenceService.d.ts.map