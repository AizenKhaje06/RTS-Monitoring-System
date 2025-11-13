// Simple in-memory cache for dashboard data
class DataCache {
  constructor() {
    this.cache = new Map();
    this.expiryTimes = new Map();
    this.defaultExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Set cache entry with optional expiry time
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} expiryMs - Expiry time in milliseconds (optional)
   */
  set(key, value, expiryMs = this.defaultExpiry) {
    this.cache.set(key, value);
    this.expiryTimes.set(key, Date.now() + expiryMs);
  }

  /**
   * Get cache entry if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if expired/not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const expiryTime = this.expiryTimes.get(key);
    if (Date.now() > expiryTime) {
      // Cache expired, remove it
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Check if cache entry exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if cache entry is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.expiryTimes.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.expiryTimes.entries()).filter(([_, expiry]) => now <= expiry).length;

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries: this.cache.size - validEntries,
    };
  }
}

// Export singleton instance
export const dataCache = new DataCache();

// Cache key generators
export const cacheKeys = {
  dashboard: (sortBy, startDate, endDate) => `dashboard:${sortBy}:${startDate || 'null'}:${endDate || 'null'}`,
  overview: () => 'overview',
  lifecycle: () => 'lifecycle',
  issues: () => 'issues',
  financial: () => 'financial',
  analytics: () => 'analytics',
  forecast: () => 'forecast',
  budget: () => 'budget',
  auditTrail: (limit) => `audit:${limit}`,
};
