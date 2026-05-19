/**
 * Services index file
 * Centralized exports for all service functions
 * Updated to include unified user services
 */

// Core services
export { BaseServiceImplementation } from './core/baseService';
export * from './core/errorHandler';
export {
  PerformanceMonitor,
  performanceMonitor,
  measureLeaderboardLoad,
  measureFriendAction,
  measureMultiplayerAction,
  measureSocialAction,
  measureAuthOperation,
  measureQuizOperation,
  measureUserOperation,
  recordRealtimeLatency,
} from './core/performanceMonitor';

// Unified User Services (Phase 3 - COMPLETED)
export * from './user';

// Unified Auth Services (Phase 2 - COMPLETED)
export * from './auth';

// Daily Quiz Services (Phase 4 - NEXT)
export * from './dailyQuizService';
export {
  getYesterdayDateString,
  isConsecutiveDay,
  getUserDailyQuizData,
  getUserStreak,
  updateUserDailyQuizData,
  updateUserStreak,
  recordDailyQuizCompletion as recordUserDailyQuizCompletion,
  getDailyQuizStatus,
} from './userDailyQuizService';
export * from './quizCompletionService';

// Question Services (Phase 4 - NEXT)
export * from './questionService';

// Leaderboard Services
export * from './leaderboard';

// Social Services (Phase 5 - NEXT)
export * from './friendService';
export {
  SocialPerformanceMonitor,
  socialPerformanceMonitor,
  measureLeaderboardLoad as measureSocialLeaderboardLoad,
  measureFriendAction as measureSocialFriendAction,
  measureMultiplayerAction as measureSocialMultiplayerAction,
  measureSocialAction as measureSocialDomainAction,
  recordRealtimeLatency as recordSocialRealtimeLatency,
} from './socialPerformanceMonitor';

// Multiplayer Services (Phase 6 - NEXT)
export * from './websocketService';

// Quiz Services (Phase 4 - NEXT)
export * from './quizService'; 
