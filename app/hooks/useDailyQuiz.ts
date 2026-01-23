import { useQuery, useQueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { getDailyQuiz, getTodayDateString } from '@/app/lib/services/dailyQuizService';
import { Quiz } from '@/app/types/quiz';
import { useEffect } from 'react';
import { QUERY_CONFIGS } from '@/app/lib/query-config';

/**
 * Generates consistent query key for daily quiz caching
 * Includes the date to invalidate when day changes
 */
export const getDailyQuizQueryKey = (dateString: string): QueryKey => ['dailyQuiz', dateString];

/**
 * Custom hook for fetching the daily quiz with optimized caching
 * - Caches quiz data for the entire day
 * - Automatically refreshes when date changes
 * - Prefetches quiz questions for improved UX
 */
export function useDailyQuiz<TData = Quiz | null>(
  options: Omit<UseQueryOptions<Quiz | null, Error, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  const today = getTodayDateString();
  const queryClient = useQueryClient();
  
  // Check if we need to force a refetch based on date change
  useEffect(() => {
    const lastFetchDate = localStorage.getItem('lastDailyQuizFetch');
    
    // If date has changed since last fetch, invalidate cache
    if (lastFetchDate && lastFetchDate !== today) {
      queryClient.invalidateQueries({ queryKey: getDailyQuizQueryKey(lastFetchDate) });
    }
    
    // Update last fetch date
    localStorage.setItem('lastDailyQuizFetch', today);
  }, [today, queryClient]);
  
  return useQuery({
    queryKey: getDailyQuizQueryKey(today),
    queryFn: () => getDailyQuiz(),
    ...QUERY_CONFIGS.DAILY, // Use centralized daily config
    ...options,
  });
}

/**
 * Prefetches today's daily quiz
 * Useful for initial app load or navigation scenarios
 */
export async function prefetchDailyQuiz(
  queryClient: ReturnType<typeof useQueryClient>
): Promise<void> {
  const today = getTodayDateString();
  
  try {
    await queryClient.prefetchQuery({
      queryKey: getDailyQuizQueryKey(today),
      queryFn: () => getDailyQuiz(),
      ...QUERY_CONFIGS.DAILY,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Successfully prefetched daily quiz');
    }
  } catch (error) {
    console.error('Failed to prefetch daily quiz:', error);
  }
}

/**
 * Force invalidates the daily quiz cache
 * Use this when you need fresh data (e.g., after quiz completion)
 */
export function invalidateDailyQuizCache(
  queryClient: ReturnType<typeof useQueryClient>
): void {
  const today = getTodayDateString();
  queryClient.invalidateQueries({ queryKey: getDailyQuizQueryKey(today) });
} 