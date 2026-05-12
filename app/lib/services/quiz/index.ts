/**
 * Quiz service index file
 * Re-exports all quiz service functionality
 */

// Export types
export * from './types';

// Export error handling utilities
export * from './errorHandler';

// Export quiz fetching functionality
export * from './quizFetchService';

// Export analytics functionality
export * from './analyticsService';

// Core Firestore quiz operations
export * from './quizService';

// Daily quiz + completion (question helpers live in `./questionService` — not re-exported
// here to avoid colliding with `getQuestionsByIds` / `updateQuestionAnalytics` in quizFetch/analytics)
export * from './dailyQuizService';
export * from './quizCompletionService';