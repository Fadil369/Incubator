/**
 * Document Service for BrainSAIT Frontend
 * Handles document generation API calls with Saudi-specific features
 * 
 * @author BrainSAIT Platform
 * @version 1.0.0
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Environment configuration
const DOCS_API_BASE_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.brainsait.org';

// Types for document generation
export interface DocumentRequestBase {
  language: 'ar' | 'en';
  format?: 'pdf' | 'html';
  options?: {
    watermark?: boolean;
    digitalSignature?: boolean;
    inline?: boolean;
  };
}

export interface BusinessPlanRequest extends DocumentRequestBase {
  companyName: string;
  crNumber?: string;
  vatNumber?: string;
  executiveSummary: string;
  mainObjective: string;
  investmentAmount: number;
  expectedROI: number;
  timeframe: number;
  companyVision: string;
  companyMission: string;
  coreValues: string[];
  nationalAddress: string;
  phoneNumber: string;
  email: string;
  services: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  competitiveAdvantage: string;
  targetMarket: string;
  marketSize: number;
  marketGrowthRate: number;
  marketShare: number;
  competitors: Array<{
    name: string;
    strengths: string;
    weaknesses: string;
    marketShare: number;
  }>;
  pricingStrategy: string;
  distributionChannels: string[];
  promotionStrategy: string;
  financials: {
    year1: { revenue: number; expenses: number; netProfit: number };
    year2: { revenue: number; expenses: number; netProfit: number };
    year3: { revenue: number; expenses: number; netProfit: number };
    year4: { revenue: number; expenses: number; netProfit: number };
    year5: { revenue: number; expenses: number; netProfit: number };
  };
  fundingRequirements: {
    initialInvestment: number;
    workingCapital: number;
    totalFunding: number;
  };
  managementTeam: Array<{
    name: string;
    position: string;
    experience: string;
    education: string;
    responsibilities: string;
  }>;
  implementationPhases: Array<{
    date: string;
    phase: string;
    description: string;
    duration: string;
    cost: number;
  }>;
  riskAnalysis: Array<{
    riskType: string;
    riskLevel: 'risk-high' | 'risk-medium' | 'risk-low';
    description: string;
    impact: string;
    probability: string;
    mitigationStrategy: string;
  }>;
  requiredLicenses: Array<{
    name: string;
    description: string;
    issuingAuthority: string;
    duration: string;
  }>;
  complianceRequirements: string[];
  conclusion: string;
  recommendations: string[];
  nextSteps: Array<{
    timeline: string;
    action: string;
    details: string;
  }>;
}

export interface FeasibilityStudyRequest extends DocumentRequestBase {
  companyName: string;
  projectName: string;
  crNumber?: string;
  vatNumber?: string;
  executiveSummary: string;
  projectObjectives: string[];
  marketAnalysis?: {
    marketSize?: number;
    targetSegment?: string;
    competitorAnalysis?: string;
    marketTrends?: string;
    growthProjections?: number;
  };
  technicalAnalysis?: {
    technologyRequirements?: string[];
    implementationPlan?: string;
    resourceRequirements?: string[];
    technicalRisks?: string[];
  };
  financialAnalysis?: {
    initialInvestment?: number;
    operatingCosts?: number;
    revenueProjections?: Array<{
      year: number;
      revenue: number;
      costs: number;
      profit: number;
    }>;
    breakEvenPoint?: number;
    roi?: number;
    npv?: number;
    irr?: number;
    paybackPeriod?: number;
  };
  riskAnalysis?: {
    marketRisks?: string[];
    technicalRisks?: string[];
    financialRisks?: string[];
    mitigationStrategies?: string[];
  };
  saudiCompliance?: {
    requiredLicenses?: string[];
    regulatoryRequirements?: string[];
    complianceTimeline?: string[];
  };
  conclusion: string;
  recommendations: string[];
  nextSteps: string[];
}

export interface CertificateRequest extends DocumentRequestBase {
  companyName: string;
  certificateNumber: string;
  validityDate: string;
  issuingAuthority: string;
  crNumber: string;
  vatNumber: string;
  businessActivity: string;
  region: string;
  complianceScore: number;
  certifications: {
    iso?: boolean;
    healthcare?: boolean;
    quality?: boolean;
  };
  complianceAreas: string[];
  complianceManagerName: string;
  executiveDirectorName: string;
  emblem?: string;
  qrCode?: string;
}

export interface ComplianceReportRequest extends DocumentRequestBase {
  companyName: string;
  reportPeriod: string;
  reportNumber: string;
  overallScore: number;
  totalIssues: number;
  criticalIssues: number;
  completionRate: number;
  complianceBreakdown: Array<{
    category: string;
    score: number;
    scoreClass: string;
  }>;
  progressCharts: Array<{
    category: string;
    percentage: number;
  }>;
  issues: Array<{
    title: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    requiredAction: string;
    deadline: string;
  }>;
  governmentAPIs: Array<{
    name: string;
    status: 'connected' | 'error' | 'pending';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    timeline: string;
  }>;
  regulatoryUpdates: Array<{
    date: string;
    update: string;
    source: string;
  }>;
  actionPlan: Array<{
    phase: string;
    description: string;
    timeline: string;
    responsible: string;
  }>;
  complianceOfficer: {
    name: string;
    phone: string;
    email: string;
  };
  technicalSupport: {
    email: string;
    phone: string;
    hours: string;
  };
  validUntil: string;
}

export interface BatchDocumentRequest {
  documents: Array<{
    templateName: 'business-plan' | 'feasibility-study' | 'certificate' | 'compliance-report';
    data: any;
    language: 'ar' | 'en';
    filename?: string;
  }>;
  options?: {
    concurrent?: number;
    validateAll?: boolean;
    zipOutput?: boolean;
  };
}

export interface DocumentResponse {
  success: boolean;
  data?: {
    documentId: string;
    filename: string;
    size: number;
    generationTime: number;
    downloadUrl: string;
    metadata?: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface BatchDocumentResponse {
  success: boolean;
  data?: {
    batchId: string;
    documents: DocumentResponse['data'][];
    zipUrl?: string;
    totalSize: number;
    totalTime: number;
    successful: number;
    failed: number;
  };
  errors?: DocumentResponse['error'][];
}

export interface TemplateInfo {
  name: string;
  description: string;
  supportedLanguages: string[];
  requiredFields: string[];
  optionalFields: string[];
  sampleData?: any;
}

export interface HijriConversionRequest {
  date: string; // ISO date string
  format?: 'short' | 'long' | 'official';
}

export interface HijriConversionResponse {
  hijriDate: string;
  gregorianDate: string;
  formatted: {
    hijriAr: string;
    hijriEn: string;
    gregorianAr: string;
    gregorianEn: string;
    combined: string;
  };
}

/**
 * Document Service Class
 * Handles all document generation API calls
 */
class DocumentService {
  private baseURL: string;
  private defaultOptions: AxiosRequestConfig;

  constructor() {
    this.baseURL = DOCS_API_BASE_URL;
    this.defaultOptions = {
      timeout: 120000, // 2 minutes for document generation
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  /**
   * Set authentication token for API requests
   * @param token JWT token
   */
  setAuthToken(token: string): void {
    this.defaultOptions.headers = {
      ...this.defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Handle API errors and show user-friendly messages
   */
  private handleError(error: any, operation: string): never {
    console.error(`Document Service - ${operation}:`, error);
    
    let errorMessage = 'حدث خطأ أثناء معالجة طلبك';
    
    if (error.response?.status === 429) {
      errorMessage = 'تم تجاوز حد الطلبات المسموح. يرجى المحاولة لاحقاً';
    } else if (error.response?.status === 413) {
      errorMessage = 'حجم البيانات كبير جداً';
    } else if (error.response?.status === 422) {
      errorMessage = 'البيانات المدخلة غير صحيحة';
    } else if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    toast.error(errorMessage);
    throw error;
  }

  /**
   * Download PDF file from response
   */
  private async downloadPDF(response: AxiosResponse, filename: string): Promise<void> {
    try {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('تم تحميل المستند بنجاح');
    } catch (error) {
      toast.error('فشل في تحميل المستند');
      throw error;
    }
  }

  /**
   * Generate Business Plan
   */
  async generateBusinessPlan(
    data: BusinessPlanRequest,
    download: boolean = true
  ): Promise<DocumentResponse> {
    try {
      toast.loading('جاري إنشاء خطة العمل...', { id: 'business-plan' });
      
      const response = await axios.post<DocumentResponse | Blob>(
        `${this.baseURL}/documents/business-plan`,
        data,
        {
          ...this.defaultOptions,
          responseType: download ? 'blob' : 'json',
        }
      );

      toast.dismiss('business-plan');

      if (download && response.data instanceof Blob) {
        const filename = `business-plan-${data.companyName}-${new Date().toISOString().split('T')[0]}.pdf`;
        await this.downloadPDF(response as AxiosResponse, filename);
        
        return {
          success: true,
          data: {
            documentId: 'business-plan-' + Date.now(),
            filename,
            size: response.data.size,
            generationTime: 0,
            downloadUrl: '',
          },
        };
      }

      return response.data as DocumentResponse;
    } catch (error) {
      toast.dismiss('business-plan');
      return this.handleError(error, 'Generate Business Plan');
    }
  }

  /**
   * Generate Feasibility Study
   */
  async generateFeasibilityStudy(
    data: FeasibilityStudyRequest,
    download: boolean = true
  ): Promise<DocumentResponse> {
    try {
      toast.loading('جاري إنشاء دراسة الجدوى...', { id: 'feasibility' });
      
      const response = await axios.post<DocumentResponse | Blob>(
        `${this.baseURL}/documents/feasibility-study`,
        data,
        {
          ...this.defaultOptions,
          responseType: download ? 'blob' : 'json',
        }
      );

      toast.dismiss('feasibility');

      if (download && response.data instanceof Blob) {
        const filename = `feasibility-study-${data.companyName}-${new Date().toISOString().split('T')[0]}.pdf`;
        await this.downloadPDF(response as AxiosResponse, filename);
        
        return {
          success: true,
          data: {
            documentId: 'feasibility-' + Date.now(),
            filename,
            size: response.data.size,
            generationTime: 0,
            downloadUrl: '',
          },
        };
      }

      return response.data as DocumentResponse;
    } catch (error) {
      toast.dismiss('feasibility');
      return this.handleError(error, 'Generate Feasibility Study');
    }
  }

  /**
   * Generate Certificate
   */
  async generateCertificate(
    data: CertificateRequest,
    download: boolean = true
  ): Promise<DocumentResponse> {
    try {
      toast.loading('جاري إنشاء الشهادة...', { id: 'certificate' });
      
      const response = await axios.post<DocumentResponse | Blob>(
        `${this.baseURL}/documents/certificate`,
        data,
        {
          ...this.defaultOptions,
          responseType: download ? 'blob' : 'json',
        }
      );

      toast.dismiss('certificate');

      if (download && response.data instanceof Blob) {
        const filename = `certificate-${data.companyName}-${new Date().toISOString().split('T')[0]}.pdf`;
        await this.downloadPDF(response as AxiosResponse, filename);
        
        return {
          success: true,
          data: {
            documentId: 'certificate-' + Date.now(),
            filename,
            size: response.data.size,
            generationTime: 0,
            downloadUrl: '',
          },
        };
      }

      return response.data as DocumentResponse;
    } catch (error) {
      toast.dismiss('certificate');
      return this.handleError(error, 'Generate Certificate');
    }
  }

  /**
   * Generate Compliance Report
   */
  async generateComplianceReport(
    data: ComplianceReportRequest,
    download: boolean = true
  ): Promise<DocumentResponse> {
    try {
      toast.loading('جاري إنشاء تقرير الامتثال...', { id: 'compliance' });
      
      const response = await axios.post<DocumentResponse | Blob>(
        `${this.baseURL}/documents/compliance-report`,
        data,
        {
          ...this.defaultOptions,
          responseType: download ? 'blob' : 'json',
        }
      );

      toast.dismiss('compliance');

      if (download && response.data instanceof Blob) {
        const filename = `compliance-report-${data.companyName}-${new Date().toISOString().split('T')[0]}.pdf`;
        await this.downloadPDF(response as AxiosResponse, filename);
        
        return {
          success: true,
          data: {
            documentId: 'compliance-' + Date.now(),
            filename,
            size: response.data.size,
            generationTime: 0,
            downloadUrl: '',
          },
        };
      }

      return response.data as DocumentResponse;
    } catch (error) {
      toast.dismiss('compliance');
      return this.handleError(error, 'Generate Compliance Report');
    }
  }

  /**
   * Generate multiple documents in batch
   */
  async generateBatchDocuments(
    data: BatchDocumentRequest
  ): Promise<BatchDocumentResponse> {
    try {
      toast.loading('جاري إنشاء المستندات المتعددة...', { id: 'batch' });
      
      const response = await axios.post<BatchDocumentResponse>(
        `${this.baseURL}/documents/batch`,
        data,
        {
          ...this.defaultOptions,
          timeout: 300000, // 5 minutes for batch processing
        }
      );

      toast.dismiss('batch');
      toast.success(`تم إنشاء ${response.data.data?.successful} مستند بنجاح`);
      
      return response.data;
    } catch (error) {
      toast.dismiss('batch');
      return this.handleError(error, 'Generate Batch Documents');
    }
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<TemplateInfo[]> {
    try {
      const response = await axios.get<{ data: TemplateInfo[] }>(
        `${this.baseURL}/documents/templates`,
        this.defaultOptions
      );
      
      return response.data.data;
    } catch (error) {
      return this.handleError(error, 'Get Templates');
    }
  }

  /**
   * Preview template structure
   */
  async previewTemplate(templateName: string): Promise<TemplateInfo> {
    try {
      const response = await axios.get<{ data: TemplateInfo }>(
        `${this.baseURL}/documents/preview/${templateName}`,
        this.defaultOptions
      );
      
      return response.data.data;
    } catch (error) {
      return this.handleError(error, 'Preview Template');
    }
  }

  /**
   * Convert Gregorian date to Hijri
   */
  async convertToHijri(data: HijriConversionRequest): Promise<HijriConversionResponse> {
    try {
      const response = await axios.post<{ data: HijriConversionResponse }>(
        `${this.baseURL}/documents/utils/hijri-convert`,
        data,
        this.defaultOptions
      );
      
      return response.data.data;
    } catch (error) {
      return this.handleError(error, 'Convert to Hijri');
    }
  }

  /**
   * Validate Saudi business data
   */
  async validateSaudiData(data: {
    crNumber?: string;
    vatNumber?: string;
    phoneNumber?: string;
    nationalId?: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await axios.post<{ 
        data: { valid: boolean; errors: string[] } 
      }>(
        `${this.baseURL}/documents/government/verify`,
        data,
        this.defaultOptions
      );
      
      return response.data.data;
    } catch (error) {
      return this.handleError(error, 'Validate Saudi Data');
    }
  }

  /**
   * Get document generation status
   */
  async getDocumentStatus(documentId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    downloadUrl?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/documents/status/${documentId}`,
        this.defaultOptions
      );
      
      return response.data.data;
    } catch (error) {
      return this.handleError(error, 'Get Document Status');
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
export default documentService;