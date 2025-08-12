/**
 * Social features types for friend system, challenges, and community features
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'expired';
export type ActivityType = 'quiz_completed' | 'achievement_unlocked' | 'challenge_sent' | 'challenge_completed' | 'level_up';

/**
 * Friend request interface
 */
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserDisplayName: string;
  fromUserAvatarUrl?: string;
  toUserDisplayName: string;
  toUserAvatarUrl?: string;
  status: FriendshipStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // Auto-decline after certain period
}

/**
 * Friendship interface
 */
export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  user1DisplayName: string;
  user1AvatarUrl?: string;
  user2DisplayName: string;
  user2AvatarUrl?: string;
  createdAt: string;
  lastInteraction?: string;
  isBlocked: boolean;
  blockedBy?: string;
  // Friend-specific settings
  allowChallenges: boolean;
  shareActivity: boolean;
  notifyOnline: boolean;
}

/**
 * Friend profile interface (user as seen by friends)
 */
export interface Friend {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  isOnline: boolean;
  lastSeen?: string;
  mutualFriends: number;
  friendsSince: string;
  // Stats visible to friends
  totalQuizzes?: number;
  averageScore?: number;
  favoriteCategory?: string;
  achievements?: number;
  // Privacy-controlled fields
  showStats: boolean;
  showActivity: boolean;
  allowChallenges: boolean;
}

/**
 * Challenge interface for friend competitions
 */
export interface Challenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserDisplayName: string;
  toUserDisplayName: string;
  quizId: string;
  quizTitle: string;
  categoryId?: string;
  status: ChallengeStatus;
  message?: string;
  // Challenge settings
  timeLimit?: number; // seconds
  questionCount?: number;
  difficultyLevel?: string;
  // Results
  fromUserScore?: number;
  toUserScore?: number;
  fromUserTime?: number;
  toUserTime?: number;
  winner?: string; // userId of winner, or 'tie'
  // Timestamps
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  expiresAt: string;
}

/**
 * Friend activity feed item
 */
export interface FriendActivity {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  type: ActivityType;
  title: string;
  description: string;
  data?: Record<string, any>; // Type-specific data
  createdAt: string;
  // Interaction data
  likes: number;
  comments: number;
  isLiked?: boolean; // Whether current user liked this activity
}

/**
 * Social sharing interface
 */
export interface SocialShare {
  id: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  type: 'achievement' | 'score' | 'challenge_win' | 'streak' | 'level_up';
  title: string;
  description: string;
  imageUrl?: string;
  data: Record<string, any>;
  platforms: SocialPlatform[];
  createdAt: string;
  shareCount: number;
  viewCount: number;
}

export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'copy_link';

/**
 * Friend search result
 */
export interface FriendSearchResult {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  mutualFriends: number;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
  requestFromCurrentUser: boolean;
}

/**
 * Friend statistics
 */
export interface FriendStats {
  totalFriends: number;
  onlineFriends: number;
  pendingRequests: number;
  sentRequests: number;
  activeChallenges: number;
  completedChallenges: number;
  winRate: number; // percentage of challenges won
}

/**
 * Friend activity filter options
 */
export interface ActivityFilters {
  types?: ActivityType[];
  dateFrom?: string;
  dateTo?: string;
  friendsOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Friend leaderboard entry
 */
export interface FriendLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  isBestFriend?: boolean;
  lastActive: string;
}

/**
 * Real-time presence status
 */
export interface PresenceStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
  currentActivity?: 'browsing' | 'taking_quiz' | 'in_challenge' | 'idle';
  location?: string; // e.g., 'daily-quiz', 'leaderboard', 'profile'
}

/**
 * Friend notification preferences
 */
export interface FriendNotificationPreferences {
  friendRequests: boolean;
  challengeReceived: boolean;
  challengeAccepted: boolean;
  challengeCompleted: boolean;
  friendActivity: boolean;
  friendOnline: boolean;
  achievementShared: boolean;
}