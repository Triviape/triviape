/**
 * Services index file
 * Re-exports all service functionality
 */

// Export user service
export * from './user';

// Export quiz service - import and re-export specific items to avoid conflicts
import { 
  getQuizById, 
  getQuestionsByIds, 
  getCategories,
} from './quiz';

// Import types
import type { 
  QuizServiceErrorType,
  PaginationResult,
  QuizServiceError,
  QuizAttempt
} from './quiz';

// Re-export quiz service functions
export {
  getQuizById, 
  getQuestionsByIds, 
  getCategories,
};

// Re-export quiz service types
export type {
  QuizServiceErrorType,
  PaginationResult,
  QuizServiceError,
  QuizAttempt
}; 