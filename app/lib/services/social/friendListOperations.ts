import { collection, query, where, orderBy, limit, getDocs, or } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import type { Friend, FriendSearchResult, FriendActivity, ActivityFilters, Friendship } from '@/app/types/social';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import {
  batchGetUsers,
  getUsersOnlineStatus,
  batchGetMutualFriendsCounts,
  getCurrentUserFriendIdsOptimized,
  getPendingRequestUserIds,
} from './friendInternals';

export async function getFriends(userId: string): Promise<Friend[]> {
  try {
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      or(where('userId1', '==', userId), where('userId2', '==', userId))
    );

    const snapshot = await getDocs(friendshipsQuery);
    const friendships = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Friendship));

    if (friendships.length === 0) {
      return [];
    }

    const friendIds = friendships.map((friendship) =>
      friendship.userId1 === userId ? friendship.userId2 : friendship.userId1
    );

    const friendDocs = await batchGetUsers(friendIds);
    const onlineStatuses = await getUsersOnlineStatus(friendIds);
    const mutualFriendsCounts = await batchGetMutualFriendsCounts(userId, friendIds);

    const friends: Friend[] = friendships
      .map((friendship, index) => {
        const friendId = friendIds[index];
        const friendData = friendDocs.get(friendId);

        if (!friendData) {
          return null;
        }

        const friendDisplayName =
          friendship.userId1 === userId ? friendship.user2DisplayName : friendship.user1DisplayName;
        const friendAvatarUrl =
          friendship.userId1 === userId ? friendship.user2AvatarUrl : friendship.user1AvatarUrl;

        return {
          userId: friendId,
          displayName: friendDisplayName,
          avatarUrl: friendAvatarUrl,
          level: friendData.level || 1,
          isOnline: onlineStatuses[friendId] || false,
          lastSeen: friendData.lastLoginAt || friendship.createdAt,
          mutualFriends: mutualFriendsCounts[friendId] || 0,
          friendsSince: friendship.createdAt,
          totalQuizzes: friendData.quizzesTaken || 0,
          averageScore: friendData.averageScore || 0,
          favoriteCategory: friendData.favoriteCategory,
          achievements: friendData.achievementsCount || friendData.achievements?.length || 0,
          showStats: friendData.privacySettings?.shareActivityWithFriends !== false,
          showActivity: friendData.privacySettings?.shareActivityWithFriends !== false,
          allowChallenges: friendship.allowChallenges,
        } as Friend;
      })
      .filter((friend): friend is Friend => friend !== null);

    return friends.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime();
    });
  } catch (error) {
    console.error('Error getting friends:', error);
    throw error;
  }
}

export async function searchUsers(
  searchTerm: string,
  currentUserId: string,
  maxResults = 20
): Promise<FriendSearchResult[]> {
  try {
    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      orderBy('displayName'),
      limit(maxResults)
    );

    const snapshot = await getDocs(usersQuery);
    const matchingUserIds: string[] = [];
    const userDataMap = new Map<string, Record<string, unknown>>();

    const currentUserFriendIds = await getCurrentUserFriendIdsOptimized(currentUserId);
    const currentUserFriendsSet = new Set(currentUserFriendIds);
    const pendingRequests = await getPendingRequestUserIds(currentUserId);

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;

      if (uid === currentUserId) continue;

      if (
        String(userData.displayName || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(userData.email || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        matchingUserIds.push(uid);
        userDataMap.set(uid, userData as Record<string, unknown>);
      }
    }

    const mutualFriendsCounts = await batchGetMutualFriendsCounts(currentUserId, matchingUserIds);

    return matchingUserIds.map((uid) => {
      const userData = userDataMap.get(uid)!;
      return {
        userId: uid,
        displayName: (userData.displayName as string) || 'Anonymous',
        avatarUrl: userData.photoURL as string | undefined,
        mutualFriends: mutualFriendsCounts[uid] || 0,
        isAlreadyFriend: currentUserFriendsSet.has(uid),
        hasPendingRequest: pendingRequests.some(
          (req) => req.fromUserId === uid || req.toUserId === uid
        ),
        requestFromCurrentUser: pendingRequests.some(
          (req) => req.fromUserId === currentUserId && req.toUserId === uid
        ),
      };
    });
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

export async function getFriendActivity(
  userId: string,
  filters: ActivityFilters = {}
): Promise<FriendActivity[]> {
  try {
    const friendIds = await getCurrentUserFriendIdsOptimized(userId);

    if (friendIds.length === 0) {
      return [];
    }

    const activities: FriendActivity[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < friendIds.length; i += BATCH_SIZE) {
      const batch = friendIds.slice(i, i + BATCH_SIZE);
      const activityQuery = query(
        collection(db, 'friend_activities'),
        where('userId', 'in', batch),
        orderBy('createdAt', 'desc'),
        limit(filters.limit || 50)
      );
      const activitySnapshot = await getDocs(activityQuery);
      activities.push(...activitySnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as FriendActivity)));
    }

    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, filters.limit || 50);
  } catch (error) {
    console.error('Error getting friend activity:', error);
    throw error;
  }
}
