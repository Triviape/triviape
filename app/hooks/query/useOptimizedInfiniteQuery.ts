/**
 * Hook for optimizing React Query infinite queries
 */

'use client';

import { 
  useInfiniteQuery, 
  InfiniteData,
  FetchNextPageOptions,
  UseInfiniteQueryOptions
} from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/app/hooks/performance/usePerformanceMonitor';
import { logError, ErrorCategory, ErrorSeverity } from '@/app/lib/errorHandler';
import { trackInteraction } from '@/app/hooks/performance/usePerformanceMonitor';
import { useCallback } from 'react';

/**
 * Firebase pagination result interface
 */
export interface PaginationResult<T> {
  items: T[];
  lastDoc: any;
  hasMore: boolean;
}

/**
 * Options for optimized infinite query
 */
export interface OptimizedInfiniteQueryOptions<TData = any, TError = Error> {
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
  
  /**
   * Threshold for prefetching next page (0-1, percentage of items viewed)
   */
  prefetchThreshold?: number;

  /**
   * Query function
   */
  queryFn?: any;

  /**
   * Query key
   */
  queryKey?: readonly unknown[];

  /**
   * Get next page param function
   */
  getNextPageParam?: any;

  /**
   * Initial page param
   */
  initialPageParam?: any;

  /**
   * Stale time in milliseconds
   */
  staleTime?: number;

  /**
   * Garbage collection time in milliseconds
   */
  gcTime?: number;

  /**
   * Other options from React Query
   */
  [key: string]: any;
}

/**
 * Result of optimized infinite query with enhanced methods
 */
export interface OptimizedInfiniteQueryResult<TData = any, TError = Error> {
  /**
   * Enhanced fetchNextPage with performance tracking
   */
  fetchNextPageOptimized: (options?: FetchNextPageOptions) => Promise<void>;
  
  /**
   * Get all pages data flattened into a single array
   */
  flatData: any[];
  
  /**
   * Total number of items across all pages
   */
  totalItems: number;
  
  /**
   * The query data
   */
  data?: InfiniteData<TData, any>;

  /**
   * Other properties from React Query result
   */
  [key: string]: any;
}

/**
 * Hook for optimizing React Query infinite queries
 * @param options Query options
 * @returns Enhanced infinite query result
 */
export function useOptimizedInfiniteQuery<TData = any, TError = Error>(
  options: OptimizedInfiniteQueryOptions<TData, TError>
): OptimizedInfiniteQueryResult<TData, TError> {
  const {
    componentName = 'UnknownComponent',
    queryName = options.queryKey ? String(options.queryKey) : 'UnknownQuery',
    trackPerformance = true,
    logErrors = true,
    errorSeverity = ErrorSeverity.ERROR,
    prefetchThreshold = 0.8,
    ...queryOptions
  } = options;
  
  // Track component performance
  if (trackPerformance) {
    usePerformanceMonitor({
      componentName: `${componentName}_${queryName}_infinite`,
      trackRenders: true,
      trackTimeOnScreen: true,
      logWarningAfterRenders: 10
    });
  }
  
  // Wrap the queryFn to track performance and handle errors
  const originalQueryFn = queryOptions.queryFn;
  
  if (originalQueryFn) {
    queryOptions.queryFn = async (context: any) => {
      let endTracking: (() => void) | undefined;
      
      if (trackPerformance) {
        const pageParam = context.pageParam ? `_page_${context.pageParam}` : '_initial';
        endTracking = trackInteraction(componentName, `query_${queryName}${pageParam}`);
      }
      
      try {
        const result = await originalQueryFn(context);
        
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
              additionalData: {
                componentName,
                queryName,
                queryKey: options.queryKey,
                pageParam: context.pageParam
              }
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

  // Ensure initialPageParam is set
  if (queryOptions.initialPageParam === undefined) {
    queryOptions.initialPageParam = 0;
  }

  // Ensure queryKey is a readonly array
  if (queryOptions.queryKey === undefined) {
    queryOptions.queryKey = ['defaultQueryKey'] as const;
  }
  
  // Ensure getNextPageParam is defined
  if (queryOptions.getNextPageParam === undefined) {
    queryOptions.getNextPageParam = () => undefined;
  }
  
  // Use the infinite query with type assertion to bypass TypeScript errors
  // @ts-ignore - We're handling the types manually
  const infiniteQueryResult = useInfiniteQuery(queryOptions);
  
  // Enhanced fetchNextPage with performance tracking
  const fetchNextPageOptimized = useCallback(
    async (fetchOptions?: FetchNextPageOptions) => {
      let endTracking: (() => void) | undefined;
      
      if (trackPerformance) {
        endTracking = trackInteraction(componentName, `fetchNextPage_${queryName}`);
      }
      
      try {
        await infiniteQueryResult.fetchNextPage(fetchOptions);
        
        if (endTracking) {
          endTracking();
        }
      } catch (error) {
        if (endTracking) {
          endTracking();
        }
        
        if (logErrors) {
          logError(error as Error, {
            category: ErrorCategory.QUERY,
            severity: errorSeverity,
            context: {
              additionalData: {
                componentName,
                queryName,
                action: 'fetchNextPage'
              }
            }
          });
        }
        
        throw error;
      }
    },
    [infiniteQueryResult.fetchNextPage, componentName, queryName, trackPerformance, logErrors, errorSeverity]
  );
  
  // Calculate flattened data
  const flatData = infiniteQueryResult.data?.pages.flatMap((page: any) => {
    // Handle both array and non-array data
    if (Array.isArray(page)) {
      return page;
    }
    return [page];
  }) || [];
  
  // Calculate total items
  const totalItems = flatData.length;
  
  // Return enhanced result
  return {
    ...infiniteQueryResult,
    fetchNextPageOptimized,
    flatData,
    totalItems
  } as OptimizedInfiniteQueryResult<TData, TError>;
}

/**
 * Hook for optimized infinite query with pagination result
 * Specifically designed for Firebase pagination with lastDoc pattern
 */
export function useOptimizedFirebaseInfiniteQuery<TItem = any, TError = Error>(
  options: OptimizedInfiniteQueryOptions<PaginationResult<TItem>, TError>
): OptimizedInfiniteQueryResult<PaginationResult<TItem>, TError> & {
  /**
   * All items from all pages flattened into a single array
   */
  allItems: TItem[];
  
  /**
   * Whether there are more items to load
   */
  hasMoreItems: boolean;
} {
  // Use the base optimized infinite query
  const infiniteQueryResult = useOptimizedInfiniteQuery<PaginationResult<TItem>, TError>(options);
  
  // Extract all items from all pages
  const allItems = (infiniteQueryResult.data?.pages as PaginationResult<TItem>[])?.flatMap(page => page.items) || [];
  
  // Check if there are more items to load
  const pages = infiniteQueryResult.data?.pages as PaginationResult<TItem>[] | undefined;
  const hasMoreItems = pages && pages.length > 0 ? pages[pages.length - 1]?.hasMore : false;
  
  // Return enhanced result
  return {
    ...infiniteQueryResult,
    allItems,
    hasMoreItems
  };
} 