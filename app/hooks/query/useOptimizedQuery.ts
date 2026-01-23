/**
 * Hook for optimizing React Query usage
 */

'use client';

import { useQuery, UseQueryOptions, QueryKey, QueryFunction } from '@tanstack/react-query';
import { safeAsync, AppError } from '@/app/lib/errorHandling';
import { shouldUseMockData } from '@/app/lib/environment';
import { QUERY_CONFIGS, smartRetry } from '@/app/lib/query-config';

/**
 * Extended query options for performance monitoring
 */
interface OptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey;
  queryFn: QueryFunction<TData, QueryKey>;
  componentName?: string;
  queryName?: string;
  mockFn?: () => TData;
  enableMockFallback?: boolean;
}

/**
 * Enhanced version of useQuery with optimized defaults and error handling
 */
export function useOptimizedQuery<TData, TError = AppError>({
  queryKey,
  queryFn,
  componentName,
  queryName,
  mockFn,
  enableMockFallback = false,
  ...options
}: OptimizedQueryOptions<TData, TError>) {
  // Create a wrapped query function with error handling
  const wrappedQueryFn: QueryFunction<TData, QueryKey> = async (context) => {
    try {
      // Log query execution in development
      if (process.env.NODE_ENV === 'development') {
        const keyString = context.queryKey.map(k => 
          typeof k === 'string' ? k : JSON.stringify(k)
        ).join(', ');
        
        console.debug(
          `[Query] ${componentName || 'Component'}::${queryName || keyString}`,
          { queryKey: context.queryKey }
        );
      }
      
      // Execute the original query function
      return await queryFn(context);
    } catch (error) {
      // If mock fallback is enabled and we should use mock data
      if (enableMockFallback && shouldUseMockData() && mockFn) {
        console.info(`Using mock data for ${componentName || 'Component'}::${queryName || 'query'}`);
        return mockFn();
      }
      
      // Otherwise, propagate the error
      throw error;
    }
  };
  
  // Use centralized config - default to STANDARD
  const defaultOptions = {
    ...QUERY_CONFIGS.STANDARD,
    retry: smartRetry,
  };
  
  // Merge defaults with provided options
  return useQuery<TData, TError, TData, QueryKey>({
    queryKey,
    queryFn: wrappedQueryFn,
    ...defaultOptions,
    ...options
  });
}

/**
 * Import trackInteraction from the performance monitor
 */
import { trackInteraction } from '@/app/hooks/performance/usePerformanceMonitor'; 