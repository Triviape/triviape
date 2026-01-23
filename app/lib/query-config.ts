/**
 * Centralized React Query Configuration
 * 
 * Defines standardized query settings for different data types
 * to ensure consistent behavior across the app.
 */

import { UseQueryOptions } from '@tanstack/react-query';

/**
 * Query configuration categories based on data freshness requirements
 */
export const QUERY_CONFIGS = {
  /**
   * Static/rarely-changing data (quiz definitions, categories, etc.)
   * - Cached for 15 minutes
   * - Kept in memory for 1 hour
   */
  STATIC: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
  },

  /**
   * Semi-dynamic data (user profiles, quiz results, daily quiz)
   * - Cached for 5 minutes
   * - Kept in memory for 30 minutes
   */
  STANDARD: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 3,
  },

  /**
   * Real-time data (leaderboards, active quiz sessions)
   * - Cached for 30 seconds
   * - Kept in memory for 5 minutes
   */
  REALTIME: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  },

  /**
   * Daily-specific data (daily quiz, daily leaderboard)
   * - Cached for 1 hour (since daily content changes once per day)
   * - Kept in memory for 24 hours
   */
  DAILY: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
  },
} as const;

/**
 * Default mutation options
 */
export const DEFAULT_MUTATION_OPTIONS = {
  retry: 1,
  onError: (error: unknown) => {
    console.error('Mutation error:', error);
  },
};

/**
 * Smart retry logic for queries
 * Don't retry on 4xx client errors
 */
export const smartRetry = (failureCount: number, error: unknown): boolean => {
  const statusCode = (error as any)?.status || (error as any)?.response?.status;
  
  // Don't retry on client errors (4xx)
  if (statusCode >= 400 && statusCode < 500) {
    return false;
  }
  
  // Retry other errors up to the configured retry limit
  return failureCount < 3;
};

/**
 * Helper to get query config by type
 */
export type QueryConfigType = keyof typeof QUERY_CONFIGS;

export function getQueryConfig<TData = unknown, TError = Error>(
  type: QueryConfigType
): Partial<UseQueryOptions<TData, TError>> {
  return QUERY_CONFIGS[type] as Partial<UseQueryOptions<TData, TError>>;
}
