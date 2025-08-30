import { PrismaClient, UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { redisClient } from '../server';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate JWT tokens and validate session
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
        },
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Check if session exists in Redis
    const sessionKey = `session:${decoded.sessionId}`;
    const sessionData = await redisClient.get(sessionKey);
    
    if (!sessionData) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Session expired or invalid.',
        },
      });
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user || !user.isActive) {
      // Clean up invalid session
      await redisClient.del(sessionKey);
      return res.status(401).json({
        success: false,
        error: {
          message: 'User account is inactive or not found.',
        },
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    // Extend session expiry in Redis
    await redisClient.expire(sessionKey, 7 * 24 * 60 * 60); // 7 days

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired.',
        },
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token.',
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed.',
      },
    });
  }
};

/**
 * Middleware to check if user has required roles
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required.',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions.',
        },
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is verified (for sensitive operations)
 */
export const requireVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Email verification required.',
      },
    });
  }
  next();
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Check session
    const sessionKey = `session:${decoded.sessionId}`;
    const sessionData = await redisClient.get(sessionKey);
    
    if (!sessionData) {
      return next();
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      };
    }

    next();
  } catch (error) {
    // In optional auth, we don't fail on errors
    next();
  }
};

// Export authenticate as auth for backward compatibility
export const auth = authenticate;