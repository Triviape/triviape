import { useQuery, useQueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { getLeaderboardEntries } from '@/app/lib/services/leaderboardService';
import { DailyQuizLeaderboardEntry } from '@/app/types/leaderboard';
import { getTodayDateString } from '@/app/lib/services/dailyQuizService';
import { QUERY_CONFIGS } from '@/app/lib/query-config';

/**
 * Generates a consistent query key for leaderboard caching
 */
export const getLeaderboardQueryKey = (quizId: string, dateString?: string): QueryKey => 
  dateString ? ['leaderboard', quizId, dateString] : ['leaderboard', quizId];

/**
 * Hook for fetching leaderboard data
 * @param quizId ID of the quiz
 * @param dateString Optional date string for daily quizzes
 * @param options Additional query options
 * @returns Query result with leaderboard entries
 */
export function useLeaderboard<TData = DailyQuizLeaderboardEntry[]>(
  quizId: string,
  dateString?: string,
  options: Omit<UseQueryOptions<DailyQuizLeaderboardEntry[], Error, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  const queryKey = getLeaderboardQueryKey(quizId, dateString);
  
  return useQuery({
    queryKey,
    queryFn: () => getLeaderboardEntries(quizId, dateString),
    ...QUERY_CONFIGS.REALTIME, // Use centralized realtime config for leaderboards
    ...options,
  });
}

/**
 * Invalidates leaderboard cache
 * @param queryClient Query client instance
 * @param quizId Optional quiz ID to invalidate specific leaderboard
 * @param dateString Optional date string for daily leaderboards
 */
export function invalidateLeaderboardCache(
  queryClient: ReturnType<typeof useQueryClient>,
  quizId?: string,
  dateString?: string
): void {
  if (quizId && dateString) {
    // Invalidate specific daily quiz leaderboard
    queryClient.invalidateQueries({ queryKey: getLeaderboardQueryKey(quizId, dateString) });
  } else if (quizId) {
    // Invalidate all leaderboards for this quiz
    queryClient.invalidateQueries({ queryKey: ['leaderboard', quizId] });
  } else {
    // Invalidate all leaderboards
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  }
} 