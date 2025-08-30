"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredSessions = exports.verifyToken = exports.getUserSessions = exports.revokeAllUserSessions = exports.revokeSession = exports.refreshAccessToken = exports.generateTokenPair = exports.generateSessionId = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const environment_1 = require("../config/environment");
const server_1 = require("../server");
const logger_1 = require("./logger");
/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
    return (0, crypto_1.randomBytes)(32).toString('hex');
};
exports.generateSessionId = generateSessionId;
/**
 * Generate access and refresh tokens
 */
const generateTokenPair = async (userId, email, role) => {
    const sessionId = (0, exports.generateSessionId)();
    const payload = {
        id: userId,
        email,
        role,
        sessionId,
    };
    // Generate access token (shorter expiry)
    const accessToken = jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.secret, {
        expiresIn: '15m', // 15 minutes
    });
    // Generate refresh token (longer expiry)
    const refreshToken = jsonwebtoken_1.default.sign({ sessionId, userId }, environment_1.config.jwt.secret, { expiresIn: '7d' } // 7 days
    );
    // Store session data in Redis
    const sessionData = {
        userId,
        email,
        role,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
    };
    const sessionKey = `session:${sessionId}`;
    await server_1.redisClient.setex(sessionKey, 7 * 24 * 60 * 60, // 7 days in seconds
    JSON.stringify(sessionData));
    // Store refresh token mapping
    const refreshKey = `refresh:${sessionId}`;
    await server_1.redisClient.setex(refreshKey, 7 * 24 * 60 * 60, // 7 days in seconds
    refreshToken);
    logger_1.logger.info(`New session created for user: ${email}`, { sessionId });
    return {
        accessToken,
        refreshToken,
        sessionId,
    };
};
exports.generateTokenPair = generateTokenPair;
/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, environment_1.config.jwt.secret);
        const { sessionId, userId } = decoded;
        // Check if refresh token exists and matches
        const refreshKey = `refresh:${sessionId}`;
        const storedRefreshToken = await server_1.redisClient.get(refreshKey);
        if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
            logger_1.logger.warn(`Invalid refresh token attempt for session: ${sessionId}`);
            return null;
        }
        // Get session data
        const sessionKey = `session:${sessionId}`;
        const sessionData = await server_1.redisClient.get(sessionKey);
        if (!sessionData) {
            // Clean up orphaned refresh token
            await server_1.redisClient.del(refreshKey);
            logger_1.logger.warn(`Session not found for refresh token: ${sessionId}`);
            return null;
        }
        const session = JSON.parse(sessionData);
        // Generate new access token
        const payload = {
            id: session.userId,
            email: session.email,
            role: session.role,
            sessionId,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.secret, {
            expiresIn: '15m',
        });
        // Update last accessed time
        session.lastAccessed = new Date().toISOString();
        await server_1.redisClient.setex(sessionKey, 7 * 24 * 60 * 60, JSON.stringify(session));
        logger_1.logger.info(`Access token refreshed for user: ${session.email}`, { sessionId });
        return { accessToken };
    }
    catch (error) {
        logger_1.logger.error('Error refreshing token:', error);
        return null;
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Revoke a specific session
 */
const revokeSession = async (sessionId) => {
    try {
        // Get session data for logging
        const sessionKey = `session:${sessionId}`;
        const sessionData = await server_1.redisClient.get(sessionKey);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            logger_1.logger.info(`Session revoked for user: ${session.email}`, { sessionId });
        }
        // Delete session and refresh token
        const refreshKey = `refresh:${sessionId}`;
        await Promise.all([
            server_1.redisClient.del(sessionKey),
            server_1.redisClient.del(refreshKey),
        ]);
    }
    catch (error) {
        logger_1.logger.error('Error revoking session:', error);
        throw error;
    }
};
exports.revokeSession = revokeSession;
/**
 * Revoke all sessions for a user
 */
const revokeAllUserSessions = async (userId) => {
    try {
        // Find all sessions for the user
        const sessionKeys = await server_1.redisClient.keys('session:*');
        const sessionsToRevoke = [];
        for (const sessionKey of sessionKeys) {
            const sessionData = await server_1.redisClient.get(sessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.userId === userId) {
                    const sessionId = sessionKey.replace('session:', '');
                    sessionsToRevoke.push(sessionId);
                }
            }
        }
        // Revoke all sessions
        await Promise.all(sessionsToRevoke.map(sessionId => (0, exports.revokeSession)(sessionId)));
        logger_1.logger.info(`All sessions revoked for user: ${userId}`, {
            sessionCount: sessionsToRevoke.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Error revoking all user sessions:', error);
        throw error;
    }
};
exports.revokeAllUserSessions = revokeAllUserSessions;
/**
 * Get active sessions for a user
 */
const getUserSessions = async (userId) => {
    try {
        const sessionKeys = await server_1.redisClient.keys('session:*');
        const userSessions = [];
        for (const sessionKey of sessionKeys) {
            const sessionData = await server_1.redisClient.get(sessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.userId === userId) {
                    userSessions.push({
                        sessionId: sessionKey.replace('session:', ''),
                        createdAt: session.createdAt,
                        lastAccessed: session.lastAccessed,
                    });
                }
            }
        }
        return userSessions;
    }
    catch (error) {
        logger_1.logger.error('Error getting user sessions:', error);
        return [];
    }
};
exports.getUserSessions = getUserSessions;
/**
 * Verify and decode JWT token
 */
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
/**
 * Clean up expired sessions (should be run periodically)
 */
const cleanupExpiredSessions = async () => {
    try {
        const sessionKeys = await server_1.redisClient.keys('session:*');
        let cleanedCount = 0;
        for (const sessionKey of sessionKeys) {
            const ttl = await server_1.redisClient.ttl(sessionKey);
            if (ttl === -1 || ttl === 0) {
                // Session has no TTL or is expired
                const sessionId = sessionKey.replace('session:', '');
                await (0, exports.revokeSession)(sessionId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.info(`Cleaned up ${cleanedCount} expired sessions`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error cleaning up expired sessions:', error);
    }
};
exports.cleanupExpiredSessions = cleanupExpiredSessions;
//# sourceMappingURL=jwt.js.map