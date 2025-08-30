import { PrismaClient, UserRole } from '@prisma/client';
import { redisClient } from '../server';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from '../utils/email';
import { generateTokenPair, getUserSessions, revokeAllUserSessions } from '../utils/jwt';
import { logger } from '../utils/logger';
import { comparePassword, generateSecureToken, hashPassword, validatePasswordStrength } from '../utils/password';

const prisma = new PrismaClient();

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
export class AuthService {
  /**
   * Register a new user
   */
  static async registerUser(userData: RegisterUserData) {
    const { email, password, firstName, lastName, role = 'SME_OWNER' } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const error = new Error('Password does not meet security requirements');
      (error as any).details = passwordValidation.errors;
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

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
    const verificationToken = generateSecureToken(32);
    
    // Store verification token in Redis (24 hours expiry)
    await redisClient.setEx(
      `email_verification:${verificationToken}`,
      24 * 60 * 60,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      })
    );

    // Send verification email (don't fail registration if email fails)
    try {
      await sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email during registration:', emailError);
    }

    logger.info(`New user registered: ${user.email}`, { userId: user.id });

    return {
      user,
      verificationToken, // Only for testing purposes
    };
  }

  /**
   * Verify user email
   */
  static async verifyEmail(token: string) {
    // Get verification data from Redis
    const verificationData = await redisClient.get(`email_verification:${token}`);
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
    await redisClient.del(`email_verification:${token}`);

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
    }

    logger.info(`Email verified for user: ${user.email}`, { userId: user.id });

    return user;
  }

  /**
   * Authenticate user login
   */
  static async loginUser(credentials: LoginCredentials) {
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
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token pair
    const tokens = await generateTokenPair(user.id, user.email, user.role);

    logger.info(`User logged in: ${user.email}`, { userId: user.id, sessionId: tokens.sessionId });

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
  static async initiatePasswordReset(email: string) {
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
    const resetToken = generateSecureToken(32);

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
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      throw new Error('Failed to send password reset email');
    }

    logger.info(`Password reset initiated for: ${user.email}`, { userId: user.id });

    return { success: true };
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string) {
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
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      const error = new Error('Password does not meet security requirements');
      (error as any).details = passwordValidation.errors;
      throw error;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

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
    await revokeAllUserSessions(passwordReset.userId);

    logger.info(`Password reset completed for: ${passwordReset.user.email}`, { userId: passwordReset.userId });

    return { success: true };
  }

  /**
   * Change user password (requires current password)
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
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
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      const error = new Error('New password does not meet security requirements');
      (error as any).details = passwordValidation.errors;
      throw error;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all sessions for security
    await revokeAllUserSessions(user.id);

    logger.info(`Password changed for user: ${user.email}`, { userId: user.id });

    return { success: true };
  }

  /**
   * Get user profile with related data
   */
  static async getUserProfile(userId: string) {
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
  static async updateUserProfile(userId: string, updateData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatar?: string;
  }) {
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

    logger.info(`Profile updated for user: ${user.email}`, { userId: user.id });

    return user;
  }

  /**
   * Get user's active sessions
   */
  static async getUserActiveSessions(userId: string): Promise<UserSessionData[]> {
    return getUserSessions(userId);
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revoke all sessions
    await revokeAllUserSessions(userId);

    logger.info(`User account deactivated`, { userId });

    return { success: true };
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(userId: string) {
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
    const verificationToken = generateSecureToken(32);
    
    // Store verification token in Redis (24 hours expiry)
    await redisClient.setEx(
      `email_verification:${verificationToken}`,
      24 * 60 * 60,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      })
    );

    // Send verification email
    await sendVerificationEmail(user.email, user.firstName, verificationToken);

    logger.info(`Verification email resent to: ${user.email}`, { userId: user.id });

    return { success: true };
  }

  /**
   * Check if email exists (for frontend validation)
   */
  static async checkEmailExists(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return { exists: !!user };
  }
}