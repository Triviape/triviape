/**
 * Services index file
 * Centralized exports for all service functions
 * Updated to include unified user services
 */

// Core services
export { BaseServiceImplementation } from './core/baseService';
export * from './core/errorHandler';
export * from './core/performanceMonitor';

// Unified User Services (Phase 3 - COMPLETED)
export * from './user';

// Unified Auth Services (Phase 2 - COMPLETED)
export * from './auth';

// Legacy exports for backward compatibility
// These will be removed after all services are unified
// @deprecated - Use ConsolidatedAuthService from './auth' instead
export { authService as AuthService } from './auth/consolidatedAuthService';
export { ProfileService } from './profileService';
export { PreferencesService } from './preferencesService';
export { ProgressionService } from './progressionService';
export { UserService } from './userService';

// Daily Quiz Services (Phase 4 - NEXT)
export * from './dailyQuizService';
export * from './userDailyQuizService';
export * from './quizCompletionService';

// Question Services (Phase 4 - NEXT)
export * from './questionService';

// Leaderboard Services (Phase 5 - NEXT)
export * from './leaderboardService';

// Social Services (Phase 5 - NEXT)
export * from './friendService';
export * from './socialPerformanceMonitor';

// Multiplayer Services (Phase 6 - NEXT)
export * from './websocketService';

// Quiz Services (Phase 4 - NEXT)
export * from './quizService'; 