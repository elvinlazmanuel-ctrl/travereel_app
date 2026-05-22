/**
 * Enhanced Rate Limiting System
 * 
 * Features:
 * - Per-endpoint rate limits
 * - User-tier based limits (free vs premium)
 * - IP-based tracking
 * - Sliding window algorithm
 * - Redis-ready architecture
 * - Graceful degradation
 * 
 * Rate limit tiers:
 * - Strict: 10 requests/minute (auth, payments)
 * - Standard: 30 requests/minute (posts, comments)
 * - Relaxed: 60 requests/minute (feed, search)
 * - Custom: Configurable per endpoint
 */

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message: string // Error message when limit exceeded
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitEntry {
  requests: number[]
  lastReset: number
}

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Rate limit configurations by tier
const TIER_LIMITS = {
  free: {
    strict: { windowMs: 60000, maxRequests: 10 },
    standard: { windowMs: 60000, maxRequests: 30 },
    relaxed: { windowMs: 60000, maxRequests: 60 },
  },
  explorer: {
    strict: { windowMs: 60000, maxRequests: 20 },
    standard: { windowMs: 60000, maxRequests: 60 },
    relaxed: { windowMs: 60000, maxRequests: 120 },
  },
  traveler: {
    strict: { windowMs: 60000, maxRequests: 30 },
    standard: { windowMs: 60000, maxRequests: 100 },
    relaxed: { windowMs: 60000, maxRequests: 200 },
  },
  nomad: {
    strict: { windowMs: 60000, maxRequests: 50 },
    standard: { windowMs: 60000, maxRequests: 200 },
    relaxed: { windowMs: 60000, maxRequests: 500 },
  },
}

// Default rate limits for different endpoint categories
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.',
  },
  'ai-generation': {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
    message: 'AI generation limit reached. Please wait before generating more.',
  },
  posts: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
    message: 'Too many posts created. Please slow down.',
  },
  comments: {
    windowMs: 60000, // 1 minute
    maxRequests: 20,
    message: 'Too many comments. Please wait before commenting again.',
  },
  search: {
    windowMs: 60000, // 1 minute
    maxRequests: 30,
    message: 'Too many searches. Please wait a moment.',
  },
  upload: {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
    message: 'Too many uploads. Please wait before uploading more.',
  },
  api: {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.',
  },
}

/**
 * In-memory rate limiter store
 * In production, use Redis for distributed systems
 */
export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(cleanupIntervalMs: number = 10 * 60 * 1000) {
    this.startCleanup(cleanupIntervalMs)
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    // Initialize entry if not exists
    if (!entry) {
      this.store.set(key, {
        requests: [now],
        lastReset: now,
      })
      return {
        limited: false,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
      }
    }

    // Remove expired requests
    const windowStart = now - config.windowMs
    entry.requests = entry.requests.filter(time => time > windowStart)

    // Check if limit exceeded
    if (entry.requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...entry.requests)
      const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000)

      return {
        limited: true,
        remaining: 0,
        resetTime: oldestRequest + config.windowMs,
        retryAfter,
      }
    }

    // Add request
    entry.requests.push(now)

    return {
      limited: false,
      remaining: config.maxRequests - entry.requests.length,
      resetTime: now + config.windowMs,
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): number {
    const entry = this.store.get(key)
    return entry ? entry.requests.length : 0
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, intervalMs)
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const maxWindowMs = 15 * 60 * 1000 // 15 minutes (largest window)

    this.store.forEach((entry, key) => {
      const oldestRequest = Math.min(...entry.requests)
      if (now - oldestRequest > maxWindowMs) {
        this.store.delete(key)
      }
    })
  }

  /**
   * Destroy rate limiter and cleanup timer
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter()

/**
 * Get rate limit config for endpoint category
 */
export function getRateLimitConfig(
  category: string,
  userTier: string = 'free'
): RateLimitConfig {
  const defaultConfig = DEFAULT_LIMITS[category] || DEFAULT_LIMITS.api
  
  // Apply tier multiplier
  const tierLimits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free
  
  // Determine limit type
  let limitType: 'strict' | 'standard' | 'relaxed' = 'standard'
  if (category === 'auth' || category === 'ai-generation') {
    limitType = 'strict'
  } else if (category === 'search' || category === 'api') {
    limitType = 'relaxed'
  }
  
  const tierLimit = tierLimits[limitType]
  
  return {
    ...defaultConfig,
    windowMs: tierLimit.windowMs,
    maxRequests: tierLimit.maxRequests,
  }
}

/**
 * Generate rate limit key from request
 */
export function generateRateLimitKey(
  request: Request,
  userId?: string
): string {
  const ip = getRequestIP(request)
  const path = new URL(request.url).pathname
  
  // Use userId if available, otherwise IP
  const identifier = userId || ip
  
  return `ratelimit:${path}:${identifier}`
}

/**
 * Extract IP address from request
 */
export function getRequestIP(request: Request): string {
  // Check for forwarded headers (behind proxy)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback (may not work in all environments)
  return 'unknown'
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function withEnhancedRateLimit(
  request: Request,
  category: string,
  userId?: string,
  userTier: string = 'free'
): Response | null {
  const config = getRateLimitConfig(category, userTier)
  const key = generateRateLimitKey(request, userId)
  
  const result = globalRateLimiter.checkLimit(key, config)
  
  if (result.limited) {
    return new Response(
      JSON.stringify({
        error: config.message,
        retryAfter: result.retryAfter,
        remaining: result.remaining,
        resetTime: result.resetTime,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    )
  }
  
  // Return null to allow request to proceed
  return null
}

/**
 * Get rate limit headers to add to response
 */
export function getRateLimitHeaders(
  request: Request,
  category: string,
  userId?: string,
  userTier: string = 'free'
): Record<string, string> {
  const config = getRateLimitConfig(category, userTier)
  const key = generateRateLimitKey(request, userId)
  const usage = globalRateLimiter.getUsage(key)
  
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': Math.max(0, config.maxRequests - usage).toString(),
    'X-RateLimit-Reset': (Date.now() + config.windowMs).toString(),
  }
}

/**
 * Check if endpoint should be rate limited
 */
export function shouldRateLimit(pathname: string): boolean {
  // Skip rate limiting for certain paths
  const skipPaths = [
    '/api/health',
    '/api/robots.txt',
    '/sitemap.xml',
  ]
  
  return !skipPaths.some(path => pathname.startsWith(path))
}

/**
 * Rate limit categories for different API routes
 */
export const RATE_LIMIT_CATEGORIES: Record<string, string> = {
  '/api/auth': 'auth',
  '/api/password-reset': 'auth',
  '/api/ai/generate-itinerary': 'ai-generation',
  '/api/posts': 'posts',
  '/api/comments': 'comments',
  '/api/search': 'search',
  '/api/upload': 'upload',
  '/api/itineraries': 'api',
  '/api/users': 'api',
  '/api/friends': 'api',
  '/api/notifications': 'api',
}

/**
 * Get rate limit category for a path
 */
export function getRateLimitCategory(pathname: string): string {
  for (const [path, category] of Object.entries(RATE_LIMIT_CATEGORIES)) {
    if (pathname.startsWith(path)) {
      return category
    }
  }
  return 'api' // Default category
}
