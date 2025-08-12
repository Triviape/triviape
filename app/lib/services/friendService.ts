import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  and,
  or
} from 'firebase/firestore';
import { ref, set, onValue, off, push, get } from 'firebase/database';
import { db, realtimeDb } from '@/app/lib/firebase';
import { 
  FriendRequest, 
  Friendship, 
  Friend, 
  Challenge, 
  FriendActivity, 
  FriendshipStatus,
  ChallengeStatus,
  FriendSearchResult,
  FriendStats,
  ActivityFilters,
  PresenceStatus,
  FriendNotificationPreferences
} from '@/app/types/social';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { measureFriendAction, socialPerformanceMonitor } from './socialPerformanceMonitor';

/**
 * Friend service for managing social connections and interactions
 */
export class FriendService {
  private static instance: FriendService;
  private presenceSubscriptions = new Map<string, () => void>();

  public static getInstance(): FriendService {
    if (!FriendService.instance) {
      FriendService.instance = new FriendService();
    }
    return FriendService.instance;
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(
    fromUserId: string, 
    toUserId: string, 
    message?: string
  ): Promise<FriendRequest> {
    return measureFriendAction(async () => {
      try {
      // Check if users are already friends or have pending request
      const existingRequest = await this.getExistingRequest(fromUserId, toUserId);
      if (existingRequest) {
        throw new Error('Friend request already exists or users are already friends');
      }

      // Get user data
      const [fromUser, toUser] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.USERS, fromUserId)),
        getDoc(doc(db, COLLECTIONS.USERS, toUserId))
      ]);

      if (!fromUser.exists() || !toUser.exists()) {
        throw new Error('One or both users not found');
      }

      const fromUserData = fromUser.data();
      const toUserData = toUser.data();

      const friendRequest: Omit<FriendRequest, 'id'> = {
        fromUserId,
        toUserId,
        fromUserDisplayName: fromUserData.displayName || 'Anonymous',
        fromUserAvatarUrl: fromUserData.photoURL,
        toUserDisplayName: toUserData.displayName || 'Anonymous',
        toUserAvatarUrl: toUserData.photoURL,
        status: 'pending',
        message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      const requestRef = await addDoc(collection(db, 'friend_requests'), friendRequest);
      
      // Send notification to recipient
      await this.sendNotification(toUserId, {
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${fromUserData.displayName} wants to be your friend`,
        data: { requestId: requestRef.id, fromUserId }
      });

        return { ...friendRequest, id: requestRef.id };
      } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }
    }, { action: 'send_friend_request', fromUserId, toUserId });
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string): Promise<Friendship> {
    return measureFriendAction(async () => {
      try {
      const requestDoc = await getDoc(doc(db, 'friend_requests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }

      const request = requestDoc.data() as FriendRequest;
      if (request.status !== 'pending') {
        throw new Error('Friend request is not pending');
      }

      // Update request status
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      });

      // Create friendship
      const friendship: Omit<Friendship, 'id'> = {
        userId1: request.fromUserId,
        userId2: request.toUserId,
        user1DisplayName: request.fromUserDisplayName,
        user1AvatarUrl: request.fromUserAvatarUrl,
        user2DisplayName: request.toUserDisplayName,
        user2AvatarUrl: request.toUserAvatarUrl,
        createdAt: new Date().toISOString(),
        isBlocked: false,
        allowChallenges: true,
        shareActivity: true,
        notifyOnline: true
      };

      const friendshipRef = await addDoc(collection(db, 'friendships'), friendship);

      // Update users' friend lists
      await Promise.all([
        updateDoc(doc(db, COLLECTIONS.USERS, request.fromUserId), {
          friendIds: arrayUnion(request.toUserId)
        }),
        updateDoc(doc(db, COLLECTIONS.USERS, request.toUserId), {
          friendIds: arrayUnion(request.fromUserId)
        })
      ]);

      // Send notification to request sender
      await this.sendNotification(request.fromUserId, {
        type: 'friend_request_accepted',
        title: 'Friend Request Accepted',
        message: `${request.toUserDisplayName} accepted your friend request`,
        data: { friendshipId: friendshipRef.id, friendId: request.toUserId }
      });

        return { ...friendship, id: friendshipRef.id };
      } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
      }
    }, { action: 'accept_friend_request', requestId });
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: 'declined',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error declining friend request:', error);
      throw error;
    }
  }

  /**
   * Get user's friends
   */
  async getFriends(userId: string): Promise<Friend[]> {
    try {
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        or(
          where('userId1', '==', userId),
          where('userId2', '==', userId)
        )
      );

      const snapshot = await getDocs(friendshipsQuery);
      const friends: Friend[] = [];

      for (const friendshipDoc of snapshot.docs) {
        const friendship = friendshipDoc.data() as Friendship;
        const friendId = friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;
        const friendDisplayName = friendship.userId1 === userId ? friendship.user2DisplayName : friendship.user1DisplayName;
        const friendAvatarUrl = friendship.userId1 === userId ? friendship.user2AvatarUrl : friendship.user1AvatarUrl;

        // Get friend's profile data
        const friendDoc = await getDoc(doc(db, COLLECTIONS.USERS, friendId));
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          
          const friend: Friend = {
            userId: friendId,
            displayName: friendDisplayName,
            avatarUrl: friendAvatarUrl,
            level: friendData.level || 1,
            isOnline: await this.isUserOnline(friendId),
            lastSeen: friendData.lastLoginAt || friendship.createdAt,
            mutualFriends: await this.getMutualFriendsCount(userId, friendId),
            friendsSince: friendship.createdAt,
            totalQuizzes: friendData.quizzesTaken || 0,
            averageScore: friendData.averageScore || 0,
            favoriteCategory: friendData.favoriteCategory,
            achievements: friendData.achievements?.length || 0,
            showStats: friendData.privacySettings?.shareActivityWithFriends !== false,
            showActivity: friendData.privacySettings?.shareActivityWithFriends !== false,
            allowChallenges: friendship.allowChallenges
          };

          friends.push(friend);
        }
      }

      return friends.sort((a, b) => {
        // Sort by online status first, then by recent activity
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime();
      });
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  /**
   * Search for users to add as friends
   */
  async searchUsers(query: string, currentUserId: string, limit = 20): Promise<FriendSearchResult[]> {
    try {
      // This is a simplified search - in production, you'd use full-text search
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        orderBy('displayName'),
        limit(limit)
      );

      const snapshot = await getDocs(usersQuery);
      const results: FriendSearchResult[] = [];

      const currentUserFriends = await this.getCurrentUserFriendIds(currentUserId);
      const pendingRequests = await this.getPendingRequestUserIds(currentUserId);

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skip current user
        if (userId === currentUserId) continue;

        // Simple text matching - replace with proper search in production
        if (userData.displayName?.toLowerCase().includes(query.toLowerCase()) ||
            userData.email?.toLowerCase().includes(query.toLowerCase())) {
          
          const result: FriendSearchResult = {
            userId,
            displayName: userData.displayName || 'Anonymous',
            avatarUrl: userData.photoURL,
            mutualFriends: await this.getMutualFriendsCount(currentUserId, userId),
            isAlreadyFriend: currentUserFriends.includes(userId),
            hasPendingRequest: pendingRequests.some(req => 
              req.fromUserId === userId || req.toUserId === userId
            ),
            requestFromCurrentUser: pendingRequests.some(req => 
              req.fromUserId === currentUserId && req.toUserId === userId
            )
          };

          results.push(result);
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get friend requests for a user
   */
  async getFriendRequests(userId: string): Promise<{ sent: FriendRequest[], received: FriendRequest[] }> {
    try {
      const [sentQuery, receivedQuery] = [
        query(
          collection(db, 'friend_requests'),
          where('fromUserId', '==', userId),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        ),
        query(
          collection(db, 'friend_requests'),
          where('toUserId', '==', userId),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        )
      ];

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const sent = sentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FriendRequest));
      const received = receivedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FriendRequest));

      return { sent, received };
    } catch (error) {
      console.error('Error getting friend requests:', error);
      throw error;
    }
  }

  /**
   * Send a challenge to a friend
   */
  async sendChallenge(
    fromUserId: string,
    toUserId: string,
    quizId: string,
    message?: string,
    options?: {
      timeLimit?: number;
      questionCount?: number;
      difficultyLevel?: string;
    }
  ): Promise<Challenge> {
    try {
      // Verify friendship
      const areFriends = await this.areFriends(fromUserId, toUserId);
      if (!areFriends) {
        throw new Error('Users are not friends');
      }

      // Get quiz data
      const quizDoc = await getDoc(doc(db, COLLECTIONS.QUIZZES, quizId));
      if (!quizDoc.exists()) {
        throw new Error('Quiz not found');
      }

      const quizData = quizDoc.data();
      const [fromUser, toUser] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.USERS, fromUserId)),
        getDoc(doc(db, COLLECTIONS.USERS, toUserId))
      ]);

      const challenge: Omit<Challenge, 'id'> = {
        fromUserId,
        toUserId,
        fromUserDisplayName: fromUser.data()?.displayName || 'Anonymous',
        toUserDisplayName: toUser.data()?.displayName || 'Anonymous',
        quizId,
        quizTitle: quizData.title,
        categoryId: quizData.categoryId,
        status: 'pending',
        message,
        timeLimit: options?.timeLimit,
        questionCount: options?.questionCount,
        difficultyLevel: options?.difficultyLevel,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const challengeRef = await addDoc(collection(db, 'challenges'), challenge);

      // Send notification
      await this.sendNotification(toUserId, {
        type: 'challenge_received',
        title: 'Challenge Received',
        message: `${challenge.fromUserDisplayName} challenged you to "${challenge.quizTitle}"`,
        data: { challengeId: challengeRef.id, fromUserId }
      });

      return { ...challenge, id: challengeRef.id };
    } catch (error) {
      console.error('Error sending challenge:', error);
      throw error;
    }
  }

  /**
   * Get friend activity feed
   */
  async getFriendActivity(
    userId: string, 
    filters: ActivityFilters = {}
  ): Promise<FriendActivity[]> {
    try {
      const friends = await this.getCurrentUserFriendIds(userId);
      
      if (friends.length === 0) {
        return [];
      }

      let activityQuery = query(
        collection(db, 'friend_activities'),
        where('userId', 'in', friends),
        orderBy('createdAt', 'desc'),
        limit(filters.limit || 50)
      );

      const snapshot = await getDocs(activityQuery);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FriendActivity));
    } catch (error) {
      console.error('Error getting friend activity:', error);
      throw error;
    }
  }

  /**
   * Update user presence
   */
  async updatePresence(userId: string, isOnline: boolean, activity?: string): Promise<void> {
    try {
      const presenceRef = ref(realtimeDb, `presence/${userId}`);
      const presenceData: PresenceStatus = {
        userId,
        isOnline,
        lastSeen: new Date().toISOString(),
        currentActivity: activity as any
      };

      await set(presenceRef, presenceData);
    } catch (error) {
      console.error('Error updating presence:', error);
      throw error;
    }
  }

  /**
   * Subscribe to friend presence updates
   */
  subscribeToFriendPresence(
    userId: string,
    friendIds: string[],
    callback: (presenceUpdates: Record<string, PresenceStatus>) => void
  ): () => void {
    const presenceRef = ref(realtimeDb, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};
      const friendPresence: Record<string, PresenceStatus> = {};
      
      friendIds.forEach(friendId => {
        if (presenceData[friendId]) {
          friendPresence[friendId] = presenceData[friendId];
        }
      });
      
      callback(friendPresence);
    });

    this.presenceSubscriptions.set(userId, unsubscribe);
    return unsubscribe;
  }

  // Private helper methods
  private async getExistingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const requests = await Promise.all([
      getDocs(query(
        collection(db, 'friend_requests'),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', 'in', ['pending', 'accepted'])
      )),
      getDocs(query(
        collection(db, 'friend_requests'),
        where('fromUserId', '==', toUserId),
        where('toUserId', '==', fromUserId),
        where('status', 'in', ['pending', 'accepted'])
      ))
    ]);

    return requests.some(snapshot => !snapshot.empty);
  }

  private async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendshipQuery = query(
      collection(db, 'friendships'),
      or(
        and(where('userId1', '==', userId1), where('userId2', '==', userId2)),
        and(where('userId1', '==', userId2), where('userId2', '==', userId1))
      )
    );

    const snapshot = await getDocs(friendshipQuery);
    return !snapshot.empty;
  }

  private async getCurrentUserFriendIds(userId: string): Promise<string[]> {
    const friends = await this.getFriends(userId);
    return friends.map(friend => friend.userId);
  }

  private async getPendingRequestUserIds(userId: string): Promise<Array<{fromUserId: string, toUserId: string}>> {
    const requestsQuery = query(
      collection(db, 'friend_requests'),
      or(
        where('fromUserId', '==', userId),
        where('toUserId', '==', userId)
      ),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { fromUserId: data.fromUserId, toUserId: data.toUserId };
    });
  }

  private async getMutualFriendsCount(userId1: string, userId2: string): Promise<number> {
    // Simplified implementation - would be optimized in production
    const [user1Friends, user2Friends] = await Promise.all([
      this.getCurrentUserFriendIds(userId1),
      this.getCurrentUserFriendIds(userId2)
    ]);

    return user1Friends.filter(friendId => user2Friends.includes(friendId)).length;
  }

  private async isUserOnline(userId: string): Promise<boolean> {
    try {
      const presenceRef = ref(realtimeDb, `presence/${userId}`);
      const snapshot = await get(presenceRef);
      const presence = snapshot.val() as PresenceStatus;
      
      if (!presence) return false;
      
      // Consider user online if last seen within 5 minutes
      const lastSeen = new Date(presence.lastSeen).getTime();
      const now = Date.now();
      return presence.isOnline && (now - lastSeen) < 5 * 60 * 1000;
    } catch (error) {
      console.error('Error checking user online status:', error);
      return false;
    }
  }

  private async sendNotification(userId: string, notification: any): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Clean up subscriptions
   */
  public cleanup(): void {
    this.presenceSubscriptions.forEach(unsubscribe => unsubscribe());
    this.presenceSubscriptions.clear();
  }
}

// Export singleton instance
export const friendService = FriendService.getInstance();