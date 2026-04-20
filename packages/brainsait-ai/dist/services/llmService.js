import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { logger } from '../utils/logger';
export const LLMProviderSchema = z.enum(['openai', 'anthropic', 'claude']);
export const LLMRequestSchema = z.object({
    prompt: z.string(),
    model: z.string().optional(),
    maxTokens: z.number().optional().default(1000),
    temperature: z.number().optional().default(0.7),
    provider: LLMProviderSchema.optional().default('openai'),
    systemPrompt: z.string().optional(),
    userId: z.string(),
    feature: z.string(),
});
export class LLMService {
    openai = null;
    anthropic = null;
    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        if (process.env.CLAUDE_API_KEY) {
            this.anthropic = new Anthropic({
                apiKey: process.env.CLAUDE_API_KEY,
            });
        }
    }
    async generateCompletion(request) {
        const validatedRequest = LLMRequestSchema.parse(request);
        logger.info('Generating LLM completion', {
            provider: validatedRequest.provider,
            feature: validatedRequest.feature,
            userId: validatedRequest.userId,
        });
        try {
            switch (validatedRequest.provider) {
                case 'anthropic':
                case 'claude':
                    return await this.generateClaudeCompletion(validatedRequest);
                case 'openai':
                default:
                    return await this.generateOpenAICompletion(validatedRequest);
            }
        }
        catch (error) {
            logger.error('LLM generation failed', { error, request: validatedRequest });
            throw new Error('Failed to generate AI response');
        }
    }
    async generateOpenAICompletion(request) {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }
        const messages = [];
        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({ role: 'user', content: request.prompt });
        const completion = await this.openai.chat.completions.create({
            model: request.model || 'gpt-4-turbo-preview',
            messages,
            max_tokens: request.maxTokens,
            temperature: request.temperature,
        });
        const response = completion.choices[0];
        const usage = completion.usage;
        return {
            content: response.message?.content || '',
            usage: {
                promptTokens: usage?.prompt_tokens || 0,
                completionTokens: usage?.completion_tokens || 0,
                totalTokens: usage?.total_tokens || 0,
            },
            model: completion.model,
            provider: 'openai',
        };
    }
    async generateClaudeCompletion(request) {
        if (!this.anthropic) {
            throw new Error('Claude API key not configured');
        }
        const messages = [
            { role: 'user', content: request.prompt },
        ];
        const response = await this.anthropic.messages.create({
            model: request.model || 'claude-3-5-sonnet-20241022',
            system: request.systemPrompt,
            messages,
            max_tokens: request.maxTokens ?? 1000,
        });
        const contentBlock = response.content[0];
        if (!contentBlock) {
            throw new Error('Anthropic returned an empty content array');
        }
        const textContent = contentBlock.type === 'text' ? contentBlock.text : '';
        return {
            content: textContent,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            model: response.model,
            provider: 'anthropic',
        };
    }
    async generateClaimsAnalysis(claimData) {
        const prompt = `Analyze the following healthcare claim for Saudi Arabian insurance compliance:
    
    Claim Details:
    ${JSON.stringify(claimData, null, 2)}
    
    Please provide:
    1. NPHIES compliance status
    2. Potential issues or red flags
    3. Recommendations for approval
    4. Required documentation checklist
    
    Format the response in a structured way suitable for healthcare administrators.`;
        const response = await this.generateCompletion({
            prompt,
            systemPrompt: 'You are an expert in Saudi Arabian healthcare insurance claims processing and NPHIES compliance.',
            feature: 'claims_analysis',
            userId: claimData.userId || 'system',
            provider: 'openai',
            maxTokens: 1500,
            temperature: 0.3,
        });
        return response.content;
    }
    async generateComplianceReport(complianceData) {
        const prompt = `Generate a comprehensive compliance report for the following healthcare SME data:
    
    ${JSON.stringify(complianceData, null, 2)}
    
    Include:
    1. MOH compliance status
    2. NPHIES readiness assessment
    3. HIPAA alignment (if applicable)
    4. Recommendations for improvement
    5. Risk assessment
    
    Format as a professional compliance report.`;
        const response = await this.generateCompletion({
            prompt,
            systemPrompt: 'You are a Saudi Arabian healthcare compliance expert specializing in MOH and NPHIES regulations.',
            feature: 'compliance_report',
            userId: complianceData.userId || 'system',
            provider: 'openai',
            maxTokens: 2000,
            temperature: 0.4,
        });
        return response.content;
    }
    async transcribeAndSummarize(transcription, context) {
        const prompt = `Summarize the following patient contact transcription:
    
    Transcription:
    ${transcription}
    
    Context:
    ${JSON.stringify(context, null, 2)}
    
    Provide:
    1. Key points discussed
    2. Action items
    3. Follow-up requirements
    4. Sentiment analysis
    5. Compliance considerations
    
    Format for healthcare record keeping.`;
        const response = await this.generateCompletion({
            prompt,
            systemPrompt: 'You are a healthcare communication specialist experienced in patient interaction documentation.',
            feature: 'contact_summary',
            userId: context.userId || 'system',
            provider: 'openai',
            maxTokens: 1000,
            temperature: 0.5,
        });
        return {
            summary: response.content,
            usage: response.usage,
        };
    }
}
export const llmService = new LLMService();
//# sourceMappingURL=llmService.js.map