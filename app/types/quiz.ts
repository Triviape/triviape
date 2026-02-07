/**
 * Unified quiz and question model definitions.
 */

export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export enum DifficultyLevel {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Expert = 'expert',
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'open-ended' | 'short-answer' | 'matching' | 'true_false';

export enum QuestionTypeEnum {
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false',
  OpenEnded = 'open-ended',
}

export const QuestionType = {
  MultipleChoice: 'multiple-choice',
  TrueFalse: 'true-false',
  ShortAnswer: 'short-answer',
  Matching: 'matching',
} as const;

export interface QuizCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentCategoryId?: string;
}

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface QuestionAnalytics {
  timesAnswered: number;
  timesCorrect?: number;
  timesSkipped?: number;
  averageAnswerTime: number;
}

export interface Question {
  id: string;
  text: string;
  type?: QuestionType | string;
  answers: AnswerOption[];
  imageUrl?: string;
  difficulty?: QuizDifficulty | string;
  categoryId?: string;
  hint?: string;
  explanation?: string;
  points?: number;
  timeLimit?: number;
  options?: string[];
  correctAnswer?: string | string[];
  analytics?: QuestionAnalytics;
  timesAnswered?: number;
  timesAnsweredCorrectly?: number;
  averageAnswerTime?: number;
  skipRate?: number;
  tags?: string[];
  isActive?: boolean;
  createdAt?: Date | number;
  updatedAt?: Date | number;
}

export interface QuestionSummary {
  id: string;
  text: string;
  type?: QuestionType | string;
  difficulty?: QuizDifficulty | string;
  categoryId?: string;
  points?: number;
  isActive?: boolean;
}

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

export interface Quiz {
  id: string;
  title: string;
  description: string;
  categoryId?: string;
  categoryIds?: string[];
  difficulty: QuizDifficulty | string;
  timeLimit?: number;
  questionIds: string[];
  isActive?: boolean;
  createdAt?: Date | number;
  updatedAt?: Date | number;
  isDailyQuiz?: boolean;
  dailyQuizDate?: string | null;
  createdBy?: string;
  tags?: string[];
  imageUrl?: string | null;
  coverImage?: string | null;
  estimatedDuration?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  baseXP?: number;
  baseCoins?: number;
  passingScore?: number;
  totalAttempts?: number;
  averageScore?: number;
  completionRate?: number;
  timesPlayed?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  maxScore?: number;
  answers: QuizAnswer[];
  timeSpent: number;
  status: 'in-progress' | 'completed' | 'abandoned';
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  points?: number;
  timeSpent: number;
}

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

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  difficultyDistribution: Record<QuizDifficulty, number>;
  categoryDistribution: Record<string, number>;
}

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

export interface QuizCompletionStatus {
  quizId: string;
  userId: string;
  isCompleted: boolean;
  lastAttemptId?: string;
  bestScore?: number;
  attemptsCount: number;
  lastAttemptedAt?: Date;
}
