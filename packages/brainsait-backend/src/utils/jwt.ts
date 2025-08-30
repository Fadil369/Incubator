import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { config } from '../config/environment';
import { redisClient } from '../server';
import { logger } from './logger';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Generate access and refresh tokens
 */
export const generateTokenPair = async (
  userId: string,
  email: string,
  role: UserRole
): Promise<TokenPair> => {
  const sessionId = generateSessionId();

  const payload: TokenPayload = {
    id: userId,
    email,
    role,
    sessionId,
  };

  // Generate access token (shorter expiry)
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: '15m', // 15 minutes
  });

  // Generate refresh token (longer expiry)
  const refreshToken = jwt.sign(
    { sessionId, userId },
    config.jwt.secret,
    { expiresIn: '7d' } // 7 days
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
  await redisClient.setEx(
    sessionKey,
    7 * 24 * 60 * 60, // 7 days in seconds
    JSON.stringify(sessionData)
  );

  // Store refresh token mapping
  const refreshKey = `refresh:${sessionId}`;
  await redisClient.setEx(
    refreshKey,
    7 * 24 * 60 * 60, // 7 days in seconds
    refreshToken
  );

  logger.info(`New session created for user: ${email}`, { sessionId });

  return {
    accessToken,
    refreshToken,
    sessionId,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string } | null> => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
      sessionId: string;
      userId: string;
    };

    const { sessionId, userId } = decoded;

    // Check if refresh token exists and matches
    const refreshKey = `refresh:${sessionId}`;
    const storedRefreshToken = await redisClient.get(refreshKey);

    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      logger.warn(`Invalid refresh token attempt for session: ${sessionId}`);
      return null;
    }

    // Get session data
    const sessionKey = `session:${sessionId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      // Clean up orphaned refresh token
      await redisClient.del(refreshKey);
      logger.warn(`Session not found for refresh token: ${sessionId}`);
      return null;
    }

    const session = JSON.parse(sessionData);

    // Generate new access token
    const payload: TokenPayload = {
      id: session.userId,
      email: session.email,
      role: session.role,
      sessionId,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '15m',
    });

    // Update last accessed time
    session.lastAccessed = new Date().toISOString();
    await redisClient.setEx(
      sessionKey,
      7 * 24 * 60 * 60,
      JSON.stringify(session)
    );

    logger.info(`Access token refreshed for user: ${session.email}`, { sessionId });

    return { accessToken };
  } catch (error) {
    logger.error('Error refreshing token:', error);
    return null;
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  try {
    // Get session data for logging
    const sessionKey = `session:${sessionId}`;
    const sessionData = await redisClient.get(sessionKey);
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      logger.info(`Session revoked for user: ${session.email}`, { sessionId });
    }

    // Delete session and refresh token
    const refreshKey = `refresh:${sessionId}`;
    await Promise.all([
      redisClient.del(sessionKey),
      redisClient.del(refreshKey),
    ]);
  } catch (error) {
    logger.error('Error revoking session:', error);
    throw error;
  }
};

/**
 * Revoke all sessions for a user
 */
export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  try {
    // Find all sessions for the user
    const sessionKeys = await redisClient.keys('session:*');
    const sessionsToRevoke: string[] = [];

    for (const sessionKey of sessionKeys) {
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.userId === userId) {
          const sessionId = sessionKey.replace('session:', '');
          sessionsToRevoke.push(sessionId);
        }
      }
    }

    // Revoke all sessions
    await Promise.all(
      sessionsToRevoke.map(sessionId => revokeSession(sessionId))
    );

    logger.info(`All sessions revoked for user: ${userId}`, {
      sessionCount: sessionsToRevoke.length,
    });
  } catch (error) {
    logger.error('Error revoking all user sessions:', error);
    throw error;
  }
};

/**
 * Get active sessions for a user
 */
export const getUserSessions = async (userId: string) => {
  try {
    const sessionKeys = await redisClient.keys('session:*');
    const userSessions = [];

    for (const sessionKey of sessionKeys) {
      const sessionData = await redisClient.get(sessionKey);
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
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    return [];
  }
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Clean up expired sessions (should be run periodically)
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const sessionKeys = await redisClient.keys('session:*');
    let cleanedCount = 0;

    for (const sessionKey of sessionKeys) {
      const ttl = await redisClient.ttl(sessionKey);
      if (ttl === -1 || ttl === 0) {
        // Session has no TTL or is expired
        const sessionId = sessionKey.replace('session:', '');
        await revokeSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
  }
};