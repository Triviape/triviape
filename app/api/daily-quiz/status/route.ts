import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/app/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { withApiErrorHandling } from '@/app/lib/apiUtils';

interface DailyQuizStatus {
  hasCompleted: boolean;
  completedAt?: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string;
}

/**
 * GET /api/daily-quiz/status
 * Returns the status of the current user's daily quiz completion
 */
export async function GET(req: NextRequest) {
  return withApiErrorHandling(req, async () => {
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }
    
    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get the user's daily quiz data from Firestore
    const userDailyQuizRef = doc(db, 'user_daily_quiz', userId);
    const userDailyQuizSnap = await getDoc(userDailyQuizRef);
    
    if (!userDailyQuizSnap.exists()) {
      // User has no daily quiz history yet
      return {
        hasCompleted: false,
        currentStreak: 0,
        bestStreak: 0
      };
    }
    
    const userData = userDailyQuizSnap.data();
    const lastCompletedDate = userData.lastCompletedDate;
    const hasCompleted = lastCompletedDate === today;
    
    const status: DailyQuizStatus = {
      hasCompleted,
      currentStreak: userData.currentStreak || 0,
      bestStreak: userData.bestStreak || 0,
      lastCompletedDate
    };
    
    if (hasCompleted) {
      status.completedAt = userData.completedAt;
    }
    
    return status;
  });
}

/**
 * POST /api/daily-quiz/status
 * Records completion of today's daily quiz
 * Request body: { quizId: string, score: number }
 */
export async function POST(req: NextRequest) {
  return withApiErrorHandling(req, async () => {
    // Get authenticated user
    const session = await auth();
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }
    
    const userId = session.user.id;
    const data = await req.json();
    
    if (!data.quizId) {
      throw new Error('Quiz ID is required');
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const now = Date.now();
    
    // Get existing data
    const userDailyQuizRef = doc(db, 'user_daily_quiz', userId);
    const userDailyQuizSnap = await getDoc(userDailyQuizRef);
    
    let currentStreak = 1;
    let bestStreak = 1;
    let totalCompleted = 1;
    
    if (userDailyQuizSnap.exists()) {
      const userData = userDailyQuizSnap.data();
      const lastCompletedDate = userData.lastCompletedDate;
      
      // If user already completed today's quiz, don't update
      if (lastCompletedDate === today) {
        return {
          hasCompleted: true,
          currentStreak: userData.currentStreak,
          bestStreak: userData.bestStreak,
          lastCompletedDate: today,
          completedAt: userData.completedAt
        };
      }
      
      // Check if the streak continues or resets
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      if (lastCompletedDate === yesterdayString) {
        // Streak continues
        currentStreak = (userData.currentStreak || 0) + 1;
      } else {
        // Streak resets
        currentStreak = 1;
      }
      
      bestStreak = Math.max(currentStreak, userData.bestStreak || 0);
      totalCompleted = (userData.totalCompleted || 0) + 1;
    }
    
    // Update or create the user's daily quiz record
    const userDailyQuizData = {
      currentStreak,
      bestStreak,
      lastCompletedDate: today,
      completedAt: now,
      totalCompleted,
      quizAttempts: {
        [data.quizId]: {
          lastCompleted: today,
          score: data.score || 0,
          completedAt: now
        }
      }
    };
    
    if (userDailyQuizSnap.exists()) {
      await updateDoc(userDailyQuizRef, userDailyQuizData);
    } else {
      await setDoc(userDailyQuizRef, userDailyQuizData);
    }
    
    // Return the updated status
    return {
      hasCompleted: true,
      currentStreak,
      bestStreak,
      lastCompletedDate: today,
      completedAt: now
    };
  });
} 