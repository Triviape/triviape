export interface DailyQuizLeaderboardEntry {
  id?: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  completionTime: number;
  rank?: number;
  dateCompleted: string;
  quizId: string;
}

export interface UserRanking {
  userId: string;
  quizId: string;
  rank: number | null;
  score: number | null;
  totalEntries: number;
  isInTopTen: boolean;
}

export interface LeaderboardEntryParams {
  quizId: string;
  score: number;
  completionTime: number;
  dateCompleted?: string;
}

// Enhanced leaderboard types for real-time and multi-category support
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';
export type LeaderboardType = 'global' | 'category' | 'friends';

export interface EnhancedLeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  completionTime: number;
  rank: number;
  period: LeaderboardPeriod;
  categoryId?: string;
  quizId?: string;
  dateCompleted: string;
  createdAt: string;
  updatedAt: string;
  // Social features
  isFriend?: boolean;
  isCurrentUser?: boolean;
}

export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  categoryId?: string;
  friendsOnly?: boolean;
  userId?: string;
  /**
   * Friend user IDs for `isFriend` on global/category boards and for scoping the Friends tab.
   * The Friends view ranks you and these IDs within a bounded global leaderboard window
   * (`FRIENDS_LEADERBOARD_GLOBAL_SLICE_ROW_LIMIT` in `app/lib/constants/leaderboard.ts`).
   */
  friendUserIds?: string[];
}

export interface PaginatedLeaderboard {
  entries: EnhancedLeaderboardEntry[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  currentUserRank?: number;
}

export interface LeaderboardSubscription {
  unsubscribe: () => void;
  isConnected: boolean;
}

export interface LeaderboardUpdate {
  type: 'entry_added' | 'entry_updated' | 'entry_removed' | 'rank_changed';
  entry: EnhancedLeaderboardEntry;
  previousRank?: number;
}

export interface GlobalLeaderboardStats {
  totalPlayers: number;
  averageScore: number;
  topScore: number;
  lastUpdated: string;
} 