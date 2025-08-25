interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

export class CacheManager<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private readonly ttlMs: number;

  constructor(ttlMinutes: number = 10) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Get cached data or fetch new data using the provided fetcher function
   * @param key Cache key
   * @param fetcher Function to fetch data if not cached or expired
   * @returns Cached or newly fetched data
   */
  async get(
    key: string,
    fetcher: () => Promise<T>,
  ): Promise<{ data: T; fromCache: boolean }> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if valid
    if (cached && cached.expiresAt > now) {
      return { data: cached.data, fromCache: true };
    }

    // Fetch new data
    const data = await fetcher();

    // Cache the successful result
    this.cache.set(key, {
      data,
      expiresAt: now + this.ttlMs,
    });

    // Clean up expired entries periodically
    this.cleanupExpired();

    return { data, fromCache: false };
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries to prevent memory leaks
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

// Default cache instance for treasury data (10 minute TTL)
export const treasuryCacheManager = new CacheManager(10);
