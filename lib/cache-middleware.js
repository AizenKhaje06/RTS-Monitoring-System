import { dataCache, cacheKeys } from "./cache.js"
import { logger } from "./logger.js"

/**
 * Cache configuration with TTLs for different data types
 */
const CACHE_CONFIG = {
  dashboard: 5 * 60 * 1000, // 5 minutes
  overview: 5 * 60 * 1000, // 5 minutes
  lifecycle: 5 * 60 * 1000, // 5 minutes
  issues: 3 * 60 * 1000, // 3 minutes (more sensitive)
  financial: 5 * 60 * 1000, // 5 minutes
  analytics: 10 * 60 * 1000, // 10 minutes (historical)
  forecast: 15 * 60 * 1000, // 15 minutes
  budget: 30 * 60 * 1000, // 30 minutes
  auditTrail: 2 * 60 * 1000, // 2 minutes
  health: 1 * 60 * 1000, // 1 minute
}

/**
 * Get cache key for API endpoint
 */
export function getCacheKey(endpoint, params = {}) {
  const { sortBy, startDate, endDate, page, pageSize, limit } = params

  switch (endpoint) {
    case "dashboard":
      return cacheKeys.dashboard(sortBy, startDate, endDate)
    case "overview":
      return cacheKeys.overview()
    case "lifecycle":
      return cacheKeys.lifecycle()
    case "issues":
      return cacheKeys.issues()
    case "financial":
      return cacheKeys.financial()
    case "analytics":
      return cacheKeys.analytics()
    case "forecast":
      return cacheKeys.forecast()
    case "budget":
      return cacheKeys.budget()
    case "auditTrail":
      return cacheKeys.auditTrail(limit || 50)
    case "health":
      return "health"
    default:
      return null
  }
}

/**
 * Attempt to get cached response
 */
export function getCachedResponse(endpoint, params = {}) {
  const cacheKey = getCacheKey(endpoint, params)
  if (!cacheKey) return null

  const cached = dataCache.get(cacheKey)
  if (cached) {
    logger.debug("Cache hit", { endpoint, cacheKey })
    return cached
  }

  return null
}

/**
 * Store response in cache
 */
export function setCachedResponse(endpoint, response, params = {}) {
  const cacheKey = getCacheKey(endpoint, params)
  if (!cacheKey) return

  const ttl = CACHE_CONFIG[endpoint] || CACHE_CONFIG.dashboard
  dataCache.set(cacheKey, response, ttl)
  logger.debug("Cache set", { endpoint, cacheKey, ttl })
}

/**
 * Invalidate cache for specific endpoint
 */
export function invalidateCache(endpoint, params = {}) {
  const cacheKey = getCacheKey(endpoint, params)
  if (cacheKey) {
    dataCache.delete(cacheKey)
    logger.info("Cache invalidated", { endpoint, cacheKey })
  }
}

/**
 * Invalidate all cache entries
 */
export function invalidateAllCache() {
  dataCache.clear()
  logger.info("All cache invalidated")
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    ...dataCache.getStats(),
    config: CACHE_CONFIG,
  }
}

/**
 * Cache wrapper for async functions
 */
export async function withCache(endpoint, params, fetchFn) {
  // Check cache first
  const cached = getCachedResponse(endpoint, params)
  if (cached) {
    return cached
  }

  // Fetch new data
  const response = await fetchFn()

  // Store in cache
  setCachedResponse(endpoint, response, params)

  return response
}
