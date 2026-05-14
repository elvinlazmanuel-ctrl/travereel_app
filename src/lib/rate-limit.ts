// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number  // Time window in milliseconds
  maxRequests: number  // Max requests per window
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
}

// Stricter limits for write operations
const STRICT_OPTIONS: RateLimitOptions = {
  windowMs: 60 * 1000,
  maxRequests: 20,
}

// Very strict for auth operations
const AUTH_OPTIONS: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 min
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = DEFAULT_OPTIONS
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetIn: options.windowMs,
    }
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

export { DEFAULT_OPTIONS, STRICT_OPTIONS, AUTH_OPTIONS }
