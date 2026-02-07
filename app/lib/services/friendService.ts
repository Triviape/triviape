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
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  and,
  or,
  documentId,
  QuerySnapshot,
  DocumentData
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
  FriendNotificationPreferences,
  DirectMessage,
  Conversation
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
      const friendships = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Friendship));

      if (friendships.length === 0) {
        return [];
      }

      // Extract friend IDs
      const friendIds = friendships.map(friendship =>
        friendship.userId1 === userId ? friendship.userId2 : friendship.userId1
      );

      // Batch get user docs (N/10 queries instead of N)
      const friendDocs = await this.batchGetUsers(friendIds);

      // Batch get online statuses (1 query instead of N)
      const onlineStatuses = await this.getUsersOnlineStatus(friendIds);

      // Batch get mutual friends counts (N/10 queries instead of 2N)
      const mutualFriendsCounts = await this.batchGetMutualFriendsCounts(userId, friendIds);

      // Assemble results
      const friends: Friend[] = friendships
        .map((friendship, index) => {
          const friendId = friendIds[index];
          const friendData = friendDocs.get(friendId);

          if (!friendData) {
            return null;
          }

          const friendDisplayName = friendship.userId1 === userId ? friendship.user2DisplayName : friendship.user1DisplayName;
          const friendAvatarUrl = friendship.userId1 === userId ? friendship.user2AvatarUrl : friendship.user1AvatarUrl;

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
            allowChallenges: friendship.allowChallenges
          } as Friend;
        })
        .filter((friend): friend is Friend => friend !== null);

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
  async searchUsers(searchTerm: string, currentUserId: string, maxResults = 20): Promise<FriendSearchResult[]> {
    try {
      // This is a simplified search - in production, you'd use full-text search
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        orderBy('displayName'),
        limit(maxResults)
      );

      const snapshot = await getDocs(usersQuery);
      const matchingUserIds: string[] = [];
      const userDataMap = new Map<string, any>();

      const currentUserFriendIds = await this.getCurrentUserFriendIdsOptimized(currentUserId);
      const currentUserFriendsSet = new Set(currentUserFriendIds);
      const pendingRequests = await this.getPendingRequestUserIds(currentUserId);

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skip current user
        if (userId === currentUserId) continue;

        // Simple text matching - replace with proper search in production
        if (userData.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userData.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
          matchingUserIds.push(userId);
          userDataMap.set(userId, userData);
        }
      }

      // Batch get mutual friends counts instead of one per user
      const mutualFriendsCounts = await this.batchGetMutualFriendsCounts(currentUserId, matchingUserIds);

      const results: FriendSearchResult[] = matchingUserIds.map(userId => {
        const userData = userDataMap.get(userId);
        return {
          userId,
          displayName: userData.displayName || 'Anonymous',
          avatarUrl: userData.photoURL,
          mutualFriends: mutualFriendsCounts[userId] || 0,
          isAlreadyFriend: currentUserFriendsSet.has(userId),
          hasPendingRequest: pendingRequests.some(req =>
            req.fromUserId === userId || req.toUserId === userId
          ),
          requestFromCurrentUser: pendingRequests.some(req =>
            req.fromUserId === currentUserId && req.toUserId === userId
          )
        };
      });

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
   * Get all challenges for a user (sent and received)
   */
  async getChallenges(userId: string, status?: ChallengeStatus[]): Promise<{
    sent: Challenge[];
    received: Challenge[];
  }> {
    try {
      const sentQueryRef = query(
        collection(db, 'challenges'),
        where('fromUserId', '==', userId),
        ...(status ? [where('status', 'in', status)] : []),
        orderBy('createdAt', 'desc')
      );

      const receivedQueryRef = query(
        collection(db, 'challenges'),
        where('toUserId', '==', userId),
        ...(status ? [where('status', 'in', status)] : []),
        orderBy('createdAt', 'desc')
      );

      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQueryRef),
        getDocs(receivedQueryRef)
      ]);

      const sent = sentSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Challenge));
      const received = receivedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Challenge));

      return { sent, received };
    } catch (error) {
      console.error('Error getting challenges:', error);
      throw error;
    }
  }

  /**
   * Get a single challenge by ID
   */
  async getChallengeById(challengeId: string): Promise<Challenge | null> {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (!challengeDoc.exists()) {
        return null;
      }
      return { ...challengeDoc.data(), id: challengeDoc.id } as Challenge;
    } catch (error) {
      console.error('Error getting challenge:', error);
      throw error;
    }
  }

  /**
   * Respond to a challenge (accept or decline)
   */
  async respondToChallenge(
    challengeId: string,
    userId: string,
    response: 'accepted' | 'declined'
  ): Promise<Challenge> {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = challengeDoc.data() as Challenge;
      
      if (challenge.toUserId !== userId) {
        throw new Error('Not authorized to respond to this challenge');
      }

      if (challenge.status !== 'pending') {
        throw new Error('Challenge is no longer pending');
      }

      const updateData: Partial<Challenge> = {
        status: response,
        ...(response === 'accepted' && { 
          acceptedAt: new Date().toISOString(),
          status: 'in_progress' as ChallengeStatus
        })
      };

      await updateDoc(challengeRef, updateData);

      // Send notification to challenger
      await this.sendNotification(challenge.fromUserId, {
        type: response === 'accepted' ? 'challenge_accepted' : 'challenge_declined',
        title: response === 'accepted' ? 'Challenge Accepted!' : 'Challenge Declined',
        message: response === 'accepted' 
          ? `${challenge.toUserDisplayName} accepted your challenge!`
          : `${challenge.toUserDisplayName} declined your challenge.`,
        data: { challengeId }
      });

      return { ...challenge, ...updateData, id: challengeId };
    } catch (error) {
      console.error('Error responding to challenge:', error);
      throw error;
    }
  }

  /**
   * Update challenge score after completion
   */
  async updateChallengeScore(
    challengeId: string,
    userId: string,
    score: number,
    timeInSeconds: number
  ): Promise<Challenge> {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = { ...challengeDoc.data(), id: challengeId } as Challenge;
      
      if (challenge.fromUserId !== userId && challenge.toUserId !== userId) {
        throw new Error('Not a participant in this challenge');
      }

      if (challenge.status !== 'in_progress' && challenge.status !== 'accepted') {
        throw new Error('Challenge is not in progress');
      }

      const isFromUser = challenge.fromUserId === userId;
      const updateData: Partial<Challenge> = isFromUser
        ? { fromUserScore: score, fromUserTime: timeInSeconds }
        : { toUserScore: score, toUserTime: timeInSeconds };

      // Check if both users have completed
      const otherScore = isFromUser ? challenge.toUserScore : challenge.fromUserScore;
      if (otherScore !== undefined) {
        // Both have completed - determine winner
        const fromScore = isFromUser ? score : challenge.fromUserScore!;
        const toScore = isFromUser ? challenge.toUserScore! : score;
        
        let winner: string | 'tie';
        if (fromScore > toScore) {
          winner = challenge.fromUserId;
        } else if (toScore > fromScore) {
          winner = challenge.toUserId;
        } else {
          // Tie-breaker: faster time wins
          const fromTime = isFromUser ? timeInSeconds : challenge.fromUserTime!;
          const toTime = isFromUser ? challenge.toUserTime! : timeInSeconds;
          winner = fromTime < toTime ? challenge.fromUserId : (toTime < fromTime ? challenge.toUserId : 'tie');
        }

        updateData.status = 'completed';
        updateData.completedAt = new Date().toISOString();
        updateData.winner = winner;

        // Notify both users
        const winnerName = winner === 'tie' ? null : 
          winner === challenge.fromUserId ? challenge.fromUserDisplayName : challenge.toUserDisplayName;
        
        await Promise.all([
          this.sendNotification(challenge.fromUserId, {
            type: 'challenge_completed',
            title: 'Challenge Complete!',
            message: winner === 'tie' 
              ? "It's a tie!"
              : winner === challenge.fromUserId 
                ? 'Congratulations, you won!' 
                : `${challenge.toUserDisplayName} won this round.`,
            data: { challengeId, winner, fromScore, toScore }
          }),
          this.sendNotification(challenge.toUserId, {
            type: 'challenge_completed',
            title: 'Challenge Complete!',
            message: winner === 'tie'
              ? "It's a tie!"
              : winner === challenge.toUserId
                ? 'Congratulations, you won!'
                : `${challenge.fromUserDisplayName} won this round.`,
            data: { challengeId, winner, fromScore, toScore }
          })
        ]);

        // Create activity feed entries
        await this.createChallengeCompletedActivity(challenge, winner, fromScore, toScore);
      }

      await updateDoc(challengeRef, updateData);
      return { ...challenge, ...updateData };
    } catch (error) {
      console.error('Error updating challenge score:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending challenge (sender only)
   */
  async cancelChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = challengeDoc.data() as Challenge;
      
      if (challenge.fromUserId !== userId) {
        throw new Error('Only the sender can cancel a challenge');
      }

      if (challenge.status !== 'pending') {
        throw new Error('Can only cancel pending challenges');
      }

      await deleteDoc(challengeRef);
    } catch (error) {
      console.error('Error canceling challenge:', error);
      throw error;
    }
  }

  /**
   * Create activity feed entry for completed challenge
   */
  private async createChallengeCompletedActivity(
    challenge: Challenge,
    winner: string | 'tie',
    fromScore: number,
    toScore: number
  ): Promise<void> {
    try {
      const activityData = {
        type: 'challenge_completed' as const,
        title: 'Challenge Completed',
        description: winner === 'tie'
          ? `${challenge.fromUserDisplayName} and ${challenge.toUserDisplayName} tied ${fromScore}-${toScore}`
          : winner === challenge.fromUserId
            ? `${challenge.fromUserDisplayName} defeated ${challenge.toUserDisplayName} ${fromScore}-${toScore}`
            : `${challenge.toUserDisplayName} defeated ${challenge.fromUserDisplayName} ${toScore}-${fromScore}`,
        data: {
          challengeId: challenge.id,
          quizTitle: challenge.quizTitle,
          fromUserScore: fromScore,
          toUserScore: toScore,
          winner
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0
      };

      // Create activity for both participants
      await Promise.all([
        addDoc(collection(db, 'friend_activities'), {
          userId: challenge.fromUserId,
          userDisplayName: challenge.fromUserDisplayName,
          userAvatarUrl: null, // Would need to fetch
          ...activityData
        }),
        addDoc(collection(db, 'friend_activities'), {
          userId: challenge.toUserId,
          userDisplayName: challenge.toUserDisplayName,
          userAvatarUrl: null,
          ...activityData
        })
      ]);
    } catch (error) {
      console.error('Error creating challenge activity:', error);
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
      const friendIds = await this.getCurrentUserFriendIdsOptimized(userId);

      if (friendIds.length === 0) {
        return [];
      }

      const activities: FriendActivity[] = [];
      const BATCH_SIZE = 10; // Firestore 'in' operator limit

      // Query in batches of 10
      for (let i = 0; i < friendIds.length; i += BATCH_SIZE) {
        const batch = friendIds.slice(i, i + BATCH_SIZE);
        const activityQuery = query(
          collection(db, 'friend_activities'),
          where('userId', 'in', batch),
          orderBy('createdAt', 'desc'),
          limit(filters.limit || 50)
        );
        const snapshot = await getDocs(activityQuery);
        activities.push(...snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FriendActivity)));
      }

      // Sort and apply overall limit
      return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, filters.limit || 50);
    } catch (error) {
      console.error('Error getting friend activity:', error);
      throw error;
    }
  }

  // ===========================================
  // MESSAGING METHODS
  // ===========================================

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    try {
      // Check for existing conversation
      const existingQuery = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', userId1)
      );
      
      const snapshot = await getDocs(existingQuery);
      const existing = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participantIds.includes(userId2);
      });

      if (existing) {
        return { ...existing.data(), id: existing.id } as Conversation;
      }

      // Get user data for display names
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.USERS, userId1)),
        getDoc(doc(db, COLLECTIONS.USERS, userId2))
      ]);

      const user1Data = user1Doc.data() || {};
      const user2Data = user2Doc.data() || {};

      // Create new conversation
      const conversation: Omit<Conversation, 'id'> = {
        participantIds: [userId1, userId2],
        participant1DisplayName: user1Data.displayName || 'Anonymous',
        participant1AvatarUrl: user1Data.photoURL,
        participant2DisplayName: user2Data.displayName || 'Anonymous',
        participant2AvatarUrl: user2Data.photoURL,
        unreadCount: { [userId1]: 0, [userId2]: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const conversationRef = await addDoc(collection(db, 'conversations'), conversation);
      return { ...conversation, id: conversationRef.id };
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(conversationsQuery);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Conversation));
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Send a direct message
   */
  async sendMessage(
    senderId: string,
    recipientId: string,
    content: string
  ): Promise<DirectMessage> {
    try {
      // Verify friendship
      const areFriends = await this.areFriends(senderId, recipientId);
      if (!areFriends) {
        throw new Error('Can only message friends');
      }

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(senderId, recipientId);

      // Get sender info
      const senderDoc = await getDoc(doc(db, COLLECTIONS.USERS, senderId));
      const senderData = senderDoc.data() || {};

      // Create message
      const message: Omit<DirectMessage, 'id'> = {
        conversationId: conversation.id,
        senderId,
        senderDisplayName: senderData.displayName || 'Anonymous',
        senderAvatarUrl: senderData.photoURL,
        recipientId,
        content,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      const messageRef = await addDoc(collection(db, 'messages'), message);

      // Update conversation
      await updateDoc(doc(db, 'conversations', conversation.id), {
        lastMessage: content.substring(0, 100), // Truncate for preview
        lastMessageAt: message.createdAt,
        lastMessageSenderId: senderId,
        [`unreadCount.${recipientId}`]: (conversation.unreadCount[recipientId] || 0) + 1,
        updatedAt: message.createdAt
      });

      // Send notification
      await this.sendNotification(recipientId, {
        type: 'message_received',
        title: 'New Message',
        message: `${senderData.displayName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: { conversationId: conversation.id, messageId: messageRef.id, senderId }
      });

      return { ...message, id: messageRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    limitCount = 50,
    beforeMessageId?: string
  ): Promise<DirectMessage[]> {
    try {
      let messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(messagesQuery);
      return snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as DirectMessage))
        .reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Get unread messages sent to this user
      const unreadQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(unreadQuery);
      const now = new Date().toISOString();

      // Update each message
      await Promise.all(
        snapshot.docs.map(doc =>
          updateDoc(doc.ref, { isRead: true, readAt: now })
        )
      );

      // Reset unread count for this user
      await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${userId}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Subscribe to new messages in a conversation (real-time)
   */
  subscribeToMessages(
    conversationId: string,
    callback: (messages: DirectMessage[]) => void
  ): () => void {
    // Use Realtime Database for real-time message updates
    const messagesRef = ref(realtimeDb, `conversations/${conversationId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const messages = Object.entries(data).map(([id, msg]) => ({
        id,
        ...(msg as Omit<DirectMessage, 'id'>)
      }));
      
      // Sort by creation time
      messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      callback(messages);
    });

    return unsubscribe;
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
   * Optimized: subscribes to individual friend paths instead of entire presence collection
   */
  subscribeToFriendPresence(
    userId: string,
    friendIds: string[],
    callback: (presenceUpdates: Record<string, PresenceStatus>) => void
  ): () => void {
    // Store presence data locally
    const presenceState: Record<string, PresenceStatus> = {};
    const unsubscribers: (() => void)[] = [];

    // For small friend lists, subscribe to individual paths
    // For larger lists, fall back to batch approach with periodic updates
    const INDIVIDUAL_SUBSCRIBE_THRESHOLD = 50;

    if (friendIds.length <= INDIVIDUAL_SUBSCRIBE_THRESHOLD) {
      // Subscribe to each friend's presence individually
      friendIds.forEach(friendId => {
        const friendPresenceRef = ref(realtimeDb, `presence/${friendId}`);
        
        const unsubscribe = onValue(friendPresenceRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            presenceState[friendId] = data as PresenceStatus;
          } else {
            // Friend has no presence data - mark as offline
            presenceState[friendId] = {
              userId: friendId,
              isOnline: false,
              lastSeen: new Date().toISOString()
            };
          }
          // Trigger callback with updated state
          callback({ ...presenceState });
        });

        unsubscribers.push(unsubscribe);
      });
    } else {
      // For large friend lists, use the original approach but with debouncing
      // to reduce callback frequency
      const presenceRef = ref(realtimeDb, 'presence');
      let debounceTimeout: NodeJS.Timeout | null = null;
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        const presenceData = snapshot.val() || {};
        
        // Only process friends we care about
        friendIds.forEach(friendId => {
          if (presenceData[friendId]) {
            presenceState[friendId] = presenceData[friendId];
          }
        });

        // Debounce callback to prevent excessive updates
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
          callback({ ...presenceState });
        }, 100);
      });

      unsubscribers.push(() => {
        unsubscribe();
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
      });
    }

    // Create combined unsubscribe function
    const cleanup = () => {
      unsubscribers.forEach(unsub => unsub());
    };

    this.presenceSubscriptions.set(userId, cleanup);
    return cleanup;
  }

  // Batch helper methods for N+1 query optimization
  private async batchGetUsers(userIds: string[]): Promise<Map<string, any>> {
    const result = new Map();
    const BATCH_SIZE = 10; // Firestore 'in' operator limit
    const uniqueUserIds = [...new Set(userIds)];
    const batches: string[][] = [];

    for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
      batches.push(uniqueUserIds.slice(i, i + BATCH_SIZE));
    }

    const summarySnapshots = await Promise.all(
      batches.map(batch => {
        const q = query(
          collection(db, COLLECTIONS.USER_PROFILE_SUMMARIES),
          where(documentId(), 'in', batch)
        );
        return getDocs(q);
      })
    );

    summarySnapshots.forEach(snapshot => {
      snapshot.docs.forEach(summaryDoc => {
        const summaryData = summaryDoc.data();
        result.set(summaryDoc.id, {
          level: summaryData.level || 1,
          lastLoginAt: summaryData.lastLoginAt,
          quizzesTaken: summaryData.quizzesTaken || 0,
          averageScore: summaryData.averageScore || 0,
          favoriteCategory: summaryData.favoriteCategory,
          achievementsCount: summaryData.achievementsCount || 0,
          privacySettings: {
            shareActivityWithFriends: summaryData.shareActivityWithFriends
          }
        });
      });
    });

    const missingUserIds = uniqueUserIds.filter(userId => !result.has(userId));
    if (missingUserIds.length === 0) {
      return result;
    }

    const missingBatches: string[][] = [];
    for (let i = 0; i < missingUserIds.length; i += BATCH_SIZE) {
      missingBatches.push(missingUserIds.slice(i, i + BATCH_SIZE));
    }

    const userSnapshots = await Promise.all(
      missingBatches.map(batch => {
        const q = query(
          collection(db, COLLECTIONS.USERS),
          where(documentId(), 'in', batch)
        );
        return getDocs(q);
      })
    );

    const summaryBackfillWrites: Promise<void>[] = [];
    userSnapshots.forEach(snapshot => {
      snapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        result.set(userDoc.id, userData);

        summaryBackfillWrites.push(
          setDoc(
            doc(db, COLLECTIONS.USER_PROFILE_SUMMARIES, userDoc.id),
            {
              level: userData.level || 1,
              lastLoginAt: userData.lastLoginAt || null,
              quizzesTaken: userData.quizzesTaken || 0,
              averageScore: userData.averageScore || 0,
              favoriteCategory: userData.favoriteCategory || null,
              achievementsCount: userData.achievements?.length || 0,
              shareActivityWithFriends: userData.privacySettings?.shareActivityWithFriends !== false,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          )
        );
      });
    });

    await Promise.allSettled(summaryBackfillWrites);
    return result;
  }

  private async getUsersOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
    try {
      const presenceRef = ref(realtimeDb, 'presence');
      const snapshot = await get(presenceRef);
      const presenceData = snapshot.val() || {};

      const now = Date.now();
      const result: Record<string, boolean> = {};

      userIds.forEach(userId => {
        const presence = presenceData[userId];
        if (presence) {
          const lastSeen = new Date(presence.lastSeen).getTime();
          result[userId] = presence.isOnline && (now - lastSeen) < 5 * 60 * 1000;
        } else {
          result[userId] = false;
        }
      });

      return result;
    } catch (error) {
      console.error('Error getting users online status:', error);
      return {};
    }
  }

  private async batchGetMutualFriendsCounts(userId: string, friendIds: string[]): Promise<Record<string, number>> {
    if (friendIds.length === 0) {
      return {};
    }

    const uniqueFriendIds = [...new Set(friendIds)];

    // Get current user's friends (1 query)
    const userFriends = await this.getCurrentUserFriendIdsOptimized(userId);
    const userFriendsSet = new Set(userFriends);

    // Batch fetch all friendships for the given friendIds
    // Instead of N queries, we use ceil(N/10) * 2 queries
    const BATCH_SIZE = 10;
    const allFriendshipsMap = new Map<string, Set<string>>();

    // Initialize sets for each friend
    uniqueFriendIds.forEach(id => allFriendshipsMap.set(id, new Set()));

    const batchRequests: Array<Promise<[QuerySnapshot<DocumentData>, QuerySnapshot<DocumentData>]>> = [];

    // Query friendships where any of the friendIds appears as userId1 or userId2
    for (let i = 0; i < uniqueFriendIds.length; i += BATCH_SIZE) {
      const batch = uniqueFriendIds.slice(i, i + BATCH_SIZE);

      const query1 = query(
        collection(db, 'friendships'),
        where('userId1', 'in', batch)
      );

      const query2 = query(
        collection(db, 'friendships'),
        where('userId2', 'in', batch)
      );

      batchRequests.push(Promise.all([getDocs(query1), getDocs(query2)]));
    }

    const batchSnapshots = await Promise.all(batchRequests);

    batchSnapshots.forEach(([snapshot1, snapshot2]) => {
      // Process results from query1 (friendId is userId1)
      snapshot1.docs.forEach(doc => {
        const data = doc.data();
        const friendId = data.userId1;
        const otherId = data.userId2;
        if (allFriendshipsMap.has(friendId)) {
          allFriendshipsMap.get(friendId)!.add(otherId);
        }
      });

      // Process results from query2 (friendId is userId2)
      snapshot2.docs.forEach(doc => {
        const data = doc.data();
        const friendId = data.userId2;
        const otherId = data.userId1;
        if (allFriendshipsMap.has(friendId)) {
          allFriendshipsMap.get(friendId)!.add(otherId);
        }
      });
    });

    // Calculate mutual friends
    const result: Record<string, number> = {};
    uniqueFriendIds.forEach(friendId => {
      const friendFriends = allFriendshipsMap.get(friendId) || new Set();
      let mutualCount = 0;
      friendFriends.forEach(id => {
        if (userFriendsSet.has(id)) {
          mutualCount++;
        }
      });
      result[friendId] = mutualCount;
    });

    // Preserve original shape in case duplicates were requested
    friendIds.forEach(friendId => {
      if (result[friendId] === undefined) {
        result[friendId] = 0;
      }
    });

    return result;
  }

  private async getCurrentUserFriendIdsOptimized(userId: string): Promise<string[]> {
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      or(where('userId1', '==', userId), where('userId2', '==', userId))
    );
    const snapshot = await getDocs(friendshipsQuery);
    return snapshot.docs.map(doc => {
      const friendship = doc.data();
      return friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;
    });
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
    // Use optimized version to avoid cascading queries
    return this.getCurrentUserFriendIdsOptimized(userId);
  }

  private async getPendingRequestUserIds(userId: string): Promise<Array<{fromUserId: string, toUserId: string}>> {
    const requestsQuery = query(
      collection(db, 'friend_requests'),
      and(
        or(
          where('fromUserId', '==', userId),
          where('toUserId', '==', userId)
        ),
        where('status', '==', 'pending')
      ),
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
