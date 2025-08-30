import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { redisClient } from '../server';
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from '../utils/email';
import { generateTokenPair, refreshAccessToken, revokeAllUserSessions, revokeSession } from '../utils/jwt';
import { logger } from '../utils/logger';
import { comparePassword, generateSecureToken, hashPassword, validatePasswordStrength } from '../utils/password';

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Check validation errors
  const errors = validationResult(req);
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
  const passwordValidation = validatePasswordStrength(password);
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
  const hashedPassword = await hashPassword(password);

  // Generate verification token
  const verificationToken = generateSecureToken(32);
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
  await redisClient.setEx(
    `email_verification:${verificationToken}`,
    24 * 60 * 60, // 24 hours
    JSON.stringify({
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
    })
  );

  // Send verification email
  try {
    await sendVerificationEmail(user.email, user.firstName, verificationToken);
  } catch (emailError) {
    logger.error('Failed to send verification email:', emailError);
    // Don't fail registration if email fails
  }

  logger.info(`New user registered: ${user.email}`, { userId: user.id });

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
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
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
  const verificationData = await redisClient.get(`email_verification:${token}`);
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
  await redisClient.del(`email_verification:${token}`);

  // Send welcome email
  try {
    await sendWelcomeEmail(user.email, user.firstName);
  } catch (emailError) {
    logger.error('Failed to send welcome email:', emailError);
  }

  logger.info(`Email verified for user: ${user.email}`, { userId: user.id });

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
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Check validation errors
  const errors = validationResult(req);
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
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
      },
    });
  }

  // Generate token pair
  const tokens = await generateTokenPair(user.id, user.email, user.role);

  logger.info(`User logged in: ${user.email}`, { userId: user.id, sessionId: tokens.sessionId });

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
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Refresh token is required',
      },
    });
  }

  const result = await refreshAccessToken(refreshToken);
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
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      const decoded = jwt.decode(token) as any;
      if (decoded?.sessionId) {
        await revokeSession(decoded.sessionId);
      }
    } catch (error) {
      logger.error('Error during logout:', error);
    }
  }

  logger.info(`User logged out: ${req.user.email}`, { userId: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Logout from all devices
 */
export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
  }

  await revokeAllUserSessions(req.user.id);

  logger.info(`User logged out from all devices: ${req.user.email}`, { userId: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});

/**
 * Forgot password - send reset email
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
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
  const resetToken = generateSecureToken(32);

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
    await sendPasswordResetEmail(user.email, user.firstName, resetToken);
  } catch (emailError) {
    logger.error('Failed to send password reset email:', emailError);
  }

  logger.info(`Password reset requested for: ${user.email}`, { userId: user.id });

  res.status(200).json({
    success: true,
    message: 'If the email exists in our system, a password reset link has been sent.',
  });
});

/**
 * Reset password using token
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
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
  const passwordValidation = validatePasswordStrength(password);
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
  const hashedPassword = await hashPassword(password);

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

  res.status(200).json({
    success: true,
    message: 'Password reset successful. Please log in with your new password.',
  });
});

/**
 * Change password (authenticated users)
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
  }

  const errors = validationResult(req);
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
  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Current password is incorrect',
      },
    });
  }

  // Validate new password
  const passwordValidation = validatePasswordStrength(newPassword);
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
  const hashedPassword = await hashPassword(newPassword);

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
      const decoded = jwt.decode(token) as any;
      const currentSessionId = decoded?.sessionId;
      
      // This would require a more sophisticated approach to keep current session
      // For now, we'll revoke all sessions including current
      await revokeAllUserSessions(user.id);
    } catch (error) {
      logger.error('Error handling session during password change:', error);
    }
  }

  logger.info(`Password changed for user: ${user.email}`, { userId: user.id });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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