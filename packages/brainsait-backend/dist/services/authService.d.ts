import { UserRole } from '@prisma/client';
export interface RegisterUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface UserSessionData {
    sessionId: string;
    createdAt: string;
    lastAccessed: string;
}
/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
export declare class AuthService {
    /**
     * Register a new user
     */
    static registerUser(userData: RegisterUserData): Promise<{
        user: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isActive: boolean;
            isVerified: boolean;
            createdAt: Date;
        };
        verificationToken: string;
    }>;
    /**
     * Verify user email
     */
    static verifyEmail(token: string): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isVerified: boolean;
    }>;
    /**
     * Authenticate user login
     */
    static loginUser(credentials: LoginCredentials): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.UserRole;
            isVerified: boolean;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
        sessionId: string;
    }>;
    /**
     * Initiate password reset process
     */
    static initiatePasswordReset(email: string): Promise<{
        success: boolean;
    }>;
    /**
     * Reset password using token
     */
    static resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    /**
     * Change user password (requires current password)
     */
    static changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get user profile with related data
     */
    static getUserProfile(userId: string): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        isVerified: boolean;
        avatar: string;
        phoneNumber: string;
        createdAt: Date;
        updatedAt: Date;
        smeProfile: {
            id: string;
            createdAt: Date;
            companyName: string;
            companyType: import(".prisma/client").$Enums.SMEType;
            industryFocus: import(".prisma/client").$Enums.IndustryFocus[];
            description: string;
            website: string;
            foundedYear: number;
            employeeCount: number;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
        };
        mentorProfile: {
            id: string;
            isVerified: boolean;
            expertise: import(".prisma/client").$Enums.IndustryFocus[];
            yearsExperience: number;
            currentRole: string;
            company: string;
            bio: string;
            rating: number;
            totalSessions: number;
        };
    }>;
    /**
     * Update user profile
     */
    static updateUserProfile(userId: string, updateData: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        avatar?: string;
    }): Promise<{
        role: import(".prisma/client").$Enums.UserRole;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isVerified: boolean;
        avatar: string;
        phoneNumber: string;
        updatedAt: Date;
    }>;
    /**
     * Get user's active sessions
     */
    static getUserActiveSessions(userId: string): Promise<UserSessionData[]>;
    /**
     * Deactivate user account
     */
    static deactivateUser(userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Resend verification email
     */
    static resendVerificationEmail(userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Check if email exists (for frontend validation)
     */
    static checkEmailExists(email: string): Promise<{
        exists: boolean;
    }>;
}
//# sourceMappingURL=authService.d.ts.map