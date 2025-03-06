'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { cookies } from 'next/headers';

// Collection names for Firestore
const COLLECTIONS = {
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  CATEGORIES: 'categories',
  QUIZ_ATTEMPTS: 'quiz_attempts'
};

// Get Firestore instance
const adminDb = FirebaseAdminService.getFirestore();

// Get Auth instance
const adminAuth = FirebaseAdminService.getAuth();

/**
 * Validate and get the current user ID from the session
 */
async function getCurrentUserId(): Promise<string> {
  const sessionCookie = (await cookies()).get('session')?.value;
  
  if (!sessionCookie) {
    throw new Error('Not authenticated');
  }
  
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session:', error);
    throw new Error('Not authenticated');
  }
}

// Schema for submitting a quiz attempt
const QuizAttemptSchema = z.object({
  quizId: z.string(),
  startedAt: z.number(),
  completedAt: z.number(),
  questionSequence: z.array(z.string()),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedAnswerIds: z.array(z.string()),
    timeSpent: z.number(),
    wasSkipped: z.boolean(),
  })),
});

/**
 * Submit a quiz attempt
 * This is a server action that handles quiz submission securely
 */
export async function submitQuizAttempt(formData: FormData) {
  // Get and validate the current user
  const userId = await getCurrentUserId();
  
  // Parse form data
  const rawData = {
    quizId: formData.get('quizId'),
    startedAt: Number(formData.get('startedAt')),
    completedAt: Number(formData.get('completedAt')),
    questionSequence: JSON.parse(formData.get('questionSequence') as string),
    answers: JSON.parse(formData.get('answers') as string),
  };
  
  // Validate the data
  const validatedData = QuizAttemptSchema.parse(rawData);
  
  try {
    // Get the quiz
    const quizRef = adminDb.collection(COLLECTIONS.QUIZZES).doc(validatedData.quizId);
    const quizDoc = await quizRef.get();
    
    if (!quizDoc.exists) {
      throw new Error('Quiz not found');
    }
    
    const quiz = quizDoc.data()!;
    
    // Get all questions for scoring
    const questionIds = validatedData.questionSequence;
    const questionsSnapshot = await adminDb
      .collection(COLLECTIONS.QUESTIONS)
      .where('id', 'in', questionIds)
      .get();
    
    const questions = new Map();
    questionsSnapshot.forEach(doc => {
      questions.set(doc.id, doc.data());
    });
    
    // Score the quiz
    let score = 0;
    let maxPossibleScore = 0;
    
    const scoredAnswers = validatedData.answers.map(answer => {
      const question = questions.get(answer.questionId);
      
      if (!question) {
        return { ...answer, wasCorrect: false, pointsEarned: 0 };
      }
      
      maxPossibleScore += question.points;
      
      // Skip scored as incorrect
      if (answer.wasSkipped) {
        return { ...answer, wasCorrect: false, pointsEarned: 0 };
      }
      
      // Check if answer is correct
      const correctAnswerIds = question.answers
        .filter((a: { isCorrect: boolean }) => a.isCorrect)
        .map((a: { id: string }) => a.id);
      
      const isCorrect = 
        correctAnswerIds.length === answer.selectedAnswerIds.length &&
        correctAnswerIds.every((id: string) => answer.selectedAnswerIds.includes(id));
      
      const pointsEarned = isCorrect ? question.points : 0;
      score += pointsEarned;
      
      return { ...answer, wasCorrect: isCorrect, pointsEarned };
    });
    
    // Calculate rewards
    const xpMultiplier = 1 + (score / maxPossibleScore) * 0.5; // Bonus multiplier based on score
    const xpEarned = Math.round(quiz.baseXP * xpMultiplier);
    const coinsEarned = Math.round(quiz.baseCoins * xpMultiplier);
    
    // Create the quiz attempt record
    const attemptData = {
      userId,
      quizId: validatedData.quizId,
      startedAt: validatedData.startedAt,
      completedAt: validatedData.completedAt,
      questionSequence: validatedData.questionSequence,
      answers: scoredAnswers,
      score,
      maxPossibleScore,
      xpEarned,
      coinsEarned,
      deviceInfo: {
        // You could include device info from request headers or client-side data
        deviceType: formData.get('deviceType') || 'unknown',
        browser: formData.get('browser') || 'unknown',
        os: formData.get('os') || 'unknown',
      }
    };
    
    // Run a transaction to update everything atomically
    await adminDb.runTransaction(async transaction => {
      // Create attempt document
      const attemptRef = adminDb
        .collection(COLLECTIONS.QUIZZES)
        .doc(validatedData.quizId)
        .collection('quiz_attempts')
        .doc();
        
      transaction.set(attemptRef, attemptData);
      
      // Update user profile (add XP and coins)
      const userRef = adminDb.collection('users').doc(userId);
      transaction.update(userRef, {
        xp: FieldValue.increment(xpEarned),
        coins: FieldValue.increment(coinsEarned),
        quizzesTaken: FieldValue.increment(1),
        questionsAnswered: FieldValue.increment(validatedData.answers.length),
        correctAnswers: FieldValue.increment(
          scoredAnswers.filter(a => a.wasCorrect).length
        ),
      });
      
      // Update user stats
      const userStatsRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('user_stats')
        .doc('quiz_stats');
        
      // First try to update, if document doesn't exist, set it
      const userStatsDoc = await userStatsRef.get();
      
      if (userStatsDoc.exists) {
        transaction.update(userStatsRef, {
          // Update quiz stats
          totalScore: FieldValue.increment(score),
          quizzesTaken: FieldValue.increment(1),
          totalPlayTime: FieldValue.increment(
            (validatedData.completedAt - validatedData.startedAt) / 1000
          ),
          // Update or set highest score if this one is higher
          highestScore: FieldValue.increment(0), // Will be updated conditionally after transaction
        });
      } else {
        transaction.set(userStatsRef, {
          totalScore: score,
          quizzesTaken: 1,
          highestScore: score,
          totalPlayTime: (validatedData.completedAt - validatedData.startedAt) / 1000,
          averageScore: score,
        });
      }
      
      // Update quiz document with play statistics
      transaction.update(quizRef, {
        timesPlayed: FieldValue.increment(1),
        totalScore: FieldValue.increment(score),
      });
    });
    
    // Update cache for these paths
    revalidatePath(`/quizzes/${validatedData.quizId}`);
    revalidatePath(`/profile/${userId}`);
    
    // Redirect to the results page
    return { success: true, score, maxPossibleScore, xpEarned, coinsEarned };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return { success: false, error: 'Failed to submit quiz' };
  }
}

/**
 * Gets the quiz designated for the current day
 * This function determines which quiz should be shown as the "daily quiz"
 * based on the current date.
 */
export async function getDailyQuiz() {
  try {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // Get Firestore instance
    const db = adminDb;
    
    // First check if there's a designated daily quiz for today
    const dailyQuizRef = db.collection('daily_quizzes').doc(dateString);
    const dailyQuizDoc = await dailyQuizRef.get();
    
    if (dailyQuizDoc.exists) {
      const dailyQuizData = dailyQuizDoc.data();
      if (dailyQuizData && dailyQuizData.quizId) {
        // Get the actual quiz document
        const quizRef = db.collection(COLLECTIONS.QUIZZES).doc(dailyQuizData.quizId);
        const quizDoc = await quizRef.get();
        
        if (quizDoc.exists) {
          const quizData = quizDoc.data();
          return {
            id: quizDoc.id,
            ...quizData,
            isDailyQuiz: true,
            dailyQuizDate: dateString
          };
        }
      }
    }
    
    // If no designated daily quiz, use a deterministic algorithm to select one
    // This ensures the same quiz is shown to all users on the same day
    
    // Get all active quizzes
    const quizzesRef = db.collection(COLLECTIONS.QUIZZES)
      .where('isActive', '==', true);
    
    const quizzesSnapshot = await quizzesRef.get();
    
    if (quizzesSnapshot.empty) {
      return null;
    }
    
    // Use the date as a seed to select a quiz
    // This ensures the same quiz is selected for all users on the same day
    const quizzes = quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Simple hash function to convert date string to a number
    const dateHash = dateString.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Use the hash to select a quiz
    const selectedIndex = dateHash % quizzes.length;
    const selectedQuiz = quizzes[selectedIndex];
    
    return {
      ...selectedQuiz,
      isDailyQuiz: true,
      dailyQuizDate: dateString
    };
  } catch (error) {
    console.error('Error getting daily quiz:', error);
    throw new Error('Failed to get daily quiz');
  }
} 