import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendService } from '@/app/lib/services/friendService';
import { 
  Friend, 
  FriendRequest, 
  Challenge, 
  FriendActivity, 
  FriendSearchResult,
  FriendStats,
  ActivityFilters,
  PresenceStatus
} from '@/app/types/social';
import { useAuth } from './useAuth';

const QUERY_KEYS = {
  friends: (userId: string) => ['friends', userId],
  friendRequests: (userId: string) => ['friend-requests', userId],
  friendActivity: (userId: string, filters: ActivityFilters) => ['friend-activity', userId, filters],
  friendSearch: (query: string, userId: string) => ['friend-search', query, userId],
  challenges: (userId: string) => ['challenges', userId],
  friendStats: (userId: string) => ['friend-stats', userId],
} as const;

/**
 * Hook for managing user's friends
 */
export function useFriends() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [friendPresence, setFriendPresence] = useState<Record<string, PresenceStatus>>({});

  const friendsQuery = useQuery({
    queryKey: QUERY_KEYS.friends(currentUser?.uid || ''),
    queryFn: () => friendService.getFriends(currentUser!.uid),
    enabled: !!currentUser?.uid,
    staleTime: 60000, // 1 minute
  });

  // Subscribe to friend presence updates
  useEffect(() => {
    if (!currentUser?.uid || !friendsQuery.data) return;

    const friendIds = friendsQuery.data.map(friend => friend.userId);
    if (friendIds.length === 0) return;

    const unsubscribe = friendService.subscribeToFriendPresence(
      currentUser.uid,
      friendIds,
      setFriendPresence
    );

    return unsubscribe;
  }, [currentUser?.uid, friendsQuery.data]);

  // Merge friends data with presence information
  const friendsWithPresence = friendsQuery.data?.map(friend => ({
    ...friend,
    isOnline: friendPresence[friend.userId]?.isOnline || false,
    currentActivity: friendPresence[friend.userId]?.currentActivity,
    lastSeen: friendPresence[friend.userId]?.lastSeen || friend.lastSeen
  })) || [];

  const onlineFriends = friendsWithPresence.filter(friend => friend.isOnline);
  const offlineFriends = friendsWithPresence.filter(friend => !friend.isOnline);

  return {
    friends: friendsWithPresence,
    onlineFriends,
    offlineFriends,
    friendPresence,
    isLoading: friendsQuery.isLoading,
    error: friendsQuery.error,
    refetch: friendsQuery.refetch,
  };
}

/**
 * Hook for managing friend requests
 */
export function useFriendRequests() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: QUERY_KEYS.friendRequests(currentUser?.uid || ''),
    queryFn: () => friendService.getFriendRequests(currentUser!.uid),
    enabled: !!currentUser?.uid,
    staleTime: 30000, // 30 seconds
  });

  const sendRequestMutation = useMutation({
    mutationFn: ({ toUserId, message }: { toUserId: string; message?: string }) =>
      friendService.sendFriendRequest(currentUser!.uid, toUserId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendRequests(currentUser!.uid) });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendService.acceptFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendRequests(currentUser!.uid) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends(currentUser!.uid) });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendService.declineFriendRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendRequests(currentUser!.uid) });
    },
  });

  return {
    requests: requestsQuery.data,
    sentRequests: requestsQuery.data?.sent || [],
    receivedRequests: requestsQuery.data?.received || [],
    isLoading: requestsQuery.isLoading,
    error: requestsQuery.error,
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    declineRequest: declineRequestMutation.mutateAsync,
    isSending: sendRequestMutation.isPending,
    isAccepting: acceptRequestMutation.isPending,
    isDeclining: declineRequestMutation.isPending,
  };
}

/**
 * Hook for searching users to add as friends
 */
export function useFriendSearch(searchQuery: string, enabled = true) {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.friendSearch(searchQuery, currentUser?.uid || ''),
    queryFn: () => friendService.searchUsers(searchQuery, currentUser!.uid),
    enabled: enabled && !!currentUser?.uid && searchQuery.length >= 2,
    staleTime: 30000,
  });
}

/**
 * Hook for managing friend activity feed
 */
export function useFriendActivity(filters: ActivityFilters = {}) {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.friendActivity(currentUser?.uid || '', filters),
    queryFn: () => friendService.getFriendActivity(currentUser!.uid, filters),
    enabled: !!currentUser?.uid,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for managing challenges
 */
export function useChallenges() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const sendChallengeMutation = useMutation({
    mutationFn: ({ 
      toUserId, 
      quizId, 
      message, 
      options 
    }: { 
      toUserId: string; 
      quizId: string; 
      message?: string; 
      options?: any 
    }) => friendService.sendChallenge(currentUser!.uid, toUserId, quizId, message, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challenges(currentUser!.uid) });
    },
  });

  return {
    sendChallenge: sendChallengeMutation.mutateAsync,
    isSending: sendChallengeMutation.isPending,
    error: sendChallengeMutation.error,
  };
}

/**
 * Hook for user presence management
 */
export function usePresence() {
  const { currentUser } = useAuth();

  const updatePresence = useCallback(async (isOnline: boolean, activity?: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await friendService.updatePresence(currentUser.uid, isOnline, activity);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [currentUser?.uid]);

  // Update presence when component mounts/unmounts
  useEffect(() => {
    updatePresence(true);

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };

    // Set up beforeunload listener
    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      updatePresence(false);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [updatePresence]);

  return {
    updatePresence,
  };
}

/**
 * Hook for friend statistics
 */
export function useFriendStats() {
  const { currentUser } = useAuth();
  const { friends } = useFriends();
  const { requests } = useFriendRequests();

  const stats: FriendStats = {
    totalFriends: friends?.length || 0,
    onlineFriends: friends?.filter(f => f.isOnline).length || 0,
    pendingRequests: requests?.received.length || 0,
    sentRequests: requests?.sent.length || 0,
    activeChallenges: 0, // TODO: Implement when challenge system is complete
    completedChallenges: 0, // TODO: Implement when challenge system is complete
    winRate: 0, // TODO: Implement when challenge system is complete
  };

  return stats;
}

/**
 * Hook for invalidating friend-related caches
 */
export function useFriendCache() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    if (!currentUser?.uid) return;
    
    queryClient.invalidateQueries({ queryKey: ['friends'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-activity'] });
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
  }, [currentUser?.uid, queryClient]);

  const invalidateFriends = useCallback(() => {
    if (!currentUser?.uid) return;
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friends(currentUser.uid) });
  }, [currentUser?.uid, queryClient]);

  const invalidateRequests = useCallback(() => {
    if (!currentUser?.uid) return;
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.friendRequests(currentUser.uid) });
  }, [currentUser?.uid, queryClient]);

  const invalidateActivity = useCallback(() => {
    if (!currentUser?.uid) return;
    queryClient.invalidateQueries({ queryKey: ['friend-activity', currentUser.uid] });
  }, [currentUser?.uid, queryClient]);

  return {
    invalidateAll,
    invalidateFriends,
    invalidateRequests,
    invalidateActivity,
  };
}