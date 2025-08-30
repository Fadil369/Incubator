"use strict";
/**
 * Enhanced Security Middleware for BrainSAIT Platform
 * Implements comprehensive security measures for Saudi healthcare SME data protection
 *
 * @author BrainSAIT Platform
 * @version 2.0.0
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.saudiComplianceHeaders = exports.csrfProtection = exports.validateSaudiNationalId = exports.getClientIp = exports.logSecurityEvent = exports.SessionManager = exports.fileUploadSecurity = exports.preventSQLInjection = exports.sanitizeInput = exports.verifyPassword = exports.hashPassword = exports.validatePassword = exports.DataEncryption = exports.requirePermission = exports.authorize = exports.authenticateToken = exports.generateTokens = exports.authRateLimiter = exports.apiRateLimiter = exports.corsConfig = exports.helmetConfig = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validator_1 = __importDefault(require("validator"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Security configuration
const SECURITY_CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || crypto_1.default.randomBytes(32).toString('hex'),
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
/**
 * Enhanced Helmet configuration for security headers
 */
exports.helmetConfig = (0, helmet_1.default)({
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
exports.corsConfig = (0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
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
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    ...SECURITY_CONFIG.API_RATE_LIMITS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        (0, exports.logSecurityEvent)({
            action: 'RATE_LIMIT_EXCEEDED',
            ipAddress: (0, exports.getClientIp)(req),
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
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    ...SECURITY_CONFIG.AUTH_RATE_LIMITS,
    skipFailedRequests: false,
    handler: (req, res) => {
        (0, exports.logSecurityEvent)({
            action: 'AUTH_RATE_LIMIT_EXCEEDED',
            ipAddress: (0, exports.getClientIp)(req),
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
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        smeId: user.smeId,
    }, SECURITY_CONFIG.JWT_SECRET, {
        expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN,
        issuer: 'brainsait-platform',
        audience: 'saudi-healthcare-sme',
    });
    const refreshToken = jsonwebtoken_1.default.sign({
        id: user.id,
        tokenVersion: user.tokenVersion || 0,
    }, SECURITY_CONFIG.JWT_REFRESH_SECRET, {
        expiresIn: SECURITY_CONFIG.JWT_REFRESH_EXPIRES_IN,
        issuer: 'brainsait-platform',
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
/**
 * JWT Authentication Middleware
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided',
            });
        }
        jsonwebtoken_1.default.verify(token, SECURITY_CONFIG.JWT_SECRET, async (err, decoded) => {
            if (err) {
                (0, exports.logSecurityEvent)({
                    action: 'INVALID_TOKEN',
                    ipAddress: (0, exports.getClientIp)(req),
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
            req.sessionId = crypto_1.default.randomBytes(16).toString('hex');
            req.ipAddress = (0, exports.getClientIp)(req);
            req.userAgent = req.get('user-agent') || 'unknown';
            next();
        });
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error',
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Role-based access control middleware
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated',
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, exports.logSecurityEvent)({
                action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                userId: req.user.id,
                ipAddress: (0, exports.getClientIp)(req),
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
exports.authorize = authorize;
/**
 * Permission-based access control
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions?.includes(permission)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Missing required permission: ${permission}`,
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
/**
 * Data encryption for sensitive information
 */
class DataEncryption {
    algorithm = 'aes-256-cbc';
    key;
    constructor() {
        this.key = Buffer.from(SECURITY_CONFIG.ENCRYPTION_KEY, 'hex');
    }
    encrypt(text) {
        const iv = crypto_1.default.randomBytes(SECURITY_CONFIG.ENCRYPTION_IV_LENGTH);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    decrypt(text) {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}
exports.DataEncryption = DataEncryption;
/**
 * Password validation for Saudi compliance
 */
const validatePassword = (password) => {
    const errors = [];
    if (!validator_1.default.isStrongPassword(password, SECURITY_CONFIG.PASSWORD_REQUIREMENTS)) {
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
exports.validatePassword = validatePassword;
/**
 * Hash password with bcrypt
 */
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(SECURITY_CONFIG.BCRYPT_ROUNDS);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
/**
 * Verify password
 */
const verifyPassword = async (password, hash) => {
    return bcryptjs_1.default.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    // Sanitize params
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Recursive object sanitization
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        // Remove potential XSS attempts
        return validator_1.default.escape(obj.trim());
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (typeof obj === 'object' && obj !== null) {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Sanitize key and value
                const sanitizedKey = validator_1.default.escape(key);
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
const preventSQLInjection = (value) => {
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
exports.preventSQLInjection = preventSQLInjection;
/**
 * File upload security
 */
exports.fileUploadSecurity = {
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
    validateFile: (file) => {
        if (!exports.fileUploadSecurity.allowedMimeTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Invalid file type' };
        }
        if (file.size > exports.fileUploadSecurity.maxFileSize) {
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
class SessionManager {
    static sessions = new Map();
    static createSession(userId, data) {
        const sessionId = crypto_1.default.randomBytes(32).toString('hex');
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
    static getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        if (new Date() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return null;
        }
        session.lastActivity = new Date();
        return session;
    }
    static destroySession(sessionId) {
        this.sessions.delete(sessionId);
    }
    static cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
exports.SessionManager = SessionManager;
/**
 * Security audit logging
 */
const logSecurityEvent = async (event) => {
    try {
        if (SECURITY_CONFIG.SAUDI_COMPLIANCE.auditLogEnabled) {
            // Store in database
            await prisma.auditLog.create({
                data: {
                    userId: event.userId,
                    action: event.action,
                    resource: event.resource,
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                    status: event.status,
                    details: event.details ? JSON.stringify(event.details) : undefined,
                    timestamp: event.timestamp,
                },
            });
        }
        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[SECURITY AUDIT]', event);
        }
    }
    catch (error) {
        console.error('Failed to log security event:', error);
    }
};
exports.logSecurityEvent = logSecurityEvent;
/**
 * Get client IP address
 */
const getClientIp = (req) => {
    return (req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        'unknown');
};
exports.getClientIp = getClientIp;
/**
 * Get user permissions
 */
const getUserPermissions = async (userId) => {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });
        const permissions = new Set();
        userRoles.forEach(userRole => {
            userRole.role.permissions.forEach(permission => {
                permissions.add(permission.name);
            });
        });
        return Array.from(permissions);
    }
    catch (error) {
        console.error('Failed to get user permissions:', error);
        return [];
    }
};
/**
 * Saudi National ID validation
 */
const validateSaudiNationalId = (nationalId) => {
    // Saudi National ID is 10 digits starting with 1 or 2
    const pattern = /^[12]\d{9}$/;
    if (!pattern.test(nationalId))
        return false;
    // Additional checksum validation can be added here
    return true;
};
exports.validateSaudiNationalId = validateSaudiNationalId;
/**
 * CSRF Protection
 */
const csrfProtection = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
        const sessionCsrf = req.session?.csrfToken;
        if (!csrfToken || csrfToken !== sessionCsrf) {
            return res.status(403).json({
                error: 'CSRF validation failed',
                message: 'Invalid CSRF token',
            });
        }
    }
    next();
};
exports.csrfProtection = csrfProtection;
/**
 * Content Security Policy for Saudi compliance
 */
const saudiComplianceHeaders = (req, res, next) => {
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
exports.saudiComplianceHeaders = saudiComplianceHeaders;
/**
 * Cleanup job for sessions and temporary data
 */
setInterval(() => {
    SessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Run every hour
// Export middleware collection
exports.securityMiddleware = {
    helmet: exports.helmetConfig,
    cors: exports.corsConfig,
    rateLimit: exports.apiRateLimiter,
    authRateLimit: exports.authRateLimiter,
    authenticate: exports.authenticateToken,
    authorize: exports.authorize,
    requirePermission: exports.requirePermission,
    sanitize: exports.sanitizeInput,
    csrfProtection: exports.csrfProtection,
    saudiCompliance: exports.saudiComplianceHeaders,
};
exports.default = exports.securityMiddleware;
//# sourceMappingURL=security.js.map