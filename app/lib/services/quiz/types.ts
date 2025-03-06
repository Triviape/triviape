/**
 * Quiz service types
 */

import { 
  Quiz, 
  Question, 
  QuestionSummary, 
  QuizCategory,
  QuestionType,
  DifficultyLevel
} from '@/app/types/quiz';

// Collection names for Firestore
export const COLLECTIONS = {
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  CATEGORIES: 'categories',
  QUIZ_ATTEMPTS: 'quiz_attempts'
};

// Quiz service error types
export enum QuizServiceErrorType {
  FETCH_ERROR = 'fetch_error',
  CREATE_ERROR = 'create_error',
  UPDATE_ERROR = 'update_error',
  DELETE_ERROR = 'delete_error',
  VALIDATION_ERROR = 'validation_error',
  GENERAL_ERROR = 'general_error'
}

export interface QuizServiceError extends Error {
  type: QuizServiceErrorType;
  code?: string;
  originalError?: Error;
}

// Pagination result interface
export interface PaginationResult<T> {
  items: T[];
  lastDoc: any;
  hasMore: boolean;
}

// Quiz attempt interface
export interface QuizAttempt {
  userId: string;
  quizId: string;
  startedAt: Date;
  completedAt?: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answers: {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
} 