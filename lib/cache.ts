// Simple in-memory cache for processed data
// In production, consider using Redis or Vercel KV

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()

  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

export const dataCache = new DataCache()
