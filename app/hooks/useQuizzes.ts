'use client';

import { useCallback } from 'react';
import { useOptimizedQuery } from './query/useOptimizedQuery';
import { useOptimizedInfiniteQuery } from './query/useOptimizedInfiniteQuery';
import { 
  getQuizzes, 
  getQuizById, 
  getQuestionsByIds, 
  getCategories,
  getQuestionSummaries
} from '@/app/lib/services/quiz/quizFetchService';
import { DifficultyLevel, Quiz, Question, QuizCategory, QuestionSummary } from '@/app/lib/services/quiz/types';
import { memoizeWithCache } from '@/app/lib/cacheUtils';

// Memoize the fetch functions for better performance
const memoizedGetQuizzes = memoizeWithCache(getQuizzes, { 
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true 
});

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

const memoizedGetQuestionSummaries = memoizeWithCache(getQuestionSummaries, { 
  ttl: 5 * 60 * 1000, // 5 minutes
  staleWhileRevalidate: true 
});

/**
 * Hook for fetching quizzes with pagination
 * @param categoryId Optional category ID to filter by
 * @param difficulty Optional difficulty level to filter by
 * @param pageSize Number of quizzes per page
 * @returns Infinite query result with quizzes
 */
export function useQuizzes(categoryId?: string, difficulty?: DifficultyLevel, pageSize = 10) {
  // Create a query function that uses the memoized fetch function
  const fetchQuizzes = useCallback(
    ({ pageParam }) => memoizedGetQuizzes(categoryId, difficulty, pageSize, pageParam),
    [categoryId, difficulty, pageSize]
  );
  
  return useOptimizedInfiniteQuery({
    queryKey: ['quizzes', categoryId, difficulty, pageSize],
    queryFn: fetchQuizzes,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    componentName: 'QuizList',
    queryName: `quizzes_${categoryId || 'all'}_${difficulty || 'all'}`,
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
 * Hook for fetching question summaries with pagination
 * @param categoryId Optional category ID to filter by
 * @param difficulty Optional difficulty level to filter by
 * @param pageSize Number of questions per page
 * @returns Infinite query result with question summaries
 */
export function useQuestionSummaries(categoryId?: string, difficulty?: DifficultyLevel, pageSize = 20) {
  // Create a query function that uses the memoized fetch function
  const fetchQuestionSummaries = useCallback(
    ({ pageParam }) => memoizedGetQuestionSummaries(categoryId, difficulty, pageSize, pageParam),
    [categoryId, difficulty, pageSize]
  );
  
  return useOptimizedInfiniteQuery({
    queryKey: ['questionSummaries', categoryId, difficulty, pageSize],
    queryFn: fetchQuestionSummaries,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.lastDoc : undefined,
    componentName: 'QuestionList',
    queryName: `questions_${categoryId || 'all'}_${difficulty || 'all'}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 