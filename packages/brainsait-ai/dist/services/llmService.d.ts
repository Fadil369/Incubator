import { z } from 'zod';
export declare const LLMProviderSchema: z.ZodEnum<["openai", "anthropic", "claude"]>;
export type LLMProvider = z.infer<typeof LLMProviderSchema>;
export declare const LLMRequestSchema: z.ZodObject<{
    prompt: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    temperature: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    provider: z.ZodDefault<z.ZodOptional<z.ZodEnum<["openai", "anthropic", "claude"]>>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    feature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    prompt: string;
    provider: "openai" | "anthropic" | "claude";
    maxTokens: number;
    temperature: number;
    feature: string;
    systemPrompt?: string | undefined;
    model?: string | undefined;
}, {
    userId: string;
    prompt: string;
    feature: string;
    systemPrompt?: string | undefined;
    provider?: "openai" | "anthropic" | "claude" | undefined;
    model?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
}>;
export type LLMRequest = z.infer<typeof LLMRequestSchema>;
export interface LLMResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    provider: LLMProvider;
}
export declare class LLMService {
    private openai;
    private anthropic;
    constructor();
    generateCompletion(request: LLMRequest): Promise<LLMResponse>;
    private generateOpenAICompletion;
    private generateClaudeCompletion;
    generateClaimsAnalysis(claimData: any): Promise<string>;
    generateComplianceReport(complianceData: any): Promise<string>;
    transcribeAndSummarize(transcription: string, context: any): Promise<any>;
}
export declare const llmService: LLMService;
//# sourceMappingURL=llmService.d.ts.map