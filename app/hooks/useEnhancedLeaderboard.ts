import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { leaderboardService } from '@/app/lib/services/leaderboardService';
import { 
  LeaderboardPeriod, 
  LeaderboardType, 
  LeaderboardFilters,
  LeaderboardUpdate
} from '@/app/types/leaderboard';
import { REALTIME_PRESETS } from './query/useRealtimeQuery';

const QUERY_KEYS = {
  leaderboard: (type: LeaderboardType, period: LeaderboardPeriod, filters: LeaderboardFilters) => 
    ['leaderboard', type, period, filters],
  stats: (period: LeaderboardPeriod) => ['leaderboard-stats', period],
} as const;

const HIDDEN_REFETCH_BASE_DELAY = 1000;
const HIDDEN_REFETCH_MAX_DELAY = 30000;

interface UseEnhancedLeaderboardOptions {
  enabled?: boolean;
  realtime?: boolean;
}

/**
 * Enhanced hook for leaderboard functionality with optional Firestore listener-driven updates.
 */
export function useEnhancedLeaderboard(
  type: LeaderboardType,
  period: LeaderboardPeriod,
  filters: LeaderboardFilters = {},
  options: UseEnhancedLeaderboardOptions = {}
) {
  const queryClient = useQueryClient();
  
  const {
    enabled = true,
    realtime = false
  } = options;
  const hiddenRefetchDelayRef = useRef(HIDDEN_REFETCH_BASE_DELAY);
  const hiddenRefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateLeaderboardQueries = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.leaderboard(type, period, filters),
    });
    void queryClient.invalidateQueries({
      queryKey: [...QUERY_KEYS.leaderboard(type, period, filters), 'infinite'],
    });
  }, [filters, period, queryClient, type]);

  const clearPendingHiddenRefetch = useCallback(() => {
    if (hiddenRefetchTimeoutRef.current) {
      clearTimeout(hiddenRefetchTimeoutRef.current);
      hiddenRefetchTimeoutRef.current = null;
    }
  }, []);

  const scheduleVisibilityAwareRefetch = useCallback(() => {
    if (!realtime) {
      return;
    }

    if (typeof document === 'undefined' || !document.hidden) {
      clearPendingHiddenRefetch();
      hiddenRefetchDelayRef.current = HIDDEN_REFETCH_BASE_DELAY;
      invalidateLeaderboardQueries();
      return;
    }

    if (hiddenRefetchTimeoutRef.current) {
      return;
    }

    const delay = hiddenRefetchDelayRef.current;
    hiddenRefetchTimeoutRef.current = setTimeout(() => {
      hiddenRefetchTimeoutRef.current = null;

      if (typeof document !== 'undefined' && document.hidden) {
        hiddenRefetchDelayRef.current = Math.min(
          hiddenRefetchDelayRef.current * 2,
          HIDDEN_REFETCH_MAX_DELAY
        );
        scheduleVisibilityAwareRefetch();
        return;
      }

      hiddenRefetchDelayRef.current = HIDDEN_REFETCH_BASE_DELAY;
      invalidateLeaderboardQueries();
    }, delay);
  }, [clearPendingHiddenRefetch, invalidateLeaderboardQueries, realtime]);

  useEffect(() => {
    if (!enabled || !realtime) {
      clearPendingHiddenRefetch();
      hiddenRefetchDelayRef.current = HIDDEN_REFETCH_BASE_DELAY;
      return;
    }

    const subscription = leaderboardService.subscribeToLeaderboard(
      type,
      period,
      filters,
      (_update: LeaderboardUpdate) => {
        scheduleVisibilityAwareRefetch();
      }
    );

    return () => {
      subscription.unsubscribe();
      clearPendingHiddenRefetch();
      hiddenRefetchDelayRef.current = HIDDEN_REFETCH_BASE_DELAY;
    };
  }, [clearPendingHiddenRefetch, enabled, filters, period, realtime, scheduleVisibilityAwareRefetch, type]);

  useEffect(() => {
    if (!enabled || !realtime || typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearPendingHiddenRefetch();
        hiddenRefetchDelayRef.current = HIDDEN_REFETCH_BASE_DELAY;
        invalidateLeaderboardQueries();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearPendingHiddenRefetch, enabled, invalidateLeaderboardQueries, realtime]);

  // Main leaderboard query with optional real-time listener updates
  const leaderboardQuery = useQuery({
    queryKey: QUERY_KEYS.leaderboard(type, period, filters),
    queryFn: () => leaderboardService.getLeaderboard(type, period, filters),
    enabled,
    staleTime: realtime ? REALTIME_PRESETS.STANDARD.staleTime : 30000,
    retry: 2,
  });

  // Infinite query for pagination
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.leaderboard(type, period, filters), 'infinite'],
    queryFn: ({ pageParam }) => 
      leaderboardService.getLeaderboard(type, period, filters, 25, pageParam),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: realtime ? REALTIME_PRESETS.STANDARD.staleTime : 30000,
  });

  // Manual refresh
  const refresh = useCallback(() => {
    return leaderboardQuery.refetch();
  }, [leaderboardQuery]);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
      return infiniteQuery.fetchNextPage();
    }
  }, [infiniteQuery]);

  // Get flattened entries from infinite query
  const allEntries = infiniteQuery.data?.pages.flatMap(page => page.entries) || [];

  return {
    // Data
    data: leaderboardQuery.data,
    entries: leaderboardQuery.data?.entries || [],
    allEntries,
    totalCount: leaderboardQuery.data?.totalCount || 0,
    currentUserRank: leaderboardQuery.data?.currentUserRank,
    
    // Infinite query data
    infiniteData: infiniteQuery.data,
    hasNextPage: infiniteQuery.hasNextPage,
    
    // Loading states
    isLoading: leaderboardQuery.isLoading,
    isFetching: leaderboardQuery.isFetching,
    isLoadingMore: infiniteQuery.isFetchingNextPage,
    isRefreshing: leaderboardQuery.isRefetching,
    
    // Error states
    error: leaderboardQuery.error || infiniteQuery.error,
    isError: leaderboardQuery.isError || infiniteQuery.isError,
    
    // Real-time status
    isRealTimeEnabled: realtime,
    isRealTimeConnected: realtime && !leaderboardQuery.isError,
    
    // Actions
    refresh,
    loadMore,
    
    // Utils
    invalidate: () => queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.leaderboard(type, period, filters)
    }),
  };
}

/**
 * Hook for leaderboard statistics
 */
export function useLeaderboardStats(
  period: LeaderboardPeriod,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: QUERY_KEYS.stats(period),
    queryFn: () => leaderboardService.getGlobalStats(period),
    enabled,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 2,
  });
}

/**
 * Hook for adding entries to leaderboard
 */
export function useAddToLeaderboard() {
  const queryClient = useQueryClient();

  const addToLeaderboard = useCallback(async (
    userId: string,
    params: { quizId: string; score: number; completionTime: number; dateCompleted?: string },
    period: LeaderboardPeriod = 'daily'
  ) => {
    try {
      const result = await leaderboardService.addToEnhancedLeaderboard(userId, params, period);
      
      // Invalidate all leaderboard queries
      queryClient.invalidateQueries({
        queryKey: ['leaderboard']
      });
      
      // Invalidate stats
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.stats(period)
      });
      
      return result;
    } catch (error) {
      console.error('Error adding to leaderboard:', error);
      throw error;
    }
  }, [queryClient]);

  return { addToLeaderboard };
}

/**
 * Hook for invalidating leaderboard caches
 */
export function useLeaderboardCache() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  }, [queryClient]);

  const invalidateSpecific = useCallback((
    type: LeaderboardType, 
    period: LeaderboardPeriod, 
    filters: LeaderboardFilters = {}
  ) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.leaderboard(type, period, filters)
    });
  }, [queryClient]);

  const prefetchLeaderboard = useCallback(async (
    type: LeaderboardType,
    period: LeaderboardPeriod,
    filters: LeaderboardFilters = {}
  ) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.leaderboard(type, period, filters),
      queryFn: () => leaderboardService.getLeaderboard(type, period, filters),
      staleTime: 30000,
    });
  }, [queryClient]);

  return {
    invalidateAll,
    invalidateSpecific,
    prefetchLeaderboard,
  };
}
