"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const password_1 = require("../utils/password");
const email_1 = require("../utils/email");
const logger_1 = require("../utils/logger");
const server_1 = require("../server");
const prisma = new client_1.PrismaClient();
/**
 * Authentication Service
 * Handles all authentication-related business logic
 */
class AuthService {
    /**
     * Register a new user
     */
    static async registerUser(userData) {
        const { email, password, firstName, lastName, role = 'SME_OWNER' } = userData;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Validate password strength
        const passwordValidation = (0, password_1.validatePasswordStrength)(password);
        if (!passwordValidation.isValid) {
            const error = new Error('Password does not meet security requirements');
            error.details = passwordValidation.errors;
            throw error;
        }
        // Hash password
        const hashedPassword = await (0, password_1.hashPassword)(password);
        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                firstName,
                lastName,
                password: hashedPassword,
                role,
                isActive: true,
                isVerified: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isVerified: true,
                createdAt: true,
            },
        });
        // Generate verification token
        const verificationToken = (0, password_1.generateSecureToken)(32);
        // Store verification token in Redis (24 hours expiry)
        await server_1.redisClient.setex(`email_verification:${verificationToken}`, 24 * 60 * 60, JSON.stringify({
            userId: user.id,
            email: user.email,
            createdAt: new Date().toISOString(),
        }));
        // Send verification email (don't fail registration if email fails)
        try {
            await (0, email_1.sendVerificationEmail)(user.email, user.firstName, verificationToken);
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send verification email during registration:', emailError);
        }
        logger_1.logger.info(`New user registered: ${user.email}`, { userId: user.id });
        return {
            user,
            verificationToken, // Only for testing purposes
        };
    }
    /**
     * Verify user email
     */
    static async verifyEmail(token) {
        // Get verification data from Redis
        const verificationData = await server_1.redisClient.get(`email_verification:${token}`);
        if (!verificationData) {
            throw new Error('Invalid or expired verification token');
        }
        const { userId } = JSON.parse(verificationData);
        // Update user verification status
        const user = await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
            },
        });
        // Delete verification token
        await server_1.redisClient.del(`email_verification:${token}`);
        // Send welcome email
        try {
            await (0, email_1.sendWelcomeEmail)(user.email, user.firstName);
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send welcome email:', emailError);
        }
        logger_1.logger.info(`Email verified for user: ${user.email}`, { userId: user.id });
        return user;
    }
    /**
     * Authenticate user login
     */
    static async loginUser(credentials) {
        const { email, password } = credentials;
        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                password: true,
                role: true,
                isActive: true,
                isVerified: true,
            },
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        // Verify password
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Generate token pair
        const tokens = await (0, jwt_1.generateTokenPair)(user.id, user.email, user.role);
        logger_1.logger.info(`User logged in: ${user.email}`, { userId: user.id, sessionId: tokens.sessionId });
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified,
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
            sessionId: tokens.sessionId,
        };
    }
    /**
     * Initiate password reset process
     */
    static async initiatePasswordReset(email) {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                email: true,
                firstName: true,
                isActive: true,
            },
        });
        // Don't reveal if user exists or not
        if (!user || !user.isActive) {
            return { success: true };
        }
        // Generate reset token
        const resetToken = (0, password_1.generateSecureToken)(32);
        // Store reset token in database (1 hour expiry)
        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                used: false,
            },
        });
        // Send password reset email
        try {
            await (0, email_1.sendPasswordResetEmail)(user.email, user.firstName, resetToken);
        }
        catch (emailError) {
            logger_1.logger.error('Failed to send password reset email:', emailError);
            throw new Error('Failed to send password reset email');
        }
        logger_1.logger.info(`Password reset initiated for: ${user.email}`, { userId: user.id });
        return { success: true };
    }
    /**
     * Reset password using token
     */
    static async resetPassword(token, newPassword) {
        // Find valid reset token
        const passwordReset = await prisma.passwordReset.findFirst({
            where: {
                token,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                    },
                },
            },
        });
        if (!passwordReset) {
            throw new Error('Invalid or expired reset token');
        }
        // Validate new password
        const passwordValidation = (0, password_1.validatePasswordStrength)(newPassword);
        if (!passwordValidation.isValid) {
            const error = new Error('Password does not meet security requirements');
            error.details = passwordValidation.errors;
            throw error;
        }
        // Hash new password
        const hashedPassword = await (0, password_1.hashPassword)(newPassword);
        // Update user password and mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: passwordReset.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordReset.update({
                where: { id: passwordReset.id },
                data: { used: true },
            }),
        ]);
        // Revoke all existing sessions for security
        await (0, jwt_1.revokeAllUserSessions)(passwordReset.userId);
        logger_1.logger.info(`Password reset completed for: ${passwordReset.user.email}`, { userId: passwordReset.userId });
        return { success: true };
    }
    /**
     * Change user password (requires current password)
     */
    static async changePassword(userId, currentPassword, newPassword) {
        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                password: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Verify current password
        const isCurrentPasswordValid = await (0, password_1.comparePassword)(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        // Validate new password
        const passwordValidation = (0, password_1.validatePasswordStrength)(newPassword);
        if (!passwordValidation.isValid) {
            const error = new Error('New password does not meet security requirements');
            error.details = passwordValidation.errors;
            throw error;
        }
        // Hash new password
        const hashedPassword = await (0, password_1.hashPassword)(newPassword);
        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        // Revoke all sessions for security
        await (0, jwt_1.revokeAllUserSessions)(user.id);
        logger_1.logger.info(`Password changed for user: ${user.email}`, { userId: user.id });
        return { success: true };
    }
    /**
     * Get user profile with related data
     */
    static async getUserProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                isVerified: true,
                avatar: true,
                phoneNumber: true,
                createdAt: true,
                updatedAt: true,
                smeProfile: {
                    select: {
                        id: true,
                        companyName: true,
                        companyType: true,
                        industryFocus: true,
                        description: true,
                        website: true,
                        foundedYear: true,
                        employeeCount: true,
                        verificationStatus: true,
                        createdAt: true,
                    },
                },
                mentorProfile: {
                    select: {
                        id: true,
                        expertise: true,
                        yearsExperience: true,
                        currentRole: true,
                        company: true,
                        bio: true,
                        isVerified: true,
                        rating: true,
                        totalSessions: true,
                    },
                },
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    /**
     * Update user profile
     */
    static async updateUserProfile(userId, updateData) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                avatar: true,
                phoneNumber: true,
                updatedAt: true,
            },
        });
        logger_1.logger.info(`Profile updated for user: ${user.email}`, { userId: user.id });
        return user;
    }
    /**
     * Get user's active sessions
     */
    static async getUserActiveSessions(userId) {
        return (0, jwt_1.getUserSessions)(userId);
    }
    /**
     * Deactivate user account
     */
    static async deactivateUser(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        // Revoke all sessions
        await (0, jwt_1.revokeAllUserSessions)(userId);
        logger_1.logger.info(`User account deactivated`, { userId });
        return { success: true };
    }
    /**
     * Resend verification email
     */
    static async resendVerificationEmail(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                isVerified: true,
                isActive: true,
            },
        });
        if (!user || !user.isActive) {
            throw new Error('User not found or inactive');
        }
        if (user.isVerified) {
            throw new Error('User email is already verified');
        }
        // Generate new verification token
        const verificationToken = (0, password_1.generateSecureToken)(32);
        // Store verification token in Redis (24 hours expiry)
        await server_1.redisClient.setex(`email_verification:${verificationToken}`, 24 * 60 * 60, JSON.stringify({
            userId: user.id,
            email: user.email,
            createdAt: new Date().toISOString(),
        }));
        // Send verification email
        await (0, email_1.sendVerificationEmail)(user.email, user.firstName, verificationToken);
        logger_1.logger.info(`Verification email resent to: ${user.email}`, { userId: user.id });
        return { success: true };
    }
    /**
     * Check if email exists (for frontend validation)
     */
    static async checkEmailExists(email) {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true },
        });
        return { exists: !!user };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map