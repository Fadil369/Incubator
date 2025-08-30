"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logoutAll = exports.logout = exports.refresh = exports.login = exports.verifyEmail = exports.register = void 0;
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const server_1 = require("../server");
const prisma = new client_1.PrismaClient();
/**
 * Register a new user
 */
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    const { email, password, firstName, lastName, role = 'SME_OWNER' } = req.body;
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            error: {
                message: 'User with this email already exists',
            },
        });
    }
    // Validate password strength
    const passwordValidation = (0, password_1.validatePasswordStrength)(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Password does not meet security requirements',
                details: passwordValidation.errors,
            },
        });
    }
    // Hash password
    const hashedPassword = await (0, password_1.hashPassword)(password);
    // Generate verification token
    const verificationToken = (0, password_1.generateSecureToken)(32);
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours
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
    // Store verification token in Redis
    await server_1.redisClient.setex(`email_verification:${verificationToken}`, 24 * 60 * 60, // 24 hours
    JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
    }));
    // Send verification email
    try {
        await (0, email_1.sendVerificationEmail)(user.email, user.firstName, verificationToken);
    }
    catch (emailError) {
        logger_1.logger.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
    }
    logger_1.logger.info(`New user registered: ${user.email}`, { userId: user.id });
    res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified,
            },
        },
    });
});
/**
 * Verify email address
 */
exports.verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Verification token is required',
            },
        });
    }
    // Get verification data from Redis
    const verificationData = await server_1.redisClient.get(`email_verification:${token}`);
    if (!verificationData) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid or expired verification token',
            },
        });
    }
    const { userId, email } = JSON.parse(verificationData);
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
    res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
            user,
        },
    });
});
/**
 * User login
 */
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    const { email, password } = req.body;
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
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid credentials',
            },
        });
    }
    // Verify password
    const isPasswordValid = await (0, password_1.comparePassword)(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid credentials',
            },
        });
    }
    // Generate token pair
    const tokens = await (0, jwt_1.generateTokenPair)(user.id, user.email, user.role);
    logger_1.logger.info(`User logged in: ${user.email}`, { userId: user.id, sessionId: tokens.sessionId });
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
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
        },
    });
});
/**
 * Refresh access token
 */
exports.refresh = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Refresh token is required',
            },
        });
    }
    const result = await (0, jwt_1.refreshAccessToken)(refreshToken);
    if (!result) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Invalid or expired refresh token',
            },
        });
    }
    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            accessToken: result.accessToken,
        },
    });
});
/**
 * User logout
 */
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    // Extract session ID from token
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(token);
            if (decoded?.sessionId) {
                await (0, jwt_1.revokeSession)(decoded.sessionId);
            }
        }
        catch (error) {
            logger_1.logger.error('Error during logout:', error);
        }
    }
    logger_1.logger.info(`User logged out: ${req.user.email}`, { userId: req.user.id });
    res.status(200).json({
        success: true,
        message: 'Logout successful',
    });
});
/**
 * Logout from all devices
 */
exports.logoutAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    await (0, jwt_1.revokeAllUserSessions)(req.user.id);
    logger_1.logger.info(`User logged out from all devices: ${req.user.email}`, { userId: req.user.id });
    res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
});
/**
 * Forgot password - send reset email
 */
exports.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    const { email } = req.body;
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
            id: true,
            email: true,
            firstName: true,
            isActive: true,
        },
    });
    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
        return res.status(200).json({
            success: true,
            message: 'If the email exists in our system, a password reset link has been sent.',
        });
    }
    // Generate reset token
    const resetToken = (0, password_1.generateSecureToken)(32);
    // Store reset token in database
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
    }
    logger_1.logger.info(`Password reset requested for: ${user.email}`, { userId: user.id });
    res.status(200).json({
        success: true,
        message: 'If the email exists in our system, a password reset link has been sent.',
    });
});
/**
 * Reset password using token
 */
exports.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    const { token, password } = req.body;
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
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid or expired reset token',
            },
        });
    }
    // Validate new password
    const passwordValidation = (0, password_1.validatePasswordStrength)(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Password does not meet security requirements',
                details: passwordValidation.errors,
            },
        });
    }
    // Hash new password
    const hashedPassword = await (0, password_1.hashPassword)(password);
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
    res.status(200).json({
        success: true,
        message: 'Password reset successful. Please log in with your new password.',
    });
});
/**
 * Change password (authenticated users)
 */
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: errors.array(),
            },
        });
    }
    const { currentPassword, newPassword } = req.body;
    // Get user with password
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            password: true,
        },
    });
    if (!user) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'User not found',
            },
        });
    }
    // Verify current password
    const isCurrentPasswordValid = await (0, password_1.comparePassword)(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Current password is incorrect',
            },
        });
    }
    // Validate new password
    const passwordValidation = (0, password_1.validatePasswordStrength)(newPassword);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            success: false,
            error: {
                message: 'New password does not meet security requirements',
                details: passwordValidation.errors,
            },
        });
    }
    // Hash new password
    const hashedPassword = await (0, password_1.hashPassword)(newPassword);
    // Update password
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });
    // Revoke all other sessions for security (keep current session)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.decode(token);
            const currentSessionId = decoded?.sessionId;
            // This would require a more sophisticated approach to keep current session
            // For now, we'll revoke all sessions including current
            await (0, jwt_1.revokeAllUserSessions)(user.id);
        }
        catch (error) {
            logger_1.logger.error('Error handling session during password change:', error);
        }
    }
    logger_1.logger.info(`Password changed for user: ${user.email}`, { userId: user.id });
    res.status(200).json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
    });
});
/**
 * Get current user profile
 */
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication required',
            },
        });
    }
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
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
                    verificationStatus: true,
                },
            },
            mentorProfile: {
                select: {
                    id: true,
                    expertise: true,
                    yearsExperience: true,
                    currentRole: true,
                    company: true,
                    isVerified: true,
                    rating: true,
                },
            },
        },
    });
    if (!user) {
        return res.status(404).json({
            success: false,
            error: {
                message: 'User not found',
            },
        });
    }
    res.status(200).json({
        success: true,
        data: {
            user,
        },
    });
});
//# sourceMappingURL=authController.js.map