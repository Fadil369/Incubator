import { OpenAI } from 'openai';
import { logger } from '../utils/logger';
class AIAnalyticsService {
    openai = null;
    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }
    }
    requireOpenAI() {
        if (!this.openai)
            throw new Error('OpenAI API key not configured');
        return this.openai;
    }
    /**
     * Generate AI-powered business insights for healthcare SMEs
     */
    async generateBusinessInsights(request) {
        try {
            logger.info(`Generating AI insights for SME: ${request.smeId}`);
            const prompt = this.createBusinessAnalysisPrompt(request);
            const openai = this.requireOpenAI();
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a business intelligence expert specializing in Saudi Arabian healthcare SMEs. ' +
                            'Respond ONLY with a valid JSON object matching the AIAnalyticsResponse schema. ' +
                            'Include English and Arabic fields where indicated.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: 'json_object' },
            });
            const aiResponse = completion.choices[0]?.message?.content;
            if (!aiResponse)
                throw new Error('No response from AI service');
            const parsed = JSON.parse(aiResponse);
            logger.info(`Successfully generated insights for SME: ${request.smeId}`);
            return parsed;
        }
        catch (error) {
            logger.error('Error generating business insights:', error);
            throw new Error('Failed to generate AI insights');
        }
    }
    /**
     * Generate market intelligence for Saudi healthcare sector
     */
    async generateMarketIntelligence(industry, region) {
        try {
            const openai = this.requireOpenAI();
            const prompt = `
        Analyze the Saudi healthcare market for ${industry} businesses in ${region}.
        Focus on:
        1. Current market trends and opportunities
        2. Regulatory environment and changes
        3. Government initiatives and support programs
        4. Competitive landscape
        5. Growth projections for 2024-2025

        Respond ONLY with a JSON object in the form {"insights":[...]} where insights is an array of BusinessInsight objects with the fields:
        type, title, titleAr, description, descriptionAr, confidence, impact, category.
        Values for Vision 2030 healthcare objectives specific to Saudi Arabia.
      `;
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a Saudi healthcare market analyst with deep knowledge of Vision 2030 and local healthcare regulations. ' +
                            'Respond ONLY with valid JSON.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.6,
                max_tokens: 1500,
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response)
                throw new Error('No market intelligence response');
            const parsed = JSON.parse(response);
            return Array.isArray(parsed) ? parsed : (parsed.insights ?? []);
        }
        catch (error) {
            logger.error('Error generating market intelligence:', error);
            throw new Error('Failed to generate market intelligence');
        }
    }
    /**
     * Analyze financial data and provide AI recommendations
     */
    async analyzeFinancialData(financialData) {
        try {
            const openai = this.requireOpenAI();
            const prompt = `
        Analyze the following financial data for a Saudi healthcare SME:
        ${JSON.stringify(financialData, null, 2)}

        Provide:
        1. Financial health assessment
        2. Cash flow analysis
        3. Investment recommendations
        4. Risk factors
        5. Growth opportunities

        Respond ONLY with a JSON object containing an "insights" array of BusinessInsight objects.
        Consider Saudi market conditions and healthcare industry specifics.
      `;
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a financial analysis expert specializing in Saudi healthcare SME financial assessment. ' +
                            'Respond ONLY with valid JSON.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.5,
                max_tokens: 1000,
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response)
                throw new Error('No financial analysis response');
            const parsed = JSON.parse(response);
            return parsed.insights ?? [];
        }
        catch (error) {
            logger.error('Error analyzing financial data:', error);
            throw new Error('Failed to analyze financial data');
        }
    }
    /**
     * Generate predictive analytics for business performance
     */
    async generatePredictiveAnalytics(historicalData, businessContext) {
        try {
            const openai = this.requireOpenAI();
            const prompt = `
        Based on this historical data and business context, generate predictive analytics:

        Historical Data: ${JSON.stringify(historicalData, null, 2)}
        Business Context: ${JSON.stringify(businessContext.businessData, null, 2)}

        Respond ONLY with a JSON object containing:
        - "predictions": array with fields: metric, value (number), confidence (0-1), timeframe
        - "trends": array of BusinessInsight objects

        Focus on Saudi healthcare market dynamics and Vision 2030 alignment.
      `;
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a predictive analytics expert specializing in Saudi healthcare SME growth forecasting. ' +
                            'Respond ONLY with valid JSON.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.5,
                max_tokens: 1500,
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response)
                throw new Error('No predictive analytics response');
            return JSON.parse(response);
        }
        catch (error) {
            logger.error('Error generating predictive analytics:', error);
            throw new Error('Failed to generate predictive analytics');
        }
    }
    createBusinessAnalysisPrompt(request) {
        return `
      Analyze this Saudi healthcare SME and provide comprehensive business insights as a JSON object.

      Business Data:
      - Industry: ${request.businessData.industry}
      - Region: ${request.businessData.region}
      - Revenue: ${request.businessData.revenue || 'Not provided'}
      - Growth Rate: ${request.businessData.growth || 'Not provided'}
      - Employees: ${request.businessData.employees || 'Not provided'}

      Return a JSON object with the AIAnalyticsResponse structure:
      {
        "insights": [ { "type", "title", "titleAr", "description", "descriptionAr", "confidence", "impact", "category", "actionItems" } ],
        "summary": "...",
        "summaryAr": "...",
        "confidence": 0.0-1.0,
        "recommendations": ["..."],
        "riskAssessment": { "overall": 0.0-1.0, "factors": [ { "factor", "score", "description" } ] }
      }

      Align recommendations with Vision 2030 healthcare objectives.
    `;
    }
}
export default AIAnalyticsService;
//# sourceMappingURL=aiAnalyticsService.js.map