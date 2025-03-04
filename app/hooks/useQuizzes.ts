'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { QuizService } from '@/app/lib/services/quizService';
import { Quiz, DifficultyLevel } from '@/app/types/quiz';

// Query keys for React Query
export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters: { categoryId?: string; difficulty?: DifficultyLevel }) =>
    [...quizKeys.lists(), filters] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
};

/**
 * Hook for fetching a paginated list of quizzes with filters
 */
export function useQuizzes(categoryId?: string, difficulty?: DifficultyLevel, pageSize = 10) {
  return useInfiniteQuery({
    queryKey: quizKeys.list({ categoryId, difficulty }),
    queryFn: async ({ pageParam }) => {
      const result = await QuizService.getQuizzes(
        categoryId,
        difficulty,
        pageSize,
        pageParam
      );
      return result;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastVisible || null,
    // Keep cached for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single quiz by ID
 */
export function useQuiz(quizId: string) {
  return useQuery({
    queryKey: quizKeys.detail(quizId),
    queryFn: async () => {
      const quiz = await QuizService.getQuizById(quizId);
      return quiz;
    },
    // Keep cached for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook for fetching the questions for a quiz
 */
export function useQuizQuestions(questionIds: string[] | undefined) {
  return useQuery({
    queryKey: ['questions', { ids: questionIds }],
    queryFn: async () => {
      if (!questionIds || questionIds.length === 0) return [];
      return await QuizService.getQuestionsByIds(questionIds);
    },
    // Disable the query if we don't have question IDs
    enabled: !!questionIds && questionIds.length > 0,
    // Keep cached for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
} 