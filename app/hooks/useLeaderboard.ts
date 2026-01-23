import { useQuery, useQueryClient, QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { getLeaderboardEntries } from '@/app/lib/services/leaderboardService';
import { DailyQuizLeaderboardEntry } from '@/app/types/leaderboard';
import { getTodayDateString } from '@/app/lib/services/dailyQuizService';
import { useRealtimeQuery, REALTIME_PRESETS } from './query/useRealtimeQuery';

/**
 * Generates a consistent query key for leaderboard caching
 */
export const getLeaderboardQueryKey = (quizId: string, dateString?: string): QueryKey => 
  dateString ? ['leaderboard', quizId, dateString] : ['leaderboard', quizId];

interface UseLeaderboardOptions<TData> extends Omit<UseQueryOptions<DailyQuizLeaderboardEntry[], Error, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  /**
   * Enable real-time polling for live updates
   * Default: false
   */
  enableRealtime?: boolean;
}

/**
 * Hook for fetching leaderboard data with optional real-time updates
 * @param quizId ID of the quiz
 * @param dateString Optional date string for daily quizzes
 * @param options Additional query options
 * @returns Query result with leaderboard entries
 * 
 * @example
 * // Standard leaderboard (cached)
 * const { data } = useLeaderboard('quiz-1', '2026-01-23');
 * 
 * @example
 * // Real-time leaderboard (polls every 30s)
 * const { data } = useLeaderboard('quiz-1', '2026-01-23', { enableRealtime: true });
 */
export function useLeaderboard<TData = DailyQuizLeaderboardEntry[]>(
  quizId: string,
  dateString?: string,
  options: UseLeaderboardOptions<TData> = {}
) {
  const { enableRealtime = false, ...queryOptions } = options;
  const queryKey = getLeaderboardQueryKey(quizId, dateString);
  
  return useRealtimeQuery(
    queryKey,
    () => getLeaderboardEntries(quizId, dateString),
    {
      enableRealtime,
      ...REALTIME_PRESETS.STANDARD,
      ...queryOptions,
    }
  );
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