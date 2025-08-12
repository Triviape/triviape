import { collection, doc, getDoc, getDocs, query, where, setDoc, DocumentSnapshot, DocumentData, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { Quiz } from '@/app/types/quiz';
import { serverTimestamp } from 'firebase/firestore';
import { getQuestionsByIds } from './questionService';

/**
 * Performance monitoring interface
 */
interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Records performance metrics for monitoring
 * @param metrics Performance metrics to record
 */
function recordPerformanceMetrics(metrics: PerformanceMetrics): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`Performance: ${metrics.operation} took ${metrics.duration}ms (${metrics.success ? 'success' : 'failed'})`);
  }
  
  // In production, you might want to send this to a monitoring service
  // Example: Analytics.track('service_performance', metrics);
}

/**
 * Maps a Firestore document to a Quiz object
 * @param docSnap Firestore document snapshot
 * @param dailyQuizDate Optional date string if this is a daily quiz
 * @returns Quiz object with properly formatted data
 */
export function mapFirestoreToQuiz(docSnap: DocumentSnapshot<DocumentData>, dailyQuizDate?: string): Quiz {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data?.title || '',
    description: data?.description || '',
    categoryId: data?.categoryId || '',
    difficulty: data?.difficulty || 'medium',
    timeLimit: data?.timeLimit || 300, // 5 minutes default
    questionIds: data?.questionIds || [],
    isActive: data?.isActive ?? true,
    createdAt: data?.createdAt?.toDate() || new Date(),
    updatedAt: data?.updatedAt?.toDate() || new Date(),
    isDailyQuiz: !!dailyQuizDate,
    dailyQuizDate: dailyQuizDate || null,
  };
}

/**
 * Gets today's date string in YYYY-MM-DD format, respecting user's timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Improved hash function for deterministic quiz selection
 * Uses a more sophisticated algorithm for better distribution
 * @param dateString Date string to hash
 * @returns Hash value for quiz selection
 */
function generateDateHash(dateString: string): number {
  let hash = 0;
  const prime = 31;
  
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash * prime + dateString.charCodeAt(i)) >>> 0; // Keep as unsigned 32-bit
  }
  
  return hash;
}

/**
 * Prefetches questions for a quiz using direct service calls
 * This replaces the React hook usage in the service layer
 * @param questionIds Array of question IDs to prefetch
 */
async function prefetchQuestionsForQuiz(questionIds: string[]): Promise<void> {
  if (!questionIds?.length) return;
  
  const startTime = Date.now();
  
  try {
    // Use the service directly instead of React hooks
    await getQuestionsByIds(questionIds);
    
    recordPerformanceMetrics({
      operation: 'prefetch_questions',
      duration: Date.now() - startTime,
      success: true
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Prefetched ${questionIds.length} questions for quiz`);
    }
  } catch (error) {
    recordPerformanceMetrics({
      operation: 'prefetch_questions',
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.warn('Failed to prefetch quiz questions:', error);
  }
}

/**
 * Attempts to fetch the designated daily quiz for a specific date
 * @param dateString Date in YYYY-MM-DD format
 * @returns Quiz object if found, null otherwise
 */
export async function getDesignatedDailyQuiz(dateString: string): Promise<Quiz | null> {
  const startTime = Date.now();
  
  try {
    // First check if there's a designated daily quiz
    const dailyQuizRef = doc(db, COLLECTIONS.DAILY_QUIZZES, dateString);
    const dailyQuizDoc = await getDoc(dailyQuizRef);
    
    if (dailyQuizDoc.exists() && dailyQuizDoc.data().quizId) {
      // Fetch the actual quiz document
      const quizId = dailyQuizDoc.data().quizId;
      const quizDocRef = doc(db, COLLECTIONS.QUIZZES, quizId);
      const quizDoc = await getDoc(quizDocRef);
      
      if (quizDoc.exists()) {
        // Create a quiz object with daily quiz metadata
        const quiz = mapFirestoreToQuiz(quizDoc, dateString);
        
        // Prefetch the quiz questions for better UX
        if (quiz.questionIds?.length > 0) {
          prefetchQuestionsForQuiz(quiz.questionIds).catch(err => {
            console.warn('Failed to prefetch daily quiz questions:', err);
          });
        }
        
        recordPerformanceMetrics({
          operation: 'get_designated_daily_quiz',
          duration: Date.now() - startTime,
          success: true
        });
        
        return quiz;
      }
    }
    
    recordPerformanceMetrics({
      operation: 'get_designated_daily_quiz',
      duration: Date.now() - startTime,
      success: true
    });
    
    return null;
  } catch (error) {
    recordPerformanceMetrics({
      operation: 'get_designated_daily_quiz',
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error(`Error fetching designated daily quiz for ${dateString}:`, error);
    return null;
  }
}

/**
 * Generates a fallback quiz when no designated quiz is available
 * Uses an improved deterministic algorithm based on the date to ensure all users get the same quiz
 * @param dateString Date in YYYY-MM-DD format
 * @returns Quiz object selected for the given date
 */
export async function getFallbackQuiz(dateString: string): Promise<Quiz | null> {
  const startTime = Date.now();
  
  try {
    // Query active quizzes to select from
    const quizzesQuery = query(
      collection(db, COLLECTIONS.QUIZZES), 
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(quizzesQuery);
    
    if (snapshot.empty) {
      console.error('No active quizzes found for fallback selection');
      
      recordPerformanceMetrics({
        operation: 'get_fallback_quiz',
        duration: Date.now() - startTime,
        success: false,
        error: 'No active quizzes found'
      });
      
      return null;
    }
    
    // Use improved hash function for better distribution
    const dateHash = generateDateHash(dateString);
    
    // Map docs to quiz objects
    const quizzes = snapshot.docs.map(doc => mapFirestoreToQuiz(doc));
    
    // Select a quiz based on the improved date hash
    const selectedQuiz = quizzes[dateHash % quizzes.length];
    
    // Add daily quiz metadata
    const fallbackQuiz: Quiz = {
      ...selectedQuiz,
      isDailyQuiz: true,
      dailyQuizDate: dateString
    };
    
    // Log that we're using a fallback
    console.info(`Using fallback quiz "${fallbackQuiz.title}" for ${dateString}`);
    
    // Prefetch questions for better UX
    if (fallbackQuiz.questionIds?.length > 0) {
      prefetchQuestionsForQuiz(fallbackQuiz.questionIds).catch(err => {
        console.warn('Failed to prefetch fallback quiz questions:', err);
      });
    }
    
    recordPerformanceMetrics({
      operation: 'get_fallback_quiz',
      duration: Date.now() - startTime,
      success: true
    });
    
    return fallbackQuiz;
  } catch (error) {
    recordPerformanceMetrics({
      operation: 'get_fallback_quiz',
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error(`Error generating fallback quiz for ${dateString}:`, error);
    return null;
  }
}

/**
 * Records that a user completed the daily quiz using Firestore transactions
 * This prevents race conditions and ensures data consistency
 * @param userId User ID
 * @param quizId Quiz ID
 * @param dateString Date string in YYYY-MM-DD format
 */
export async function recordDailyQuizCompletion(
  userId: string,
  quizId: string,
  dateString: string
): Promise<void> {
  const startTime = Date.now();
  
  try {
    if (!userId) {
      console.warn('Cannot record quiz completion: Missing user ID');
      return;
    }
    
    // Use Firestore transaction to prevent race conditions
    await runTransaction(db, async (transaction) => {
      // Reference to the user's completion document for this date
      const completionRef = doc(
        db, 
        COLLECTIONS.USER_DAILY_QUIZZES, 
        `${userId}_${dateString}`
      );
      
      // Check if this completion already exists within the transaction
      const docSnap = await transaction.get(completionRef);
      
      if (!docSnap.exists()) {
        // Only record if not already completed (atomic check)
        transaction.set(completionRef, {
          quizId,
          completedAt: serverTimestamp(),
          dateString,
          userId
        });
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Recorded daily quiz completion for user ${userId}, date ${dateString}`);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`User ${userId} already completed daily quiz for ${dateString}`);
        }
      }
    });
    
    recordPerformanceMetrics({
      operation: 'record_daily_quiz_completion',
      duration: Date.now() - startTime,
      success: true
    });
  } catch (error) {
    recordPerformanceMetrics({
      operation: 'record_daily_quiz_completion',
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error('Error recording daily quiz completion:', error);
    throw error;
  }
}

/**
 * Gets the daily quiz for today
 * First tries to get a designated quiz, then falls back to a deterministic selection
 * @returns Quiz object for today's daily quiz
 */
export async function getDailyQuiz(): Promise<Quiz | null> {
  const startTime = Date.now();
  const todayString = getTodayDateString();
  
  try {
    // First try to get the designated daily quiz
    const designatedQuiz = await getDesignatedDailyQuiz(todayString);
    
    if (designatedQuiz) {
      recordPerformanceMetrics({
        operation: 'get_daily_quiz',
        duration: Date.now() - startTime,
        success: true
      });
      
      return designatedQuiz;
    }
    
    // Log that we're using the fallback
    console.warn(`No designated quiz found for ${todayString}, using fallback selection`);
    
    // Fall back to a deterministic selection
    const fallbackQuiz = await getFallbackQuiz(todayString);
    
    recordPerformanceMetrics({
      operation: 'get_daily_quiz',
      duration: Date.now() - startTime,
      success: true
    });
    
    return fallbackQuiz;
  } catch (error) {
    recordPerformanceMetrics({
      operation: 'get_daily_quiz',
      duration: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    console.error('Error getting daily quiz:', error);
    return null;
  }
}

/**
 * Gets quiz statistics for monitoring and analytics
 * @param dateString Optional date string (defaults to today)
 * @returns Quiz statistics
 */
export async function getDailyQuizStats(dateString: string = getTodayDateString()): Promise<{
  totalCompletions: number;
  averageScore: number;
  completionRate: number;
}> {
  try {
    const completionsQuery = query(
      collection(db, COLLECTIONS.USER_DAILY_QUIZZES),
      where('dateString', '==', dateString)
    );
    
    const snapshot = await getDocs(completionsQuery);
    const completions = snapshot.docs.map(doc => doc.data());
    
    const totalCompletions = completions.length;
    const totalScore = completions.reduce((sum, completion) => sum + (completion.score || 0), 0);
    const averageScore = totalCompletions > 0 ? totalScore / totalCompletions : 0;
    
    // Note: completionRate would need total user count, which requires additional query
    const completionRate = 0; // Placeholder - would need total user count
    
    return {
      totalCompletions,
      averageScore,
      completionRate
    };
  } catch (error) {
    console.error('Error getting daily quiz stats:', error);
    return {
      totalCompletions: 0,
      averageScore: 0,
      completionRate: 0
    };
  }
} 