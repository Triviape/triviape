import type { QueryKey } from '@tanstack/react-query';

/**
 * Centralized React Query key factory.
 * Every query key in the app should be defined here to prevent
 * collisions and make cache invalidation predictable.
 */
export const queryKeys = {
  // ── Friends & Social ──────────────────────────────────────────
  friends: (userId: string) => ['friends', userId] as const,
  friendRequests: (userId: string) => ['friend-requests', userId] as const,
  friendActivity: (userId: string, filters: object) =>
    ['friend-activity', userId, filters] as const,
  friendSearch: (query: string, userId: string) =>
    ['friend-search', query, userId] as const,
  friendStats: (userId: string) => ['friend-stats', userId] as const,

  // ── Challenges ────────────────────────────────────────────────
  challenges: (userId: string) => ['challenges', userId] as const,

  // ── Messaging ─────────────────────────────────────────────────
  conversations: (userId: string) => ['conversations', userId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,

  // ── Leaderboards ──────────────────────────────────────────────
  leaderboard: (type: string, period: string, filters: object) =>
    ['leaderboard', type, period, filters] as const,
  leaderboardStats: (period: string) => ['leaderboard-stats', period] as const,
  leaderboardEntries: (quizId: string, dateString?: string): QueryKey =>
    dateString
      ? ['leaderboard-entries', quizId, dateString]
      : ['leaderboard-entries', quizId],

  // ── Quiz ──────────────────────────────────────────────────────
  questions: (questionIds: string[]): QueryKey =>
    ['questions', ...questionIds.sort()],
  dailyQuiz: ['daily-quiz'] as const,
  quizzes: ['quizzes'] as const,

  // ── User ──────────────────────────────────────────────────────
  userStats: (userId: string) => ['user-stats', userId] as const,
  userProfile: (userId: string) => ['user-profile', userId] as const,
  dailyQuizStatus: (userId: string) => ['daily-quiz-status', userId] as const,
} as const;
