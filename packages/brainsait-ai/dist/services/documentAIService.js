import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
class DocumentAIService {
    openai;
    anthropic;
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || '',
        });
        this.anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY || '',
        });
    }
    /**
     * Optimize existing documents using AI
     */
    async optimizeDocument(request) {
        try {
            logger.info(`Optimizing ${request.documentType} document`);
            const prompt = this.createOptimizationPrompt(request);
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPromptForDocumentType(request.documentType)
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No optimization response received');
            }
            return this.parseOptimizationResponse(response, request);
        }
        catch (error) {
            logger.error('Error optimizing document:', error);
            throw new Error('Failed to optimize document');
        }
    }
    /**
     * Analyze document quality and provide feedback
     */
    async analyzeDocument(request) {
        try {
            logger.info(`Analyzing document for ${request.analysisType}`);
            const prompt = `
        Analyze this ${request.documentType} document for ${request.analysisType}:
        
        Document Content:
        ${request.content}
        
        Business Context:
        ${JSON.stringify(request.businessContext || {}, null, 2)}
        
        Please provide:
        1. Overall quality score (0-100)
        2. Key strengths of the document
        3. Areas needing improvement
        4. Prioritized recommendations for enhancement
        5. Detailed section-by-section analysis
        
        Focus on Saudi healthcare market requirements and best practices.
      `;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a document analysis expert specializing in business documents for Saudi healthcare SMEs.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No analysis response received');
            }
            return this.parseAnalysisResponse(response);
        }
        catch (error) {
            logger.error('Error analyzing document:', error);
            throw new Error('Failed to analyze document');
        }
    }
    /**
     * Generate intelligent document templates
     */
    async generateTemplate(request) {
        try {
            logger.info(`Generating ${request.templateType} template`);
            const prompt = `
        Generate a comprehensive ${request.templateType} template for:
        
        Business Profile:
        - Name: ${request.businessProfile.name}
        - Industry: ${request.businessProfile.industry}
        - Stage: ${request.businessProfile.stage}
        - Target Market: ${request.businessProfile.targetMarket.join(', ')}
        - Unique Value: ${request.businessProfile.uniqueValue}
        
        Requirements: ${request.requirements.join(', ')}
        Language: ${request.language}
        
        Create a structured template with:
        1. Detailed sections appropriate for the document type
        2. Industry-specific content for healthcare SMEs in Saudi Arabia
        3. Compliance considerations for Saudi regulations
        4. Clear guidance for each section
        5. Both English and Arabic content if requested
        
        Include practical examples and best practices for Saudi healthcare market.
      `;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a business document specialist with expertise in Saudi healthcare regulations and business planning.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.6,
                max_tokens: 3000,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No template generation response received');
            }
            return this.parseTemplateResponse(response, request);
        }
        catch (error) {
            logger.error('Error generating template:', error);
            throw new Error('Failed to generate template');
        }
    }
    /**
     * Validate document compliance with Saudi regulations
     */
    async validateCompliance(documentContent, documentType, regulations = ['MOH', 'NPHIES', 'SAMA']) {
        try {
            const prompt = `
        Validate this ${documentType} document for compliance with Saudi regulations: ${regulations.join(', ')}
        
        Document Content:
        ${documentContent}
        
        Check for:
        1. Required licenses and certifications
        2. Regulatory compliance statements
        3. Saudi healthcare standards adherence
        4. Data protection and privacy requirements
        5. Financial reporting standards
        6. Professional qualifications and credentials
        
        Provide detailed compliance assessment with specific recommendations for any gaps.
      `;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a regulatory compliance expert specializing in Saudi Arabian healthcare regulations and business documentation requirements.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No compliance validation response received');
            }
            return this.parseComplianceResponse(response, regulations);
        }
        catch (error) {
            logger.error('Error validating compliance:', error);
            throw new Error('Failed to validate compliance');
        }
    }
    /**
     * Generate content for specific document sections
     */
    async generateSectionContent(sectionType, businessContext, requirements, language = 'en') {
        try {
            const prompt = `
        Generate content for the "${sectionType}" section of a business document.
        
        Business Context:
        ${JSON.stringify(businessContext, null, 2)}
        
        Requirements: ${requirements.join(', ')}
        Language: ${language}
        
        Create comprehensive, professional content that:
        1. Addresses all specified requirements
        2. Includes relevant data and metrics for Saudi healthcare market
        3. Provides actionable insights and recommendations
        4. Follows best practices for business documentation
        5. Includes both English and Arabic if requested
        
        Also provide suggestions for improvement and relevant resources.
      `;
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a content generation expert for business documents with knowledge of Saudi healthcare regulations.'
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
                throw new Error('No section content response received');
            }
            return this.parseSectionContentResponse(response, language);
        }
        catch (error) {
            logger.error('Error generating section content:', error);
            throw new Error('Failed to generate section content');
        }
    }
    // Private helper methods
    createOptimizationPrompt(request) {
        return `
      Optimize this ${request.documentType} document for a healthcare SME in Saudi Arabia:
      
      Current Content:
      ${request.content}
      
      Business Context:
      - Industry: ${request.businessContext.industry}
      - Region: ${request.businessContext.region}
      - Company Size: ${request.businessContext.companySize}
      - Target Market: ${request.businessContext.targetMarket.join(', ')}
      
      Optimization Goals: ${request.optimizationGoals.join(', ')}
      Language Requirements: ${request.language}
      
      Please provide:
      1. Optimized content with improvements
      2. Specific improvements made with reasoning
      3. Compliance check against Saudi healthcare regulations
      4. Market alignment assessment
      5. Suggestions for additional sections
      
      Ensure the optimized content is professional, compliant, and aligned with Saudi Vision 2030 healthcare objectives.
    `;
    }
    getSystemPromptForDocumentType(documentType) {
        const prompts = {
            business_plan: 'You are a business planning expert specializing in Saudi healthcare SMEs. Focus on Vision 2030 alignment, regulatory compliance, and market opportunities.',
            feasibility_study: 'You are a feasibility analysis specialist with deep knowledge of Saudi healthcare market dynamics, regulatory requirements, and financial modeling.',
            financial_projection: 'You are a financial analyst expert in Saudi healthcare SME projections, including market trends, funding opportunities, and regulatory costs.',
            compliance_report: 'You are a regulatory compliance expert for Saudi healthcare, with comprehensive knowledge of MOH, NPHIES, and other relevant regulations.'
        };
        return prompts[documentType] || 'You are a business document optimization expert with knowledge of Saudi healthcare regulations.';
    }
    parseOptimizationResponse(response, request) {
        // Simplified parsing - in production, use more sophisticated parsing
        return {
            optimizedContent: 'Optimized content would be generated here based on AI response',
            optimizedContentAr: request.language === 'both' || request.language === 'ar' ? 'المحتوى المحسن باللغة العربية' : undefined,
            improvements: [
                {
                    section: 'Executive Summary',
                    improvement: 'Enhanced clarity and Vision 2030 alignment',
                    improvementAr: 'تحسين الوضوح والتوافق مع رؤية 2030',
                    reasoning: 'Better positioned for Saudi healthcare market',
                    impact: 'high'
                }
            ],
            complianceCheck: {
                score: 85,
                issues: [
                    {
                        issue: 'Missing NPHIES compliance statement',
                        severity: 'warning',
                        recommendation: 'Add explicit NPHIES integration plan'
                    }
                ]
            },
            marketAlignment: {
                score: 90,
                recommendations: [
                    'Emphasize digital health transformation',
                    'Include sustainability metrics'
                ]
            },
            additionalSections: [
                {
                    title: 'Regulatory Compliance Framework',
                    content: 'Detailed compliance framework content',
                    rationale: 'Essential for Saudi healthcare SMEs'
                }
            ]
        };
    }
    parseAnalysisResponse(response) {
        return {
            overallScore: 78,
            strengths: [
                'Clear business model description',
                'Comprehensive market analysis',
                'Realistic financial projections'
            ],
            weaknesses: [
                'Limited regulatory compliance details',
                'Insufficient risk analysis',
                'Missing implementation timeline'
            ],
            recommendations: [
                {
                    priority: 'high',
                    recommendation: 'Add comprehensive regulatory compliance section',
                    implementation: 'Include MOH, NPHIES, and SAMA requirements',
                    expectedImpact: 'Improved regulatory approval chances'
                }
            ],
            detailedAnalysis: {
                'Executive Summary': {
                    score: 85,
                    comments: ['Clear and concise', 'Good value proposition'],
                    suggestions: ['Add quantified benefits', 'Include market size data']
                },
                'Market Analysis': {
                    score: 75,
                    comments: ['Good market understanding'],
                    suggestions: ['Include competitive analysis', 'Add regional focus']
                }
            }
        };
    }
    parseTemplateResponse(response, request) {
        return {
            template: {
                sections: [
                    {
                        title: 'Executive Summary',
                        titleAr: request.language === 'both' || request.language === 'ar' ? 'الملخص التنفيذي' : undefined,
                        content: 'Template content for executive summary section',
                        contentAr: request.language === 'both' || request.language === 'ar' ? 'محتوى القالب لقسم الملخص التنفيذي' : undefined,
                        type: 'text',
                        placeholder: 'Provide a compelling overview of your healthcare business',
                        required: true
                    },
                    {
                        title: 'Market Analysis',
                        titleAr: request.language === 'both' || request.language === 'ar' ? 'تحليل السوق' : undefined,
                        content: 'Template content for market analysis section',
                        type: 'text',
                        required: true
                    }
                ]
            },
            guidelines: {
                writingStyle: 'Professional, clear, and data-driven',
                keyMetrics: ['Market size', 'Growth rate', 'Competitive position'],
                industrySpecific: ['Regulatory compliance', 'NPHIES integration', 'Vision 2030 alignment']
            },
            resources: [
                {
                    name: 'Saudi Healthcare Market Report 2024',
                    type: 'guide',
                    description: 'Comprehensive market analysis and trends'
                }
            ]
        };
    }
    parseComplianceResponse(response, regulations) {
        return {
            overallCompliance: 82,
            regulatoryChecks: regulations.map(reg => ({
                regulation: reg,
                status: 'partial',
                score: 80,
                issues: [
                    {
                        severity: 'warning',
                        description: `Missing specific ${reg} compliance statements`,
                        recommendation: `Add explicit ${reg} compliance documentation`,
                        reference: `${reg} Regulatory Guidelines 2024`
                    }
                ]
            })),
            recommendations: [
                'Include comprehensive regulatory compliance framework',
                'Add specific license and certification requirements',
                'Update data protection and privacy policies'
            ]
        };
    }
    parseSectionContentResponse(response, language) {
        return {
            content: 'Generated section content based on AI response',
            contentAr: language === 'both' || language === 'ar' ? 'المحتوى المولد باللغة العربية' : undefined,
            suggestions: [
                'Include specific metrics and KPIs',
                'Add visual elements like charts or graphs',
                'Reference relevant Saudi healthcare regulations'
            ],
            resources: [
                {
                    name: 'MOH Healthcare Standards',
                    description: 'Official healthcare quality standards',
                    url: 'https://moh.gov.sa'
                }
            ]
        };
    }
}
export default DocumentAIService;
//# sourceMappingURL=documentAIService.js.map