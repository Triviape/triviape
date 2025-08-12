/**
 * Hook for optimizing React Query usage
 */

'use client';

import { useQuery, UseQueryOptions, QueryKey, QueryFunction } from '@tanstack/react-query';
import { safeAsync, AppError } from '@/app/lib/errorHandling';
import { shouldUseMockData } from '@/app/lib/environment';

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
  enableMockFallback = true,
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
  
  // Set optimized defaults
  const defaultOptions: Partial<UseQueryOptions<TData, TError, TData, QueryKey>> = {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if ((error as any)?.status >= 400 && (error as any)?.status < 500) {
        return false;
      }
      
      // Retry other errors up to 3 times
      return failureCount < 3;
    }
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