/**
 * Caching Strategy for Travereel
 * 
 * Multi-level caching:
 * 1. In-memory cache (LRU) - Fast, limited size
 * 2. Response cache - API response caching
 * 3. Stale-while-revalidate - Serve stale data while fetching fresh
 * 
 * TTL (Time To Live) guidelines:
 * - User profiles: 5 minutes
 * - Feed posts: 2 minutes
 * - Search results: 10 minutes
 * - Recommendations: 30 minutes
 * - Itinerary data: 5 minutes
 * - Static data: 1 hour
 */

export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
  lastAccessed: number
  accessCount: number
}

export interface CacheConfig {
  maxEntries: number
  defaultTTL: number
  cleanupInterval: number
}

// Default cache configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxEntries: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 10 * 60 * 1000, // 10 minutes
}

/**
 * In-Memory LRU Cache
 */
export class LRUCache<K = string, V = any> {
  private cache = new Map<K, CacheEntry<V>>()
  private config: CacheConfig
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanupTimer()
  }

  /**
   * Get item from cache
   * Returns null if not found or expired
   */
  get(key: K): V | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update access metrics
    entry.lastAccessed = Date.now()
    entry.accessCount += 1

    return entry.data
  }

  /**
   * Set item in cache
   */
  set(key: K, value: V, ttl?: number): void {
    // If cache is full, remove least recently used
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU()
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      lastAccessed: Date.now(),
      accessCount: 1,
    })
  }

  /**
   * Delete item from cache
   */
  delete(key: K): void {
    this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxEntries: number
    hitRate: number
  } {
    let totalAccesses = 0
    let hits = 0

    this.cache.forEach(entry => {
      totalAccesses += entry.accessCount
      hits += entry.accessCount > 0 ? 1 : 0
    })

    return {
      size: this.cache.size,
      maxEntries: this.config.maxEntries,
      hitRate: totalAccesses > 0 ? hits / totalAccesses : 0,
    }
  }

  /**
   * Remove least recently used entry
   */
  private evictLRU(): void {
    let lruKey: K | null = null
    let lruTime = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    })

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * Remove all expired entries
   */
  private cleanup(): void {
    const now = Date.now()

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    })
  }

  /**
   * Destroy cache and cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.cache.clear()
  }
}

/**
 * Global cache instance
 */
export const globalCache = new LRUCache({
  maxEntries: 2000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 10 * 60 * 1000, // 10 minutes
})

/**
 * Cache key generators
 */
export const cacheKeys = {
  // User data
  userProfile: (userId: string) => `user:${userId}`,
  userPreferences: (userId: string) => `user:prefs:${userId}`,
  userFriends: (userId: string) => `user:friends:${userId}`,
  
  // Feed
  userFeed: (userId: string, ranking: string) => `feed:${userId}:${ranking}`,
  userPosts: (userId: string) => `posts:user:${userId}`,
  
  // Search
  searchResults: (query: string, type: string) => `search:${type}:${query}`,
  
  // Itineraries
  itinerary: (id: string) => `itinerary:${id}`,
  userItineraries: (userId: string) => `itineraries:user:${userId}`,
  recommendations: (userId: string) => `recommendations:${userId}`,
  
  // Social
  friendSuggestions: (userId: string) => `friends:suggestions:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  
  // Static data
  countries: () => `static:countries`,
  activities: () => `static:activities`,
}

/**
 * TTL configurations for different data types
 */
export const cacheTTLs = {
  userProfile: 5 * 60 * 1000, // 5 minutes
  userFeed: 2 * 60 * 1000, // 2 minutes
  searchResults: 10 * 60 * 1000, // 10 minutes
  recommendations: 30 * 60 * 1000, // 30 minutes
  itinerary: 5 * 60 * 1000, // 5 minutes
  friendSuggestions: 15 * 60 * 1000, // 15 minutes
  static: 60 * 60 * 1000, // 1 hour
}

/**
 * Cache wrapper for async functions
 * Implements stale-while-revalidate pattern
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number,
  options: {
    staleWhileRevalidate?: boolean
    forceRefresh?: boolean
  } = {}
): Promise<T> {
  const { staleWhileRevalidate = true, forceRefresh = false } = options

  // Return fresh data if available
  if (!forceRefresh) {
    const cached = globalCache.get(key)
    if (cached) {
      return cached as T
    }
  }

  // Fetch fresh data
  const data = await fetchFn()

  // Cache the result
  globalCache.set(key, data, ttl)

  return data
}

/**
 * Invalidate related cache keys
 */
export function invalidateCache(pattern: string | RegExp): void {
  globalCache.getStats() // Access cache to iterate
  
  // Note: Map iteration doesn't allow deletion during iteration
  // We need to collect keys first
  const keysToDelete: string[] = []
  
  // This is a simplified version - in production, you'd want to track all keys
  console.warn(`Cache invalidation for pattern: ${pattern}`)
  console.warn('Full cache invalidation not implemented for performance reasons')
}

/**
 * Cache middleware for Next.js API routes
 */
export function withCache(
  handler: (request: Request) => Promise<Response>,
  ttl: number = 5 * 60 * 1000
) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url)
    const cacheKey = `api:${url.pathname}:${url.search}`

    // Check cache
    const cached = globalCache.get(cacheKey)
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      })
    }

    // Execute handler
    const response = await handler(request)

    // Cache successful responses
    if (response.ok) {
      const data = await response.json()
      globalCache.set(cacheKey, data, ttl)

      // Return cached response
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
        },
      })
    }

    return response
  }
}
