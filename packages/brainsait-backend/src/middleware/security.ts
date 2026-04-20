/**
 * Enhanced Security Middleware for BrainSAIT Platform
 * Implements comprehensive security measures for Saudi healthcare SME data protection
 * 
 * @author BrainSAIT Platform
 * @version 2.0.0
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt, { SignOptions } from 'jsonwebtoken';
import validator from 'validator';

const prisma = new PrismaClient();

// Security configuration
const _nodeEnv = process.env.NODE_ENV || 'development';
const SECURITY_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || (_nodeEnv !== 'production' ? 'dev-only-secret' : (() => { throw new Error('JWT_SECRET required'); })()),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (_nodeEnv !== 'production' ? 'dev-only-refresh' : (() => { throw new Error('JWT_REFRESH_SECRET required'); })()),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  ENCRYPTION_IV_LENGTH: 16,
  BCRYPT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 30 * 60 * 1000, // 30 minutes
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIREMENTS: {
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    requireSpaces: false,
  },
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  API_RATE_LIMITS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  },
  AUTH_RATE_LIMITS: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    skipSuccessfulRequests: true,
  },
  SAUDI_COMPLIANCE: {
    requireNationalId: true,
    requireCRNumber: true,
    dataRetentionDays: 365 * 5, // 5 years as per Saudi regulations
    auditLogEnabled: true,
    encryptSensitiveData: true,
  }
};

// Interfaces
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    smeId?: string;
    permissions?: string[];
  };
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityAuditLog {
  userId?: string;
  action: string;
  resource?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure';
  details?: any;
}

/**
 * Enhanced Helmet configuration for security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.saudi.gov.sa"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * CORS configuration with Saudi-specific origins
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    if (!origin || SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Id'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
});

/**
 * Rate limiting for general API endpoints
 */
export const apiRateLimiter = rateLimit({
  ...SECURITY_CONFIG.API_RATE_LIMITS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent({
      action: 'RATE_LIMIT_EXCEEDED',
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent') || 'unknown',
      timestamp: new Date(),
      status: 'failure',
      resource: req.originalUrl,
    });
    res.status(429).json({
      error: 'Too many requests',
      message: SECURITY_CONFIG.API_RATE_LIMITS.message,
      retryAfter: Math.ceil(SECURITY_CONFIG.API_RATE_LIMITS.windowMs / 1000),
    });
  },
});

/**
 * Stricter rate limiting for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  ...SECURITY_CONFIG.AUTH_RATE_LIMITS,
  skipFailedRequests: false,
  handler: (req, res) => {
    logSecurityEvent({
      action: 'AUTH_RATE_LIMIT_EXCEEDED',
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent') || 'unknown',
      timestamp: new Date(),
      status: 'failure',
      resource: req.originalUrl,
    });
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please wait before trying again',
      retryAfter: Math.ceil(SECURITY_CONFIG.AUTH_RATE_LIMITS.windowMs / 1000),
    });
  },
});

/**
 * JWT Token Generation with refresh token support
 */
export const generateTokens = (user: any) => {
  const jwtSecret = SECURITY_CONFIG.JWT_SECRET as string;
  const jwtRefreshSecret = SECURITY_CONFIG.JWT_REFRESH_SECRET as string;
  
  const accessTokenOptions: SignOptions = {
    expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN as any,
    issuer: 'brainsait-platform',
    audience: 'saudi-healthcare-sme',
  };
  
  const refreshTokenOptions: SignOptions = {
    expiresIn: SECURITY_CONFIG.JWT_REFRESH_EXPIRES_IN as any,
    issuer: 'brainsait-platform',
  };
  
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      smeId: user.smeId,
    },
    jwtSecret,
    accessTokenOptions
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      tokenVersion: user.tokenVersion || 0,
    },
    jwtRefreshSecret,
    refreshTokenOptions
  );

  return { accessToken, refreshToken };
};

/**
 * JWT Authentication Middleware
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided',
      });
    }

    jwt.verify(token, SECURITY_CONFIG.JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        logSecurityEvent({
          action: 'INVALID_TOKEN',
          ipAddress: getClientIp(req),
          userAgent: req.get('user-agent') || 'unknown',
          timestamp: new Date(),
          status: 'failure',
          details: { error: err.message },
        });

        return res.status(403).json({
          error: 'Invalid token',
          message: 'Token verification failed',
        });
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          smeId: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(403).json({
          error: 'Account inactive',
          message: 'User account is not active',
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        smeId: user.smeId || undefined,
        permissions: await getUserPermissions(user.id),
      };
      
      req.sessionId = crypto.randomBytes(16).toString('hex');
      req.ipAddress = getClientIp(req);
      req.userAgent = req.get('user-agent') || 'unknown';

      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error',
    });
  }
};

/**
 * Role-based access control middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logSecurityEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        userId: req.user.id,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent') || 'unknown',
        timestamp: new Date(),
        status: 'failure',
        resource: req.originalUrl,
        details: { requiredRoles: allowedRoles, userRole: req.user.role },
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Permission-based access control
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions?.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Missing required permission: ${permission}`,
      });
    }
    next();
  };
};

/**
 * Data encryption for sensitive information
 */
export class DataEncryption {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor() {
    this.key = Buffer.from(SECURITY_CONFIG.ENCRYPTION_KEY, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(SECURITY_CONFIG.ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }
}

/**
 * Password validation for Saudi compliance
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validator.isStrongPassword(password, SECURITY_CONFIG.PASSWORD_REQUIREMENTS)) {
    errors.push('Password does not meet security requirements');
  }
  
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`);
  }
  
  // Check for common patterns
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns');
  }
  
  // Saudi-specific: Check for Arabic keyboard patterns
  const arabicPatterns = ['ضصثق', 'شسيب', 'نملك'];
  if (arabicPatterns.some(pattern => password.includes(pattern))) {
    errors.push('Password contains common Arabic keyboard patterns');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Hash password with bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SECURITY_CONFIG.BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Verify password
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query) as any;
  }
  
  // Sanitize params
  if (req.params) {
    req.params = sanitizeObject(req.params) as any;
  }
  
  next();
};

/**
 * Recursive object sanitization
 */
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    // Remove potential XSS attempts
    return validator.escape(obj.trim());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize key and value
        const sanitizedKey = validator.escape(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * SQL Injection prevention (additional layer with Prisma)
 */
export const preventSQLInjection = (value: string): string => {
  // Remove or escape potentially dangerous SQL characters
  return value
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/exec/gi, '')
    .replace(/execute/gi, '')
    .replace(/select/gi, '')
    .replace(/insert/gi, '')
    .replace(/update/gi, '')
    .replace(/delete/gi, '')
    .replace(/drop/gi, '')
    .replace(/union/gi, '')
    .replace(/script/gi, '');
};

/**
 * File upload security
 */
export const fileUploadSecurity = {
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  validateFile: (file: any): { valid: boolean; error?: string } => {
    if (!fileUploadSecurity.allowedMimeTypes.includes(file.mimetype)) {
      return { valid: false, error: 'Invalid file type' };
    }
    
    if (file.size > fileUploadSecurity.maxFileSize) {
      return { valid: false, error: 'File size exceeds limit' };
    }
    
    // Check for malicious file extensions
    const dangerousExtensions = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.ps1'];
    if (dangerousExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return { valid: false, error: 'Dangerous file extension' };
    }
    
    return { valid: true };
  },
};

/**
 * Session management
 */
export class SessionManager {
  private static sessions = new Map<string, any>();
  
  static createSession(userId: string, data: any): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      userId,
      data,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }
  
  static getSession(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    
    session.lastActivity = new Date();
    return session;
  }
  
  static destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  static cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

/**
 * Security audit logging
 */
export const logSecurityEvent = async (event: SecurityAuditLog) => {
  try {
    if (SECURITY_CONFIG.SAUDI_COMPLIANCE.auditLogEnabled) {
      // Store in database
      await prisma.auditLog.create({
        data: {
          userId: event.userId,
          action: event.action,
          resourceType: event.resource || 'UNKNOWN',
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          status: event.status,
          details: event.details ? JSON.stringify(event.details) : undefined,
          timestamp: event.timestamp,
        },
      });
    }
    
    // Structured log in development (never in production)
    if (process.env.NODE_ENV === 'development') {
      process.stdout.write(JSON.stringify({ level: 'warn', category: 'SECURITY_AUDIT', ...event }) + '\n');
    }
  } catch (error) {
    process.stderr.write(JSON.stringify({ level: 'error', msg: 'Failed to log security event', error: String(error) }) + '\n');
  }
};

/**
 * Get client IP address
 */
export const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Get user permissions
 */
const getUserPermissions = async (userId: string): Promise<string[]> => {
  try {
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: { userId },
    });
    
    const permissions = new Set<string>();
    userRoles.forEach((userRole: any) => {
      // Extract permissions from the JSON field
      const rolePermissions = Array.isArray(userRole.permissions) 
        ? userRole.permissions 
        : typeof userRole.permissions === 'object' && userRole.permissions
        ? Object.values(userRole.permissions as any)
        : [];
      
      rolePermissions.forEach((permission: any) => {
        permissions.add(permission.name);
      });
    });
    
    return Array.from(permissions);
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    return [];
  }
};

/**
 * Saudi National ID validation
 */
export const validateSaudiNationalId = (nationalId: string): boolean => {
  // Saudi National ID is 10 digits starting with 1 or 2
  const pattern = /^[12]\d{9}$/;
  if (!pattern.test(nationalId)) return false;
  
  // Additional checksum validation can be added here
  return true;
};

/**
 * CSRF Protection
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionCsrf = (req as any).session?.csrfToken;
    
    if (!csrfToken || csrfToken !== sessionCsrf) {
      return res.status(403).json({
        error: 'CSRF validation failed',
        message: 'Invalid CSRF token',
      });
    }
  }
  next();
};

/**
 * Content Security Policy for Saudi compliance
 */
export const saudiComplianceHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Saudi-specific security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Saudi data localization header
  res.setHeader('X-Data-Location', 'saudi-arabia');
  res.setHeader('X-Compliance', 'saudi-pdpl,ndmo-standards');
  
  next();
};

/**
 * Cleanup job for sessions and temporary data
 */
setInterval(() => {
  SessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Run every hour

// Export middleware collection
export const securityMiddleware = {
  helmet: helmetConfig,
  cors: corsConfig,
  rateLimit: apiRateLimiter,
  authRateLimit: authRateLimiter,
  authenticate: authenticateToken,
  authorize,
  requirePermission,
  sanitize: sanitizeInput,
  csrfProtection,
  saudiCompliance: saudiComplianceHeaders,
};

export default securityMiddleware;