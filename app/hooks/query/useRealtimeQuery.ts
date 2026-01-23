/**
 * React Query hooks for real-time data with optimized polling
 * 
 * Replaces Firebase listeners with React Query's refetchInterval
 * for simpler, more maintainable real-time updates.
 */

import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { QUERY_CONFIGS } from '@/app/lib/query-config';

interface RealtimeQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  /**
   * Polling interval in milliseconds
   * Default: 30 seconds (from QUERY_CONFIGS.REALTIME)
   */
  realtimeInterval?: number;
  
  /**
   * Enable real-time updates
   * When false, uses standard polling from config
   */
  enableRealtime?: boolean;
}

/**
 * Hook for real-time data with React Query polling
 * 
 * Benefits over Firebase listeners:
 * - Single source of truth (React Query cache)
 * - Automatic retry and error handling
 * - Better TypeScript support
 * - Easier to test
 * - No manual subscription cleanup
 * - Works with any data source (not just Firebase)
 * 
 * @example
 * ```ts
 * const { data, isLoading } = useRealtimeQuery({
 *   queryKey: ['leaderboard', 'daily'],
 *   queryFn: () => getLeaderboard('daily'),
 *   enableRealtime: true, // Poll every 30s
 * });
 * ```
 */
export function useRealtimeQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: RealtimeQueryOptions<TData, TError> = {}
) {
  const {
    realtimeInterval,
    enableRealtime = false,
    ...queryOptions
  } = options;
  
  // Determine refetch interval based on realtime flag
  const refetchInterval = enableRealtime 
    ? (realtimeInterval ?? QUERY_CONFIGS.REALTIME.staleTime) 
    : false;
  
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...QUERY_CONFIGS.REALTIME,
    refetchInterval,
    refetchIntervalInBackground: enableRealtime, // Keep polling when tab is not focused
    ...queryOptions,
  });
}

/**
 * Configuration presets for different real-time use cases
 */
export const REALTIME_PRESETS = {
  /**
   * High-frequency updates (every 10 seconds)
   * Use for: Active game sessions, live competitions
   */
  HIGH_FREQUENCY: {
    realtimeInterval: 10 * 1000, // 10 seconds
    staleTime: 5 * 1000, // 5 seconds
  },
  
  /**
   * Standard updates (every 30 seconds) - DEFAULT
   * Use for: Leaderboards, social feeds
   */
  STANDARD: {
    realtimeInterval: 30 * 1000, // 30 seconds
    staleTime: 15 * 1000, // 15 seconds
  },
  
  /**
   * Low-frequency updates (every 60 seconds)
   * Use for: Status indicators, presence
   */
  LOW_FREQUENCY: {
    realtimeInterval: 60 * 1000, // 60 seconds
    staleTime: 30 * 1000, // 30 seconds
  },
} as const;
