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
        factors: Array<{
            factor: string;
            score: number;
            description: string;
        }>;
    };
}
declare class AIAnalyticsService {
    private openai;
    constructor();
    private requireOpenAI;
    /**
     * Generate AI-powered business insights for healthcare SMEs
     */
    generateBusinessInsights(request: AIAnalyticsRequest): Promise<AIAnalyticsResponse>;
    /**
     * Generate market intelligence for Saudi healthcare sector
     */
    generateMarketIntelligence(industry: string, region: string): Promise<BusinessInsight[]>;
    /**
     * Analyze financial data and provide AI recommendations
     */
    analyzeFinancialData(financialData: Record<string, unknown>): Promise<BusinessInsight[]>;
    /**
     * Generate predictive analytics for business performance
     */
    generatePredictiveAnalytics(historicalData: Record<string, unknown>, businessContext: AIAnalyticsRequest): Promise<{
        predictions: Array<{
            metric: string;
            value: number;
            confidence: number;
            timeframe: string;
        }>;
        trends: BusinessInsight[];
    }>;
    private createBusinessAnalysisPrompt;
}
export default AIAnalyticsService;
//# sourceMappingURL=aiAnalyticsService.d.ts.map