import { useQueryClient } from '@tanstack/react-query';
import { addToLeaderboard } from './leaderboardService';
import { recordDailyQuizCompletion, getUserStreak } from './userDailyQuizService';
import { calculateUserRanking } from './leaderboardService';
import { UserRanking } from '@/app/types/leaderboard';
import { getTodayDateString } from './dailyQuizService';

export interface QuizCompletionResult {
  /**
   * User's score
   */
  score: number;
  
  /**
   * Time taken to complete in seconds
   */
  completionTime: number;
  
  /**
   * User's ranking information
   */
  ranking: UserRanking;
  
  /**
   * User's streak information
   */
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
}

/**
 * Handles the completion of a daily quiz
 * This function:
 * 1. Records user completion and updates streak
 * 2. Adds score to leaderboard
 * 3. Calculates user's ranking
 * 4. Invalidates relevant caches
 * 5. Returns combined results for UI
 * 
 * @param userId User ID
 * @param quizId Quiz ID
 * @param score Score achieved (0-100)
 * @param completionTime Time taken to complete in seconds
 * @returns Combined results for UI display
 */
export async function handleDailyQuizCompletion(
  userId: string,
  quizId: string,
  score: number,
  completionTime: number
): Promise<QuizCompletionResult> {
  try {
    const today = getTodayDateString();
    
    // 1. Record user completion and update streak
    await recordDailyQuizCompletion({
      userId,
      quizId,
      completionDate: today
    });
    
    // 2. Add score to leaderboard
    await addToLeaderboard(userId, {
      quizId,
      score,
      completionTime,
      dateCompleted: today
    });
    
    // 3. Calculate user's ranking
    const ranking = await calculateUserRanking(userId, quizId, today);
    
    // 4. Get user's streak information
    const streak = await getUserStreak(userId);
    
    // 5. Return combined results for UI
    return {
      score,
      completionTime,
      ranking,
      streak
    };
  } catch (error) {
    console.error('Error handling daily quiz completion:', error);
    throw new Error('Failed to process quiz completion');
  }
}

/**
 * Invalidates all relevant caches after quiz completion
 * Use this function after handleDailyQuizCompletion to ensure fresh data
 * 
 * @param queryClient Query client instance
 * @param quizId Quiz ID
 */
export function invalidateQuizCompletionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  quizId: string
): void {
  // Invalidate leaderboard caches
  queryClient.invalidateQueries({ queryKey: ['leaderboard', quizId] });
  
  // Invalidate daily quiz status cache
  queryClient.invalidateQueries({ queryKey: ['dailyQuizStatus'] });
  
  // Invalidate user streak cache
  queryClient.invalidateQueries({ queryKey: ['userStreak'] });
  
  // Invalidate quiz-specific caches
  queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
} 