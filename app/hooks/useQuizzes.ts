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
import { mockDailyQuiz, mockQuestions } from '@/app/lib/services/quiz/mockDailyQuiz';

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
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('pageSize', '20'); // Get more quizzes for better UX
      
      const response = await fetch(`/api/quizzes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quizzes');
      }
      
      return result.data;
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
    queryFn: () => {
      // Use mock data for development
      if (quizId === 'daily-quiz-1') {
        return mockDailyQuiz;
      }
      
      // Use the real service for other quiz IDs
      return memoizedGetQuizById(quizId);
    },
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
    queryFn: () => {
      // Use mock data for development
      if (questionIds && questionIds.length > 0 && questionIds[0].startsWith('question-')) {
        return mockQuestions;
      }
      
      // Use the real service for other question IDs
      return memoizedGetQuestionsByIds(questionIds || []);
    },
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
      try {
        // Try to fetch from the real API first
        const response = await fetch('/api/daily-quiz');
        if (response.ok) {
          return response.json();
        }
        console.log('Using mock daily quiz data as fallback');
        // Fall back to mock data if API call fails
        return mockDailyQuiz;
      } catch (error) {
        console.log('Error fetching daily quiz, using mock data:', error);
        // Fall back to mock data on any error
        return mockDailyQuiz;
      }
    },
    componentName: 'DailyQuiz',
    queryName: 'daily_quiz',
    staleTime: 60 * 60 * 1000, // 1 hour
  });
} 