/**
 * Firestore Database Schema
 * 
 * This file defines the schema for the Firestore database used in the application.
 * It includes TypeScript interfaces for all collections and document types.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User document schema
 * Collection: 'users'
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isAnonymous: boolean;
  emailVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
  preferences: {
    darkMode: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

/**
 * User stats document schema
 * Collection: 'user_stats'
 */
export interface UserStats {
  userId: string;
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  totalPoints: number;
  quizzesCreated: number;
  lastActive: Timestamp;
  streak: {
    current: number;
    longest: number;
    lastQuizDate: Timestamp;
  };
  categories: {
    [categoryId: string]: {
      totalQuestions: number;
      correctAnswers: number;
      score: number;
    };
  };
}

/**
 * Quiz document schema
 * Collection: 'Quizzes'
 */
export interface Quiz {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  createdBy: string; // User ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  published: boolean;
  publishedAt?: Timestamp;
  categoryId: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // In seconds
  questionCount: number;
  questionIds: string[]; // Array of Question IDs
  settings: {
    randomizeQuestions: boolean;
    showFeedbackAfterEachQuestion: boolean;
    passingScore: number; // Percentage
    allowRetry: boolean;
    showCorrectAnswersAfterCompletion: boolean;
  };
  stats: {
    totalAttempts: number;
    averageScore: number;
    completionRate: number; // Percentage of users who complete the quiz
  };
}

/**
 * Question document schema
 * Collection: 'Questions'
 */
export interface Question {
  id: string;
  quizId: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended';
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswer?: string; // For open_ended questions
  explanation?: string;
  points: number;
  timeLimit?: number; // In seconds
  mediaUrl?: string; // URL to image or video
  mediaType?: 'image' | 'video' | 'audio';
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  stats: {
    timesAnswered: number;
    timesAnsweredCorrectly: number;
    averageAnswerTime: number; // In seconds
  };
}

/**
 * Category document schema
 * Collection: 'Categories'
 */
export interface Category {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  coverImageUrl?: string;
  quizCount: number;
  questionCount: number;
  parentCategory?: string; // ID of parent category
  subCategories: string[]; // IDs of sub-categories
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  order: number; // For sorting
}

/**
 * Quiz attempt document schema
 * Collection: 'QuizAttempts'
 */
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  score: number;
  percentageScore: number;
  totalTime: number; // In seconds
  answers: {
    questionId: string;
    selectedOptionId?: string;
    textAnswer?: string;
    isCorrect: boolean;
    points: number;
    timeSpent: number; // In seconds
  }[];
  status: 'in_progress' | 'completed' | 'abandoned';
  deviceInfo?: {
    platform: string;
    browser: string;
    screenSize: string;
  };
}

/**
 * Achievement document schema
 * Collection: 'achievements'
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  criteria: {
    type: 'quiz_count' | 'score_threshold' | 'category_mastery' | 'streak' | 'custom';
    value: number;
    categoryId?: string;
  };
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  createdAt: Timestamp;
  isActive: boolean;
}

/**
 * User achievement document schema
 * Collection: 'user_achievements'
 */
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Timestamp;
  progress: number; // Percentage
  isComplete: boolean;
}

/**
 * Leaderboard entry document schema
 * Collection: 'leaderboards'
 */
export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  rank: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  categoryId?: string; // Optional, for category-specific leaderboards
  updatedAt: Timestamp;
}

/**
 * Notification document schema
 * Collection: 'notifications'
 */
export interface Notification {
  id: string;
  userId: string;
  type: 'achievement' | 'quiz_completed' | 'friend_activity' | 'system' | 'challenge';
  title: string;
  message: string;
  data?: Record<string, any>; // Additional data specific to notification type
  createdAt: Timestamp;
  read: boolean;
  readAt?: Timestamp;
  actionUrl?: string; // URL to navigate to when notification is clicked
} 