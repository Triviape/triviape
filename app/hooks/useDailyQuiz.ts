import { useQuery, useQueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { getDailyQuiz, getTodayDateString } from '@/app/lib/services/dailyQuizService';
import { Quiz } from '@/app/types/quiz';
import { useEffect } from 'react';

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
    staleTime: 60 * 60 * 1000, // Keep cached for 1 hour (daily quiz refreshes maximum once per hour)
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours (useful for offline support)
    refetchOnMount: false, // Only refetch on mount if the date changed or cache is empty
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce Firestore reads
    retry: 3, // Retry up to 3 times
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
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
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