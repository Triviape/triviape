'use client';

import { useQuery, useQueryClient, QueryKey, UseQueryOptions, useMutation } from '@tanstack/react-query';
import { getQuestionsByIds } from '@/app/lib/services/questionService';
import { Question } from '@/app/types/question';
import { useCallback, useMemo } from 'react';

/**
 * Error type for question fetching
 */
export interface QuestionFetchError extends Error {
  code?: string;
  details?: unknown;
}

/**
 * Generates consistent query keys for question caching
 * Sorting ensures cache hit regardless of array order
 */
export const getQuestionsQueryKey = (questionIds: string[]): QueryKey => 
  ['questions', ...questionIds.sort()];

/**
 * Hook to fetch questions for a quiz with optimized caching
 * 
 * @param questionIds Array of question IDs to fetch
 * @param options Additional query options for customization
 * @returns React Query result with questions data and status
 */
export function useQuizQuestions<TData = Question[]>(
  questionIds: string[] = [],
  options: Omit<UseQueryOptions<Question[], QuestionFetchError, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
) {
  // Memoize the query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => getQuestionsQueryKey(questionIds), [questionIds]);
  
  // Memoize the query function
  const queryFn = useCallback(() => getQuestionsByIds(questionIds), [questionIds]);

  return useQuery<Question[], QuestionFetchError, TData, QueryKey>({
    queryKey,
    queryFn,
    staleTime: 30 * 60 * 1000, // Data considered fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    enabled: questionIds.length > 0, // Only fetch if we have IDs
    refetchOnWindowFocus: false, // Avoid unnecessary refetches
    ...options, // Spread custom options to allow overrides
  });
}

/**
 * Prefetches questions for a quiz to improve user experience
 * 
 * @param questionIds Array of question IDs to prefetch
 * @param options Additional query options for customization
 * @param retryCount Number of times to retry the prefetch if it fails
 * @returns Promise that resolves when the prefetch is complete
 */
export function prefetchQuizQuestions(
  questionIds: string[] = [],
  options: Omit<UseQueryOptions<Question[], QuestionFetchError, QueryKey>, 'queryKey' | 'queryFn'> = {},
  retryCount = 1
): Promise<void> {
  const queryClient = useQueryClient();

  // If no question IDs, skip prefetching
  if (!questionIds.length) {
    return Promise.resolve();
  }

  // Build query key
  const queryKey = getQuestionsQueryKey(questionIds);

  // If already in cache with data, no need to prefetch
  if (queryClient.getQueryData(queryKey)) {
    return Promise.resolve();
  }

  // Implementation with retry logic
  const attemptPrefetch = async (attemptsLeft: number): Promise<void> => {
    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: () => getQuestionsByIds(questionIds),
        staleTime: 30 * 60 * 1000, // Data considered fresh for 30 minutes
        gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
        ...options,
      });
    } catch (error) {
      // If retries left, try again with exponential backoff
      if (attemptsLeft > 0) {
        const delay = 2 ** (retryCount - attemptsLeft) * 500; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptPrefetch(attemptsLeft - 1);
      }
      // No more retries, let the error propagate
      throw error;
    }
  };

  return attemptPrefetch(retryCount);
}

/**
 * Invalidates cached questions to force a refresh
 * 
 * @param queryClient The React Query client instance
 * @param questionIds Optional array of question IDs to invalidate. If not provided, all question caches are invalidated.
 * @returns Promise that resolves when the invalidation is complete
 */
export function invalidateQuestionCache(
  queryClient: ReturnType<typeof useQueryClient>,
  questionIds?: string[]
): Promise<void> {
  // If specific question IDs provided, only invalidate those
  if (questionIds?.length) {
    return queryClient.invalidateQueries({
      queryKey: getQuestionsQueryKey(questionIds),
    });
  }
  
  // Otherwise, invalidate all question caches
  return queryClient.invalidateQueries({
    queryKey: ['questions'],
  });
} 