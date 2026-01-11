/**
 * Rate limiting utility for API endpoints (T083)
 * Uses in-memory storage with sliding window algorithm
 */

// Rate limit configuration per route pattern
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

// Default rate limits for different endpoint types
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Sync endpoints - more restrictive
  '/api/sync': {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 30,      // 30 requests per minute
  },
  // Push endpoint - most restrictive (heavy operation)
  '/api/sync/push': {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 pushes per minute
  },
  // Cloud projects - moderate
  '/api/cloud-projects': {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute
  },
  // Token management - restrictive
  '/api/tokens': {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,      // 20 requests per minute
  },
  // Default for other protected routes
  default: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,     // 100 requests per minute
  },
};

// In-memory store for rate limiting
// Key: identifier (IP or user ID), Value: array of request timestamps
const requestStore = new Map<string, number[]>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Start cleanup timer (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs));

    for (const [key, timestamps] of requestStore.entries()) {
      // Remove entries older than the max window
      const validTimestamps = timestamps.filter(t => now - t < maxWindow);
      if (validTimestamps.length === 0) {
        requestStore.delete(key);
      } else {
        requestStore.set(key, validTimestamps);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Get the rate limit config for a given path
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for specific path matches (most specific first)
  if (pathname.includes('/push')) {
    return RATE_LIMITS['/api/sync/push'];
  }

  // Check for prefix matches
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }

  return RATE_LIMITS.default;
}

/**
 * Check if a request should be rate limited
 * Returns { limited: false } if allowed, or { limited: true, retryAfter } if blocked
 */
export function checkRateLimit(
  identifier: string,
  pathname: string
): { limited: boolean; retryAfter?: number; remaining?: number } {
  const config = getRateLimitConfig(pathname);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get existing timestamps for this identifier
  const timestamps = requestStore.get(identifier) || [];

  // Filter to only timestamps within the current window
  const recentTimestamps = timestamps.filter(t => t > windowStart);

  // Check if limit exceeded
  if (recentTimestamps.length >= config.maxRequests) {
    // Calculate when the oldest request in window will expire
    const oldestInWindow = Math.min(...recentTimestamps);
    const retryAfter = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);

    return {
      limited: true,
      retryAfter,
      remaining: 0,
    };
  }

  // Add current request timestamp
  recentTimestamps.push(now);
  requestStore.set(identifier, recentTimestamps);

  return {
    limited: false,
    remaining: config.maxRequests - recentTimestamps.length,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  identifier: string,
  pathname: string
): Record<string, string> {
  const config = getRateLimitConfig(pathname);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const timestamps = requestStore.get(identifier) || [];
  const recentTimestamps = timestamps.filter(t => t > windowStart);

  const remaining = Math.max(0, config.maxRequests - recentTimestamps.length);
  const resetTime = Math.ceil((now + config.windowMs) / 1000);

  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  };
}

/**
 * Extract identifier from request (IP address or user ID)
 */
export function getRequestIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    // Take the first IP in the chain (client IP)
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }

  if (realIp) {
    return `ip:${realIp}`;
  }

  // Default fallback
  return 'ip:unknown';
}
