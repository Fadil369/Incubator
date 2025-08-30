export declare enum UserRole {
    SME_OWNER = "SME_OWNER",
    MENTOR = "MENTOR",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum SMEType {
    STARTUP = "STARTUP",
    SMALL_BUSINESS = "SMALL_BUSINESS",
    MEDIUM_ENTERPRISE = "MEDIUM_ENTERPRISE",
    NON_PROFIT = "NON_PROFIT"
}
export declare enum IndustryFocus {
    HEALTHCARE_TECHNOLOGY = "HEALTHCARE_TECHNOLOGY",
    MEDICAL_DEVICES = "MEDICAL_DEVICES",
    PHARMACEUTICALS = "PHARMACEUTICALS",
    BIOTECHNOLOGY = "BIOTECHNOLOGY",
    DIGITAL_HEALTH = "DIGITAL_HEALTH",
    TELEMEDICINE = "TELEMEDICINE",
    HEALTH_ANALYTICS = "HEALTH_ANALYTICS",
    MEDICAL_RESEARCH = "MEDICAL_RESEARCH",
    HEALTHCARE_SERVICES = "HEALTHCARE_SERVICES",
    HEALTH_INSURANCE = "HEALTH_INSURANCE"
}
export declare enum VerificationStatus {
    PENDING = "PENDING",
    IN_REVIEW = "IN_REVIEW",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    isVerified: boolean;
    avatar?: string;
    phoneNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SMEProfile {
    id: string;
    userId: string;
    companyName: string;
    companyType: SMEType;
    industryFocus: IndustryFocus[];
    description?: string;
    website?: string;
    foundedYear?: number;
    employeeCount?: number;
    annualRevenue?: string;
    address?: Address;
    documents?: Document[];
    verificationStatus: VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface MentorProfile {
    id: string;
    userId: string;
    expertise: IndustryFocus[];
    yearsExperience: number;
    currentRole: string;
    company: string;
    bio?: string;
    linkedinUrl?: string;
    availability?: Availability;
    hourlyRate?: number;
    isVerified: boolean;
    rating?: number;
    totalSessions: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Address {
    street?: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}
export interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: Date;
}
export interface Availability {
    timezone: string;
    weeklyHours: number;
    schedule: {
        [day: string]: {
            available: boolean;
            startTime?: string;
            endTime?: string;
        };
    };
}
export interface CreateUserRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: UserRole;
    phoneNumber?: string;
}
export interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatar?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: User;
    token: string;
    expiresAt: Date;
}
//# sourceMappingURL=user.types.d.ts.map