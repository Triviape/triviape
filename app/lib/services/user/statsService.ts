/**
 * User stats management service
 */

import { doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../../firebase';
import { COLLECTIONS, UserServiceErrorType } from './types';
import { createUserError } from './errorHandler';
import { FirebaseError } from 'firebase/app';

/**
 * Get a user's stats
 * @param userId User ID
 * @returns User stats
 */
export async function getUserStats(userId: string): Promise<any> {
  try {
    const db = getFirestoreDb();
    const statsDoc = doc(db, COLLECTIONS.USER_STATS, userId);
    const docSnap = await getDoc(statsDoc);
    
    if (!docSnap.exists()) {
      throw createUserError(
        'User stats not found',
        UserServiceErrorType.STATS_ERROR
      );
    }
    
    return docSnap.data();
  } catch (error) {
    throw createUserError(
      'Failed to get user stats',
      UserServiceErrorType.STATS_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Update quiz completion stats
 * @param userId User ID
 * @param correctAnswers Number of correct answers
 * @param totalAnswers Total number of answers
 * @param pointsEarned Points earned
 */
export async function updateQuizStats(
  userId: string,
  correctAnswers: number,
  totalAnswers: number,
  pointsEarned: number
): Promise<void> {
  try {
    const db = getFirestoreDb();
    const statsDoc = doc(db, COLLECTIONS.USER_STATS, userId);
    
    await updateDoc(statsDoc, {
      quizzesTaken: increment(1),
      correctAnswers: increment(correctAnswers),
      totalAnswers: increment(totalAnswers),
      totalPoints: increment(pointsEarned),
      lastPlayed: Timestamp.now(),
      streak: increment(1) // This is simplified; real streak logic would be more complex
    });
  } catch (error) {
    throw createUserError(
      'Failed to update quiz stats',
      UserServiceErrorType.STATS_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Increment the number of quizzes created by a user
 * @param userId User ID
 */
export async function incrementQuizzesCreated(userId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    const statsDoc = doc(db, COLLECTIONS.USER_STATS, userId);
    
    await updateDoc(statsDoc, {
      quizzesCreated: increment(1)
    });
  } catch (error) {
    throw createUserError(
      'Failed to update quizzes created count',
      UserServiceErrorType.STATS_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export const StatsService = {
  getUserStats,
  updateQuizStats,
  incrementQuizzesCreated,
};
