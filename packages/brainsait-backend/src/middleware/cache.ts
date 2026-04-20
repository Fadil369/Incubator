/**
 * Redis response-caching middleware.
 *
 * Usage:
 *   router.get('/api/programs', cache(60), getProgramsHandler);
 *
 * The cache key is derived from the request method + full URL (including query string).
 * Only GET/HEAD requests are cached. Non-2xx responses are never cached.
 * The client can bypass the cache by sending `Cache-Control: no-cache`.
 */

import type { Request, Response, NextFunction } from 'express';
import { createClient, type RedisClientType } from 'redis';
import { config } from '../config/environment';

// Shared Redis client (lazily connected)
let redisClient: ReturnType<typeof createClient> | null = null;
let redisReady = false;

async function getRedis(): Promise<ReturnType<typeof createClient> | null> {
  if (redisReady && redisClient) return redisClient;
  if (redisClient) return null; // connecting in progress or failed

  try {
    redisClient = createClient({ url: config.redis.url });
    redisClient.on('error', () => {
      redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
    return redisClient;
  } catch {
    redisReady = false;
    return null;
  }
}

/**
 * Returns an Express middleware that caches successful GET responses in Redis.
 *
 * @param ttlSeconds   How long (in seconds) to cache the response. Default 60.
 * @param keyPrefix    Optional prefix to namespace cache keys. Default 'api-cache'.
 */
export function cache(ttlSeconds = 60, keyPrefix = 'api-cache') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET / HEAD
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    // Allow clients to bypass cache
    if (req.headers['cache-control'] === 'no-cache') {
      next();
      return;
    }

    const redis = await getRedis();
    if (!redis) {
      // Redis unavailable — serve normally
      next();
      return;
    }

    const cacheKey = `${keyPrefix}:${req.method}:${req.originalUrl}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { status: number; body: unknown; contentType: string };
        res.setHeader('Content-Type', parsed.contentType);
        res.setHeader('X-Cache', 'HIT');
        res.status(parsed.status).json(parsed.body);
        return;
      }
    } catch {
      // Cache miss or parse error — fall through
    }

    // Intercept the response to store it
    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      const result = originalJson(body);

      // Only cache 2xx responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const contentType = res.getHeader('Content-Type') as string ?? 'application/json';
        const toStore = JSON.stringify({ status: res.statusCode, body, contentType });
        redis.set(cacheKey, toStore, { EX: ttlSeconds }).catch(() => {/* ignore store errors */});
      }

      res.setHeader('X-Cache', 'MISS');
      return result;
    };

    next();
  };
}

/**
 * Invalidate all cache entries matching a prefix pattern.
 * Useful to call after a mutation (POST/PUT/DELETE) on a resource.
 *
 * @param pattern   Redis KEYS pattern, e.g. 'api-cache:GET:/api/programs*'
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch {
    // Ignore
  }
}
