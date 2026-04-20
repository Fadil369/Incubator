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
declare class FinancialIntelligenceService {
    private openai;
    constructor();
    /**
     * Assess investment readiness of healthcare SME
     */
    assessInvestmentReadiness(businessData: {
        financials: Record<string, any>;
        team: Record<string, any>;
        product: Record<string, any>;
        market: Record<string, any>;
        traction: Record<string, any>;
        compliance: Record<string, any>;
    }): Promise<InvestmentReadinessAssessment>;
    /**
     * Find matching funding opportunities
     */
    findFundingOpportunities(businessProfile: {
        industry: string;
        stage: string;
        fundingNeeds: number;
        region: string;
        capabilities: string[];
        complianceStatus: string;
    }): Promise<FundingOpportunity[]>;
    /**
     * Generate financial forecasts with AI
     */
    generateFinancialForecast(historicalData: Record<string, any>, businessPlan: Record<string, any>, timeframe?: '6m' | '12m' | '18m' | '24m' | '36m'): Promise<FinancialForecast>;
    /**
     * Provide valuation guidance for healthcare SME
     */
    provideValuationGuidance(businessData: {
        financials: Record<string, any>;
        market: Record<string, any>;
        product: Record<string, any>;
        team: Record<string, any>;
        industry: string;
        stage: string;
    }): Promise<ValuationGuidance>;
    /**
     * Calculate financial health score
     */
    calculateFinancialHealth(financialData: Record<string, any>): Promise<FinancialHealthScore>;
    private parseInvestmentReadinessResponse;
    private parseFundingOpportunities;
    private parseFinancialForecast;
    private parseValuationGuidance;
    private parseFinancialHealthScore;
}
export default FinancialIntelligenceService;
//# sourceMappingURL=financialIntelligenceService.d.ts.map