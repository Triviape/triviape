/**
 * Utilities for caching and optimizing data fetching
 */

import { useCallback, useEffect, useRef } from 'react';

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

/**
 * Hook for debouncing a function call
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedFn;
}

/**
 * Hook for throttling a function call
 * @param fn Function to throttle
 * @param limit Limit in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRunRef.current >= limit) {
        // If enough time has passed, run the function immediately
        lastRunRef.current = now;
        fn(...args);
      } else if (!timeoutRef.current) {
        // Otherwise, schedule it to run when the limit is reached
        const remaining = limit - (now - lastRunRef.current);
        
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          timeoutRef.current = null;
          fn(...args);
        }, remaining);
      }
    },
    [fn, limit]
  );
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return throttledFn;
} 