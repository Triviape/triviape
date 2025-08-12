"use client";

/**
 * Client-side utilities for caching and optimizing data fetching
 */

import { useCallback, useEffect, useRef } from 'react';

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
