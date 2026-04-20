export interface DocumentOptimizationRequest {
    documentType: 'business_plan' | 'feasibility_study' | 'financial_projection' | 'compliance_report';
    content: string;
    businessContext: {
        industry: string;
        region: string;
        companySize: string;
        targetMarket: string[];
    };
    language: 'en' | 'ar' | 'both';
    optimizationGoals: string[];
}
export interface DocumentOptimizationResponse {
    optimizedContent: string;
    optimizedContentAr?: string;
    improvements: Array<{
        section: string;
        improvement: string;
        improvementAr: string;
        reasoning: string;
        impact: 'high' | 'medium' | 'low';
    }>;
    complianceCheck: {
        score: number;
        issues: Array<{
            issue: string;
            severity: 'critical' | 'warning' | 'info';
            recommendation: string;
        }>;
    };
    marketAlignment: {
        score: number;
        recommendations: string[];
    };
    additionalSections: Array<{
        title: string;
        content: string;
        rationale: string;
    }>;
}
export interface DocumentAnalysisRequest {
    documentType: string;
    content: string;
    analysisType: 'completeness' | 'accuracy' | 'compliance' | 'market_fit' | 'financial_viability';
    businessContext?: Record<string, any>;
}
export interface DocumentAnalysisResponse {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: Array<{
        priority: 'high' | 'medium' | 'low';
        recommendation: string;
        implementation: string;
        expectedImpact: string;
    }>;
    detailedAnalysis: Record<string, {
        score: number;
        comments: string[];
        suggestions: string[];
    }>;
}
export interface TemplateGenerationRequest {
    templateType: 'business_plan' | 'feasibility_study' | 'funding_proposal' | 'compliance_document';
    businessProfile: {
        name: string;
        industry: string;
        stage: 'startup' | 'growth' | 'expansion';
        targetMarket: string[];
        uniqueValue: string;
    };
    requirements: string[];
    language: 'en' | 'ar' | 'both';
}
export interface TemplateGenerationResponse {
    template: {
        sections: Array<{
            title: string;
            titleAr?: string;
            content: string;
            contentAr?: string;
            type: 'text' | 'table' | 'chart' | 'list';
            placeholder?: string;
            required: boolean;
        }>;
    };
    guidelines: {
        writingStyle: string;
        keyMetrics: string[];
        industrySpecific: string[];
    };
    resources: Array<{
        name: string;
        type: 'template' | 'guide' | 'example' | 'tool';
        url?: string;
        description: string;
    }>;
}
declare class DocumentAIService {
    private openai;
    private anthropic;
    constructor();
    /**
     * Optimize existing documents using AI
     */
    optimizeDocument(request: DocumentOptimizationRequest): Promise<DocumentOptimizationResponse>;
    /**
     * Analyze document quality and provide feedback
     */
    analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResponse>;
    /**
     * Generate intelligent document templates
     */
    generateTemplate(request: TemplateGenerationRequest): Promise<TemplateGenerationResponse>;
    /**
     * Validate document compliance with Saudi regulations
     */
    validateCompliance(documentContent: string, documentType: string, regulations?: string[]): Promise<{
        overallCompliance: number;
        regulatoryChecks: Array<{
            regulation: string;
            status: 'compliant' | 'non_compliant' | 'partial' | 'unclear';
            score: number;
            issues: Array<{
                severity: 'critical' | 'warning' | 'info';
                description: string;
                recommendation: string;
                reference?: string;
            }>;
        }>;
        recommendations: string[];
    }>;
    /**
     * Generate content for specific document sections
     */
    generateSectionContent(sectionType: string, businessContext: Record<string, any>, requirements: string[], language?: 'en' | 'ar' | 'both'): Promise<{
        content: string;
        contentAr?: string;
        suggestions: string[];
        resources: Array<{
            name: string;
            description: string;
            url?: string;
        }>;
    }>;
    private createOptimizationPrompt;
    private getSystemPromptForDocumentType;
    private parseOptimizationResponse;
    private parseAnalysisResponse;
    private parseTemplateResponse;
    private parseComplianceResponse;
    private parseSectionContentResponse;
}
export default DocumentAIService;
//# sourceMappingURL=documentAIService.d.ts.map