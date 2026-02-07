'use client';

import { useQuery } from '@tanstack/react-query';
import { getDailyQuizStatus } from '@/app/lib/services/userDailyQuizService';
import { DailyQuizStatus } from '@/app/types/userDailyQuiz';
import { useAuth } from '@/app/hooks/useAuth';
import { safeAsync } from '@/app/lib/errorHandling';
import { getApiBaseUrl } from '@/app/lib/environment';
import { createAppError, ErrorType } from '@/app/lib/errorHandling';

export function useDailyQuizStatus() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['dailyQuizStatus', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) {
        throw new Error('User is not authenticated');
      }

      return getDailyQuizStatus(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
  });
}

export function useHasCompletedDailyQuiz() {
  const { data: status, isLoading, error } = useDailyQuizStatus();

  const normalized = {
    hasCompleted: status?.hasCompletedToday ?? false,
    currentStreak: status?.currentStreak ?? 0,
    bestStreak: status?.longestStreak ?? 0,
  };

  return {
    ...normalized,
    data: normalized,
    isLoading,
    error,
  };
}

export async function updateDailyQuizCompletion(quizId: string, score: number): Promise<DailyQuizStatus> {
  const [data, error] = await safeAsync(async () => {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/daily-quiz/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quizId,
        score,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createAppError(
        ErrorType.SERVER,
        errorData.error || `Failed to update quiz status: ${response.status}`,
        { code: `HTTP_${response.status}` }
      );
    }

    return response.json();
  });

  if (error) {
    throw error;
  }

  return data as DailyQuizStatus;
}
