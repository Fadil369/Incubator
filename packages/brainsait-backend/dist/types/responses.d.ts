import { User, SMEProfile, Program, ProgramEnrollment, MentorProfile } from '@prisma/client';
export interface BaseResponse {
    success: boolean;
    message?: string;
}
export interface SuccessResponse<T = any> extends BaseResponse {
    success: true;
    data: T;
}
export interface ErrorResponse extends BaseResponse {
    success: false;
    error: {
        message: string;
        details?: any;
        code?: string;
    };
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface UserProfile extends Omit<User, 'password'> {
    smeProfile?: Partial<SMEProfile>;
    mentorProfile?: Partial<MentorProfile>;
}
export interface AuthSuccessResponse {
    user: UserProfile;
    tokens: AuthTokens;
}
export interface SMEProfileResponse extends SMEProfile {
    user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'isVerified'>;
    programEnrollments?: Array<{
        id: string;
        status: string;
        progress: number;
        program: {
            id: string;
            title: string;
            type: string;
        };
    }>;
    _count?: {
        programEnrollments: number;
        mentorships: number;
    };
}
export interface ProgramResponse extends Program {
    _count: {
        enrollments: number;
    };
}
export interface ProgramWithEnrollments extends Program {
    enrollments: Array<{
        id: string;
        status: string;
        progress: number;
        sme: {
            id: string;
            companyName: string;
            user: {
                firstName: string;
                lastName: string;
            };
        };
    }>;
}
export interface EnrollmentResponse extends ProgramEnrollment {
    program: {
        id: string;
        title: string;
        description: string;
        type: string;
        duration: number;
        status: string;
        startDate?: Date;
        endDate?: Date;
    };
    sme?: {
        id: string;
        companyName: string;
        user: {
            firstName: string;
            lastName: string;
        };
    };
}
export interface DocumentGenerationResponse {
    fileName: string;
    downloadUrl: string;
    generatedAt: string;
}
export interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    fields: string[];
}
export interface DashboardAnalytics {
    overview: {
        totalUsers: number;
        totalSMEs: number;
        verifiedSMEs: number;
        totalPrograms: number;
        activePrograms: number;
        totalEnrollments: number;
        activeEnrollments: number;
        completedEnrollments: number;
        verificationRate: string;
        completionRate: string;
    };
    recentActivity: {
        users: Array<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role' | 'isVerified' | 'createdAt'>>;
        smes: Array<{
            id: string;
            companyName: string;
            companyType: string;
            verificationStatus: string;
            createdAt: Date;
            user: {
                firstName: string;
                lastName: string;
            };
        }>;
    };
    distributions: {
        programsByType: Array<{
            type: string;
            count: number;
        }>;
        enrollmentsByStatus: Array<{
            status: string;
            count: number;
        }>;
        usersByRole: Array<{
            role: string;
            count: number;
        }>;
    };
    growth: Array<{
        month: string;
        users: number;
        smes: number;
        enrollments: number;
    }>;
}
export interface SMEAnalytics {
    distributions: {
        byType: Array<{
            type: string;
            count: number;
        }>;
        byIndustry: Array<{
            industry: string;
            count: number;
        }>;
        byVerificationStatus: Array<{
            status: string;
            count: number;
        }>;
        byFoundedYear: Array<{
            decade: string;
            count: number;
        }>;
        byEmployeeCount: Array<{
            size: string;
            count: number;
        }>;
    };
}
export interface ProgramAnalytics {
    programStats: Array<{
        id: string;
        title: string;
        type: string;
        status: string;
        totalEnrollments: number;
        capacity: number;
        utilization: string;
    }>;
    enrollmentTrends: any[];
    completionRates: Array<{
        programId: string;
        title: string;
        totalEnrollments: number;
        completedEnrollments: number;
        completionRate: string;
    }>;
    popularPrograms: Array<{
        id: string;
        title: string;
        type: string;
        currentParticipants: number;
        maxParticipants: number;
    }>;
}
export interface PersonalAnalytics {
    profile: {
        companyName: string;
        companyType: string;
        industryFocus: string[];
        verificationStatus: string;
        joinedAt: Date;
    };
    enrollments: {
        total: number;
        active: number;
        completed: number;
        pending: number;
    };
    progress: Array<{
        progress: number;
        status: string;
        enrolledAt: Date;
        completedAt?: Date;
        program: {
            title: string;
            type: string;
        };
    }>;
    history: Array<{
        id: string;
        status: string;
        progress: number;
        enrolledAt: Date;
        completedAt?: Date;
        program: {
            title: string;
            type: string;
            duration: number;
        };
    }>;
}
export interface ValidationError {
    type: string;
    value: any;
    msg: string;
    path: string;
    location: string;
}
export interface ValidationErrorResponse extends ErrorResponse {
    error: {
        message: 'Validation failed';
        details: ValidationError[];
        code?: string;
    };
}
export declare enum ErrorCodes {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
    ACCOUNT_INACTIVE = "ACCOUNT_INACTIVE",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
    DOCUMENT_GENERATION_ERROR = "DOCUMENT_GENERATION_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T>;
export declare function createErrorResponse(message: string, details?: any, code?: ErrorCodes): ErrorResponse;
export declare function createPaginatedResponse<T>(data: T[], page: number, limit: number, total: number): SuccessResponse<PaginatedResponse<T>>;
export declare function createValidationErrorResponse(errors: ValidationError[]): ValidationErrorResponse;
//# sourceMappingURL=responses.d.ts.map