/**
 * Social graph and messaging facade. Implementation lives in `./social/*` (GUIDE 4.1).
 */

import type {
  FriendRequest,
  Friendship,
  Friend,
  Challenge,
  ChallengeStatus,
  FriendActivity,
  ActivityFilters,
  PresenceStatus,
  FriendSearchResult,
  DirectMessage,
  Conversation,
} from '@/app/types/social';
import * as friendRequests from './social/friendRequestOperations';
import * as friendChallenges from './social/friendChallengeOperations';
import * as friendMessaging from './social/friendMessagingOperations';
import * as friendPresence from './social/friendPresenceOperations';
import * as friendList from './social/friendListOperations';

export class FriendService {
  private static instance: FriendService;

  public static getInstance(): FriendService {
    if (!FriendService.instance) {
      FriendService.instance = new FriendService();
    }
    return FriendService.instance;
  }

  async sendFriendRequest(fromUserId: string, toUserId: string, message?: string): Promise<FriendRequest> {
    return friendRequests.sendFriendRequest(fromUserId, toUserId, message);
  }

  async acceptFriendRequest(requestId: string): Promise<Friendship> {
    return friendRequests.acceptFriendRequest(requestId);
  }

  async declineFriendRequest(requestId: string): Promise<void> {
    return friendRequests.declineFriendRequest(requestId);
  }

  async getFriends(userId: string): Promise<Friend[]> {
    return friendList.getFriends(userId);
  }

  async searchUsers(
    searchTerm: string,
    currentUserId: string,
    maxResults = 20
  ): Promise<FriendSearchResult[]> {
    return friendList.searchUsers(searchTerm, currentUserId, maxResults);
  }

  async getFriendRequests(userId: string): Promise<{ sent: FriendRequest[]; received: FriendRequest[] }> {
    return friendRequests.getFriendRequests(userId);
  }

  async sendChallenge(
    fromUserId: string,
    toUserId: string,
    quizId: string,
    message?: string,
    options?: { timeLimit?: number; questionCount?: number; difficultyLevel?: string }
  ): Promise<Challenge> {
    return friendChallenges.sendChallenge(fromUserId, toUserId, quizId, message, options);
  }

  async getChallenges(
    userId: string,
    status?: ChallengeStatus[]
  ): Promise<{ sent: Challenge[]; received: Challenge[] }> {
    return friendChallenges.getChallenges(userId, status);
  }

  async getChallengeById(challengeId: string): Promise<Challenge | null> {
    return friendChallenges.getChallengeById(challengeId);
  }

  async respondToChallenge(
    challengeId: string,
    userId: string,
    response: 'accepted' | 'declined'
  ): Promise<Challenge> {
    return friendChallenges.respondToChallenge(challengeId, userId, response);
  }

  async updateChallengeScore(
    challengeId: string,
    userId: string,
    score: number,
    timeInSeconds: number
  ): Promise<Challenge> {
    return friendChallenges.updateChallengeScore(challengeId, userId, score, timeInSeconds);
  }

  async cancelChallenge(challengeId: string, userId: string): Promise<void> {
    return friendChallenges.cancelChallenge(challengeId, userId);
  }

  async getFriendActivity(userId: string, filters: ActivityFilters = {}): Promise<FriendActivity[]> {
    return friendList.getFriendActivity(userId, filters);
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    return friendMessaging.getOrCreateConversation(userId1, userId2);
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return friendMessaging.getConversations(userId);
  }

  async sendMessage(senderId: string, recipientId: string, content: string): Promise<DirectMessage> {
    return friendMessaging.sendMessage(senderId, recipientId, content);
  }

  async getMessages(
    conversationId: string,
    limitCount = 50,
    beforeMessageId?: string
  ): Promise<DirectMessage[]> {
    return friendMessaging.getMessages(conversationId, limitCount, beforeMessageId);
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    return friendMessaging.markMessagesAsRead(conversationId, userId);
  }

  subscribeToMessages(
    conversationId: string,
    callback: (messages: DirectMessage[]) => void
  ): () => void {
    return friendMessaging.subscribeToMessages(conversationId, callback);
  }

  async updatePresence(userId: string, isOnline: boolean, activity?: string): Promise<void> {
    return friendPresence.updatePresence(userId, isOnline, activity);
  }

  subscribeToFriendPresence(
    userId: string,
    friendIds: string[],
    callback: (presenceUpdates: Record<string, PresenceStatus>) => void
  ): () => void {
    return friendPresence.subscribeToFriendPresence(userId, friendIds, callback);
  }

  public cleanup(): void {
    friendPresence.cleanupPresenceSubscriptions();
  }
}

export const friendService = FriendService.getInstance();
