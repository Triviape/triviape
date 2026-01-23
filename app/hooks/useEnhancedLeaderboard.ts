import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { leaderboardService } from '@/app/lib/services/leaderboardService';
import { 
  EnhancedLeaderboardEntry, 
  LeaderboardPeriod, 
  LeaderboardType, 
  LeaderboardFilters,
  PaginatedLeaderboard,
  LeaderboardSubscription,
  LeaderboardUpdate,
  GlobalLeaderboardStats
} from '@/app/types/leaderboard';

const QUERY_KEYS = {
  leaderboard: (type: LeaderboardType, period: LeaderboardPeriod, filters: LeaderboardFilters) => 
    ['leaderboard', type, period, filters],
  stats: (period: LeaderboardPeriod) => ['leaderboard-stats', period],
} as const;

interface UseEnhancedLeaderboardOptions {
  enabled?: boolean;
  refetchInterval?: number;
  realtime?: boolean;
}

/**
 * Enhanced hook for leaderboard functionality with real-time updates
 */
export function useEnhancedLeaderboard(
  type: LeaderboardType,
  period: LeaderboardPeriod,
  filters: LeaderboardFilters = {},
  options: UseEnhancedLeaderboardOptions = {}
) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<LeaderboardSubscription | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  
  const {
    enabled = true,
    refetchInterval = 60000, // 1 minute
    realtime = false
  } = options;

  // Main leaderboard query
  const leaderboardQuery = useQuery({
    queryKey: QUERY_KEYS.leaderboard(type, period, filters),
    queryFn: () => leaderboardService.getLeaderboard(type, period, filters),
    enabled,
    staleTime: realtime ? 0 : 30000, // 30 seconds if not real-time
    refetchInterval: realtime ? false : refetchInterval,
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
    staleTime: realtime ? 0 : 30000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !enabled) return;

    const handleRealtimeUpdate = (update: LeaderboardUpdate) => {
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.leaderboard(type, period, filters),
      });
      
      // Optionally, optimistically update the cache
      updateCacheOptimistically(update);
    };

    subscriptionRef.current = leaderboardService.subscribeToLeaderboard(
      type, 
      period, 
      filters, 
      handleRealtimeUpdate
    );
    
    setIsRealTimeConnected(subscriptionRef.current.isConnected);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
        setIsRealTimeConnected(false);
      }
    };
  }, [type, period, filters, realtime, enabled, queryClient]);

  // Optimistic cache updates
  const updateCacheOptimistically = useCallback((update: LeaderboardUpdate) => {
    const queryKey = QUERY_KEYS.leaderboard(type, period, filters);
    
    queryClient.setQueryData(queryKey, (oldData: PaginatedLeaderboard | undefined) => {
      if (!oldData) return oldData;

      const updatedEntries = [...oldData.entries];
      const entryIndex = updatedEntries.findIndex(entry => entry.id === update.entry.id);

      switch (update.type) {
        case 'entry_added':
          if (entryIndex === -1) {
            updatedEntries.push(update.entry);
            // Re-sort by score and completion time
            updatedEntries.sort((a, b) => {
              if (a.score !== b.score) return b.score - a.score;
              return a.completionTime - b.completionTime;
            });
            // Update ranks
            updatedEntries.forEach((entry, index) => {
              entry.rank = index + 1;
            });
          }
          break;
        case 'entry_updated':
          if (entryIndex !== -1) {
            updatedEntries[entryIndex] = update.entry;
          }
          break;
        case 'entry_removed':
          if (entryIndex !== -1) {
            updatedEntries.splice(entryIndex, 1);
            // Update ranks
            updatedEntries.forEach((entry, index) => {
              entry.rank = index + 1;
            });
          }
          break;
        case 'rank_changed':
          if (entryIndex !== -1) {
            updatedEntries[entryIndex] = { ...update.entry };
          }
          break;
      }

      return {
        ...oldData,
        entries: updatedEntries,
        totalCount: updatedEntries.length
      };
    });
  }, [type, period, filters, queryClient]);

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
    isRealTimeConnected,
    
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
      const result = await leaderboardService.addToLeaderboard(userId, params, period);
      
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