import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Debug: Check if Redis environment variables are available
console.log('Redis URL available:', !!process.env.UPSTASH_REDIS_REST_URL);
console.log('Redis Token available:', !!process.env.UPSTASH_REDIS_REST_TOKEN);

// Only create Redis client if environment variables are available
let redis: Redis | null = null;
let userLimiter: Ratelimit | null = null;
let ipLimiter: Ratelimit | null = null;
let globalLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = Redis.fromEnv();

    // Per-user sliding window (10/min)
    userLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit_user',
    });

    // Per-IP fallback (5/min)
    ipLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit_ip',
    });

    // Global cap (5000/day)
    globalLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5000, '1 d'),
      analytics: true,
      prefix: 'ratelimit_global',
    });

    console.log('Redis rate limiters initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis rate limiters:', error);
  }
} else {
  console.warn('Redis environment variables missing - rate limiting disabled');
}

function makeHeaders(res: { limit: number; remaining: number; reset: number }) {
  return {
    'X-RateLimit-Limit': res.limit.toString(),
    'X-RateLimit-Remaining': res.remaining.toString(),
    'X-RateLimit-Reset': res.reset.toString(),
  };
}

export async function checkRateLimit({
  userId,
  ip,
  routeKey = 'default',
}: {
  userId?: string | null;
  ip?: string | null;
  routeKey?: string;
}) {
  // If Redis is not available, allow all requests
  if (!globalLimiter) {
    console.warn('Rate limiting disabled - Redis not available');
    return {
      allowed: true,
      headers: { 'X-RateLimit-Limit': '0', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '0' },
      retryAfter: null,
      reason: null,
    };
  }

  try {
    // 1. Global limit
    const globalKey = `global:${routeKey}`;
    const globalRes = await globalLimiter.limit(globalKey);
    if (!globalRes.success) {
      return {
        allowed: false,
        headers: makeHeaders(globalRes),
        retryAfter: globalRes.reset,
        reason: 'global',
      };
    }

    // 2. User or IP limit
    if (userId && userLimiter) {
      const userKey = `user:${userId}:${routeKey}`;
      const userRes = await userLimiter.limit(userKey);
      if (!userRes.success) {
        return {
          allowed: false,
          headers: makeHeaders(userRes),
          retryAfter: userRes.reset,
          reason: 'user',
        };
      }
    } else if (ip && ipLimiter) {
      const ipKey = `ip:${ip}:${routeKey}`;
      const ipRes = await ipLimiter.limit(ipKey);
      if (!ipRes.success) {
        return {
          allowed: false,
          headers: makeHeaders(ipRes),
          retryAfter: ipRes.reset,
          reason: 'ip',
        };
      }
    }

    // Allowed
    return {
      allowed: true,
      headers: makeHeaders(globalRes), // Always return global headers for consistency
      retryAfter: null,
      reason: null,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, allow the request to prevent blocking users
    return {
      allowed: true,
      headers: { 'X-RateLimit-Limit': '0', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '0' },
      retryAfter: null,
      reason: null,
    };
  }
} 