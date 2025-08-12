import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { UserDailyQuizData, DailyQuizStatus, RecordCompletionParams } from '@/app/types/userDailyQuiz';
import { getTodayDateString } from './dailyQuizService';

/**
 * Gets the date string for yesterday in YYYY-MM-DD format
 * @returns Date string in YYYY-MM-DD format
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Checks if two dates are consecutive days
 * @param lastDate Previous date string (YYYY-MM-DD)
 * @param newDate New date string (YYYY-MM-DD)
 * @returns Whether the dates are consecutive days
 */
export function isConsecutiveDay(lastDate: string, newDate: string): boolean {
  const lastDay = new Date(lastDate);
  const newDay = new Date(newDate);
  
  // Calculate difference in days
  const timeDiff = newDay.getTime() - lastDay.getTime();
  const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
  
  // Either same day or consecutive day
  return dayDiff === 1;
}

/**
 * Gets a user's daily quiz data
 * @param userId User ID
 * @returns User's daily quiz data or null if not found
 */
export async function getUserDailyQuizData(userId: string): Promise<UserDailyQuizData | null> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_DAILY_QUIZZES, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserDailyQuizData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user daily quiz data:', error);
    return null;
  }
}

/**
 * Gets a user's streak information
 * @param userId User ID
 * @returns Object containing current and longest streaks
 */
export async function getUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const userData = await getUserDailyQuizData(userId);
    
    if (!userData) {
      return { currentStreak: 0, longestStreak: 0 };
    }
    
    return {
      currentStreak: userData.currentStreak,
      longestStreak: userData.longestStreak
    };
  } catch (error) {
    console.error('Error getting user streak:', error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

/**
 * Creates or updates a user's daily quiz data
 * @param userId User ID
 * @param data Daily quiz data to update
 */
export async function updateUserDailyQuizData(
  userId: string,
  data: Partial<UserDailyQuizData>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.USER_DAILY_QUIZZES, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new document with default values
      const newData: UserDailyQuizData = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        lastCompletionDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...data
      };
      
      await setDoc(docRef, newData);
    }
  } catch (error) {
    console.error('Error updating user daily quiz data:', error);
    throw error;
  }
}

/**
 * Updates a user's streak based on completion date
 * @param userId User ID
 * @param completionDate Date of completion (defaults to today)
 * @returns Updated user daily quiz data
 */
export async function updateUserStreak(
  userId: string,
  completionDate: string = getTodayDateString()
): Promise<UserDailyQuizData> {
  try {
    const userData = await getUserDailyQuizData(userId);
    const today = getTodayDateString();
    
    // Initialize user data if it doesn't exist
    if (!userData) {
      const newData: UserDailyQuizData = {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        totalCompletions: 1,
        lastCompletionDate: completionDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await updateUserDailyQuizData(userId, newData);
      return newData;
    }
    
    // Check if user already completed today's quiz
    if (userData.lastCompletionDate === today) {
      return userData;
    }
    
    // Calculate new streak
    let newCurrentStreak = userData.currentStreak;
    let newLongestStreak = userData.longestStreak;
    
    if (userData.lastCompletionDate) {
      if (isConsecutiveDay(userData.lastCompletionDate, completionDate)) {
        // Consecutive day - increment streak
        newCurrentStreak = userData.currentStreak + 1;
        newLongestStreak = Math.max(userData.longestStreak, newCurrentStreak);
      } else if (userData.lastCompletionDate !== completionDate) {
        // Non-consecutive day - reset streak
        newCurrentStreak = 1;
      }
      // Same day - keep current streak
    } else {
      // First completion
      newCurrentStreak = 1;
      newLongestStreak = 1;
    }
    
    // Update user data
    const updatedData: Partial<UserDailyQuizData> = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalCompletions: userData.totalCompletions + 1,
      lastCompletionDate: completionDate,
      updatedAt: serverTimestamp()
    };
    
    await updateUserDailyQuizData(userId, updatedData);
    
    return {
      ...userData,
      ...updatedData,
      lastCompletionDate: completionDate
    } as UserDailyQuizData;
  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
}

/**
 * Records a daily quiz completion for a user
 * @param params Completion parameters
 * @returns Updated user daily quiz data
 */
export async function recordDailyQuizCompletion(
  params: RecordCompletionParams
): Promise<UserDailyQuizData> {
  try {
    const { userId, quizId, score, maxScore, completionDate = getTodayDateString() } = params;
    
    // Update user streak
    const updatedData = await updateUserStreak(userId, completionDate);
    
    // Record the specific completion
    const completionRef = doc(db, COLLECTIONS.USER_DAILY_QUIZZES, `${userId}_${completionDate}`);
    await setDoc(completionRef, {
      userId,
      quizId,
      score,
      maxScore,
      completionDate,
      completedAt: serverTimestamp()
    });
    
    return updatedData;
  } catch (error) {
    console.error('Error recording daily quiz completion:', error);
    throw error;
  }
}

/**
 * Gets the daily quiz status for a user
 * @param userId User ID
 * @returns Daily quiz status
 */
export async function getDailyQuizStatus(userId: string): Promise<DailyQuizStatus> {
  try {
    const userData = await getUserDailyQuizData(userId);
    const today = getTodayDateString();
    
    if (!userData) {
      return {
        hasCompletedToday: false,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        lastCompletionDate: null
      };
    }
    
    return {
      hasCompletedToday: userData.lastCompletionDate === today,
      currentStreak: userData.currentStreak,
      longestStreak: userData.longestStreak,
      totalCompletions: userData.totalCompletions,
      lastCompletionDate: userData.lastCompletionDate
    };
  } catch (error) {
    console.error('Error getting daily quiz status:', error);
    return {
      hasCompletedToday: false,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      lastCompletionDate: null
    };
  }
} 