/**
 * Hook for optimizing React Query usage
 */

'use client';

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/app/hooks/performance/usePerformanceMonitor';
import { logError, ErrorCategory, ErrorSeverity } from '@/app/lib/errorHandler';

/**
 * Options for optimized query
 */
export interface OptimizedQueryOptions<TData, TError> extends UseQueryOptions<TData, TError> {
  /**
   * Component name for performance monitoring
   */
  componentName?: string;
  
  /**
   * Query name for performance monitoring and error logging
   */
  queryName?: string;
  
  /**
   * Whether to track performance
   */
  trackPerformance?: boolean;
  
  /**
   * Whether to log errors
   */
  logErrors?: boolean;
  
  /**
   * Error severity for logging
   */
  errorSeverity?: ErrorSeverity;
}

/**
 * Hook for optimizing React Query usage
 * @param options Query options
 * @returns Query result
 */
export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: OptimizedQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const {
    componentName = 'UnknownComponent',
    queryName = options.queryKey ? String(options.queryKey) : 'UnknownQuery',
    trackPerformance = true,
    logErrors = true,
    errorSeverity = ErrorSeverity.ERROR,
    ...queryOptions
  } = options;
  
  // Track component performance
  if (trackPerformance) {
    usePerformanceMonitor({
      componentName: `${componentName}_${queryName}`,
      trackRenders: true,
      trackMounts: true,
      trackUnmounts: true
    });
  }
  
  // Wrap the queryFn to track performance and handle errors
  const originalQueryFn = queryOptions.queryFn;
  
  if (originalQueryFn) {
    queryOptions.queryFn = async (...args: any[]) => {
      let endTracking: (() => void) | undefined;
      
      if (trackPerformance) {
        endTracking = trackInteraction(componentName, `query_${queryName}`);
      }
      
      try {
        const result = await originalQueryFn(...args);
        
        if (endTracking) {
          endTracking();
        }
        
        return result;
      } catch (error) {
        if (endTracking) {
          endTracking();
        }
        
        if (logErrors) {
          logError(error as Error, {
            category: ErrorCategory.QUERY,
            severity: errorSeverity,
            context: {
              componentName,
              queryName,
              queryKey: options.queryKey
            }
          });
        }
        
        throw error;
      }
    };
  }
  
  // Add default staleTime and cacheTime if not provided
  if (queryOptions.staleTime === undefined) {
    queryOptions.staleTime = 1000 * 60 * 5; // 5 minutes
  }
  
  if (queryOptions.gcTime === undefined) {
    queryOptions.gcTime = 1000 * 60 * 10; // 10 minutes
  }
  
  // Use the query with optimized options
  return useQuery<TData, TError>(queryOptions);
}

/**
 * Import trackInteraction from the performance monitor
 */
import { trackInteraction } from '@/app/hooks/performance/usePerformanceMonitor'; 