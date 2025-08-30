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
        user: any;
        verificationToken: string;
    }>;
    /**
     * Verify user email
     */
    static verifyEmail(token: string): Promise<any>;
    /**
     * Authenticate user login
     */
    static loginUser(credentials: LoginCredentials): Promise<{
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            isVerified: any;
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
    static getUserProfile(userId: string): Promise<any>;
    /**
     * Update user profile
     */
    static updateUserProfile(userId: string, updateData: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        avatar?: string;
    }): Promise<any>;
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