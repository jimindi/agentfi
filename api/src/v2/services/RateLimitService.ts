import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

/**
 * Rate limiting service for API endpoints
 * 
 * Implements multiple rate limit tiers:
 * - Per-IP (prevents DDoS)
 * - Per-API-Key (based on user)
 * - Per-Endpoint (protects expensive operations)
 */

// Redis client for rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('error', (err) => {
  console.error('Redis rate limit error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected for rate limiting');
});

// Rate limit configurations
export const RATE_LIMITS = {
  // Per-IP limits (prevents DDoS) - uses default IP-based key
  IP_HOURLY: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 requests per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:ip:'
    }),
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP address',
        retryAfter: 3600
      }
    }
  },

  // Per-API-Key limits (default tier)
  API_KEY_HOURLY: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour per key
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      // Use user ID from authentication if available
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }
      // Fallback to default IP handling (handles IPv6 correctly)
      return undefined;
    },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:key:'
    }),
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded',
        retryAfter: 3600
      }
    }
  },

  // Swap endpoint limit (expensive operation)
  SWAP_PER_MINUTE: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 swaps per minute per key
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      if (req.user?.id) {
        return `user:${req.user.id}`;
      }
      return undefined;
    },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:swap:'
    }),
    message: {
      success: false,
      error: {
        code: 'SWAP_RATE_LIMIT_EXCEEDED',
        message: 'Swap rate limit exceeded. Maximum 10 swaps per minute.',
        retryAfter: 60
      }
    }
  },

  // Auth endpoint limit (prevent brute force) - uses default IP-based key
  AUTH_PER_MINUTE: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: 'rl:auth:'
    }),
    message: {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: 60
      }
    }
  }
};

// Create rate limiters
export const ipRateLimiter = rateLimit(RATE_LIMITS.IP_HOURLY);
export const apiKeyRateLimiter = rateLimit(RATE_LIMITS.API_KEY_HOURLY);
export const swapRateLimiter = rateLimit(RATE_LIMITS.SWAP_PER_MINUTE);
export const authRateLimiter = rateLimit(RATE_LIMITS.AUTH_PER_MINUTE);

/**
 * Get remaining rate limit for a user
 */
export async function getRateLimitInfo(userId: string): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const key = `rl:key:user:${userId}`;
  
  try {
    const ttl = await redis.ttl(key);
    const current = await redis.get(key);
    
    const limit = RATE_LIMITS.API_KEY_HOURLY.max;
    const remaining = limit - (current ? parseInt(current) : 0);
    const reset = new Date(Date.now() + (ttl * 1000));
    
    return { limit, remaining, reset };
  } catch (error) {
    // Return default if Redis unavailable
    return {
      limit: RATE_LIMITS.API_KEY_HOURLY.max,
      remaining: RATE_LIMITS.API_KEY_HOURLY.max,
      reset: new Date(Date.now() + RATE_LIMITS.API_KEY_HOURLY.windowMs)
    };
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(userId: string): Promise<void> {
  const key = `rl:key:user:${userId}`;
  await redis.del(key);
}

export default {
  ipRateLimiter,
  apiKeyRateLimiter,
  swapRateLimiter,
  authRateLimiter,
  getRateLimitInfo,
  resetRateLimit
};
