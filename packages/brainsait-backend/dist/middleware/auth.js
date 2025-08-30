"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireVerified = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const environment_1 = require("../config/environment");
const logger_1 = require("../utils/logger");
const server_1 = require("../server");
const prisma = new client_1.PrismaClient();
/**
 * Middleware to authenticate JWT tokens and validate session
 */
const authenticate = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        // Check if session exists in Redis
        const sessionKey = `session:${decoded.sessionId}`;
        const sessionData = await server_1.redisClient.get(sessionKey);
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
            await server_1.redisClient.del(sessionKey);
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
        await server_1.redisClient.expire(sessionKey, 7 * 24 * 60 * 60); // 7 days
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Token expired.',
                },
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
exports.authenticate = authenticate;
/**
 * Middleware to check if user has required roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
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
exports.authorize = authorize;
/**
 * Middleware to check if user is verified (for sensitive operations)
 */
const requireVerified = (req, res, next) => {
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
exports.requireVerified = requireVerified;
/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        // Check session
        const sessionKey = `session:${decoded.sessionId}`;
        const sessionData = await server_1.redisClient.get(sessionKey);
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
    }
    catch (error) {
        // In optional auth, we don't fail on errors
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map