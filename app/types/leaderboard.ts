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