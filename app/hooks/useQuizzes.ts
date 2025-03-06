'use client';

import { useCallback } from 'react';
import { useOptimizedQuery } from './query/useOptimizedQuery';
import { 
  getQuizById, 
  getQuestionsByIds, 
  getCategories,
} from '@/app/lib/services/quiz/quizFetchService';
import { DifficultyLevel, Quiz, Question, QuizCategory } from '@/app/types/quiz';
import { memoizeWithCache } from '@/app/lib/cacheUtils';

// Memoize the fetch functions for better performance
const memoizedGetQuizById = memoizeWithCache(getQuizById, { 
  ttl: 10 * 60 * 1000, // 10 minutes
  staleWhileRevalidate: true 
});

const memoizedGetQuestionsByIds = memoizeWithCache(getQuestionsByIds, { 
  ttl: 10 * 60 * 1000, // 10 minutes
  staleWhileRevalidate: true 
});

const memoizedGetCategories = memoizeWithCache(getCategories, { 
  ttl: 30 * 60 * 1000, // 30 minutes
  staleWhileRevalidate: true 
});

/**
 * Hook for fetching quizzes with optional filtering
 * @param categoryId Optional category ID to filter by
 * @param difficulty Optional difficulty level to filter by
 * @returns Query result with paginated quiz data
 */
export function useQuizzes(categoryId?: string, difficulty?: DifficultyLevel) {
  return useOptimizedQuery({
    queryKey: ['quizzes', categoryId, difficulty],
    queryFn: async () => {
      // This is a placeholder implementation since getQuizzes doesn't exist
      // In a real implementation, this would call the actual service function
      const response = await fetch(`/api/quizzes?${categoryId ? `categoryId=${categoryId}` : ''}${difficulty ? `&difficulty=${difficulty}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      return response.json();
    },
    componentName: 'QuizList',
    queryName: 'quizzes_list',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching a single quiz by ID
 * @param quizId Quiz ID
 * @returns Query result with quiz data
 */
export function useQuiz(quizId: string) {
  return useOptimizedQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => memoizedGetQuizById(quizId),
    componentName: 'QuizDetail',
    queryName: `quiz_${quizId}`,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!quizId
  });
}

/**
 * Hook for fetching quiz questions by IDs
 * @param questionIds Array of question IDs
 * @returns Query result with questions data
 */
export function useQuizQuestions(questionIds: string[] | undefined) {
  return useOptimizedQuery({
    queryKey: ['questions', questionIds],
    queryFn: () => memoizedGetQuestionsByIds(questionIds || []),
    componentName: 'QuizQuestions',
    queryName: 'quiz_questions',
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!questionIds && questionIds.length > 0
  });
}

/**
 * Hook for fetching quiz categories
 * @returns Query result with categories data
 */
export function useQuizCategories() {
  return useOptimizedQuery({
    queryKey: ['categories'],
    queryFn: () => memoizedGetCategories(),
    componentName: 'QuizCategories',
    queryName: 'quiz_categories',
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching the daily quiz
 * @returns Query result with the daily quiz data
 */
export function useDailyQuiz() {
  return useOptimizedQuery({
    queryKey: ['dailyQuiz'],
    queryFn: async () => {
      const response = await fetch('/api/daily-quiz');
      if (!response.ok) {
        throw new Error('Failed to fetch daily quiz');
      }
      return response.json();
    },
    componentName: 'DailyQuiz',
    queryName: 'daily_quiz',
    staleTime: 60 * 60 * 1000, // 1 hour
  });
} 