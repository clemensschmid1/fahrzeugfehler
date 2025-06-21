import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

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
  // Initialize Redis client inside the function to ensure environment variables are available
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Per-user sliding window (10/min)
  const userLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit_user',
  });

  // Per-IP fallback (5/min)
  const ipLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit_ip',
  });

  // Global cap (5000/day)
  const globalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5000, '1 d'),
    analytics: true,
    prefix: 'ratelimit_global',
  });

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
  if (userId) {
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
  } else if (ip) {
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
} 