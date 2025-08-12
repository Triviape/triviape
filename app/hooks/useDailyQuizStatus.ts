'use client';

import { useQuery } from '@tanstack/react-query';
import { getDailyQuizStatus } from '@/app/lib/services/userDailyQuizService';
import { DailyQuizStatus } from '@/app/types/userDailyQuiz';
import { useAuth } from '@/app/hooks/useAuth';

/**
 * Hook to get the current user's daily quiz status
 * @returns Query result with the user's daily quiz status
 */
export function useDailyQuizStatus() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dailyQuizStatus', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        throw new Error('User is not authenticated');
      }
      
      return getDailyQuizStatus(user.uid);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
  });
}

/**
 * Hook to check if the user has completed today's daily quiz
 * @returns Boolean indicating if today's quiz is completed
 */
export function useHasCompletedDailyQuiz() {
  const { data: status, isLoading, error } = useDailyQuizStatus();
  
  return {
    hasCompleted: status?.hasCompletedToday ?? false,
    currentStreak: status?.currentStreak ?? 0,
    isLoading,
    error
  };
}

/**
 * Hook to update the daily quiz completion status
 * @param quizId The ID of the completed quiz
 * @param score The score achieved
 * @returns Promise that resolves when the update is complete
 */
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

/**
 * Generate mock daily quiz status for development
 */
function getMockDailyQuizStatus(): DailyQuizStatus {
  // Simulate a 50% chance of having completed today's quiz
  const hasCompleted = Math.random() > 0.5;
  
  return {
    hasCompleted,
    completedAt: hasCompleted ? Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 12) : undefined,
    currentStreak: hasCompleted ? Math.floor(Math.random() * 10) + 1 : 0,
    bestStreak: Math.floor(Math.random() * 30) + 1,
    lastCompletedDate: hasCompleted ? new Date().toISOString().split('T')[0] : undefined
  };
} 