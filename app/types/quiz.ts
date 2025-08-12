/**
 * Quiz-related type definitions
 * Centralized type definitions for quiz-related data structures
 */

/**
 * Quiz difficulty levels
 */
export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Difficulty level enum for backward compatibility
 */
export enum DifficultyLevel {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Expert = 'expert'
}

/**
 * Question types
 */
export type QuestionType = 'multiple-choice' | 'true-false' | 'open-ended';

/**
 * Question type enum for backward compatibility
 */
export enum QuestionTypeEnum {
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false',
  OpenEnded = 'open-ended'
}

/**
 * Quiz category information
 */
export interface QuizCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

/**
 * Quiz question interface
 */
export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points?: number;
  timeLimit?: number;
}

/**
 * Quiz interface
 */
export interface Quiz {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  difficulty: QuizDifficulty;
  timeLimit: number; // in seconds
  questionIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Daily quiz specific fields
  isDailyQuiz?: boolean;
  dailyQuizDate?: string | null;
  
  // Optional metadata
  createdBy?: string;
  tags?: string[];
  imageUrl?: string;
  estimatedDuration?: number; // in minutes
  maxAttempts?: number;
  
  // Statistics
  totalAttempts?: number;
  averageScore?: number;
  completionRate?: number;
}

/**
 * Quiz attempt interface
 */
export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  maxScore?: number;
  answers: QuizAnswer[];
  timeSpent: number; // in seconds
  status: 'in-progress' | 'completed' | 'abandoned';
}

/**
 * Quiz answer interface
 */
export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  points?: number;
  timeSpent: number; // in seconds
}

/**
 * Quiz result interface
 */
export interface QuizResult {
  attemptId: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  completedAt: Date;
  answers: QuizAnswer[];
  performance: {
    accuracy: number;
    speed: number;
    consistency: number;
  };
}

/**
 * Quiz statistics interface
 */
export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  difficultyDistribution: Record<QuizDifficulty, number>;
  categoryDistribution: Record<string, number>;
}

/**
 * Quiz creation/update interface
 */
export interface QuizFormData {
  title: string;
  description: string;
  categoryId: string;
  difficulty: QuizDifficulty;
  timeLimit: number;
  questionIds: string[];
  isActive: boolean;
  tags?: string[];
  imageUrl?: string;
  maxAttempts?: number;
}

/**
 * Quiz search/filter interface
 */
export interface QuizFilters {
  categoryId?: string;
  difficulty?: QuizDifficulty;
  isActive?: boolean;
  createdBy?: string;
  tags?: string[];
  timeRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

/**
 * Quiz completion status
 */
export interface QuizCompletionStatus {
  quizId: string;
  userId: string;
  isCompleted: boolean;
  lastAttemptId?: string;
  bestScore?: number;
  attemptsCount: number;
  lastAttemptedAt?: Date;
} 