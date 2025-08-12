/**
 * Utilities for caching and optimizing data fetching
 */

// Cache storage for memoized data
const globalCache: Record<string, {
  data: any;
  timestamp: number;
  ttl: number;
}> = {};

/**
 * Options for the cache
 */
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
  cacheKey?: string; // Custom cache key
}

/**
 * Create a cache key from the function name and arguments
 */
export function createCacheKey(fnName: string, args: any[]): string {
  try {
    return `${fnName}:${JSON.stringify(args)}`;
  } catch (error) {
    // If arguments can't be stringified, use a fallback
    console.warn('Could not stringify arguments for cache key', error);
    return `${fnName}:${Date.now()}`;
  }
}

/**
 * Memoize a function with caching
 * @param fn Function to memoize
 * @param options Cache options
 * @returns Memoized function
 */
export function memoizeWithCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions = {}
): T {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default TTL
    staleWhileRevalidate = true,
  } = options;

  const memoized = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Create a cache key based on function name and arguments
    const fnName = fn.name || 'anonymous';
    const cacheKey = options.cacheKey || createCacheKey(fnName, args);
    
    const now = Date.now();
    const cached = globalCache[cacheKey];
    
    // Check if we have valid cached data
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // If staleWhileRevalidate is enabled and we have stale data, return it
    // and fetch fresh data in the background
    if (staleWhileRevalidate && cached) {
      // Fetch fresh data in the background
      fn(...args)
        .then(freshData => {
          globalCache[cacheKey] = {
            data: freshData,
            timestamp: Date.now(),
            ttl
          };
        })
        .catch(error => {
          console.error(`Error refreshing cached data for ${cacheKey}:`, error);
        });
      
      // Return stale data immediately
      return cached.data;
    }
    
    // No valid cache, fetch fresh data
    try {
      const result = await fn(...args);
      
      // Cache the result
      globalCache[cacheKey] = {
        data: result,
        timestamp: Date.now(),
        ttl
      };
      
      return result;
    } catch (error) {
      // If we have stale data and an error occurs, return the stale data
      if (cached) {
        console.warn(`Error fetching fresh data for ${cacheKey}, using stale data:`, error);
        return cached.data;
      }
      
      // Otherwise, propagate the error
      throw error;
    }
  };
  
  return memoized as T;
}

/**
 * Clear the entire cache or a specific key
 * @param cacheKey Optional specific cache key to clear
 */
export function clearCache(cacheKey?: string): void {
  if (cacheKey) {
    delete globalCache[cacheKey];
  } else {
    // Clear all keys
    Object.keys(globalCache).forEach(key => {
      delete globalCache[key];
    });
  }
}