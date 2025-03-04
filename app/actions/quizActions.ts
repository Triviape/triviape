'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { adminAuth } from '@/app/lib/firebaseAdmin';

// Collection names for Firestore
const COLLECTIONS = {
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  CATEGORIES: 'categories',
  QUIZ_ATTEMPTS: 'quiz_attempts'
};

/**
 * Validate and get the current user ID from the session
 */
async function getCurrentUserId(): Promise<string> {
  const sessionCookie = cookies().get('session')?.value;
  
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
        .filter(a => a.isCorrect)
        .map(a => a.id);
      
      const isCorrect = 
        correctAnswerIds.length === answer.selectedAnswerIds.length &&
        correctAnswerIds.every(id => answer.selectedAnswerIds.includes(id));
      
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
        xp: adminDb.FieldValue.increment(xpEarned),
        coins: adminDb.FieldValue.increment(coinsEarned),
        quizzesTaken: adminDb.FieldValue.increment(1),
        questionsAnswered: adminDb.FieldValue.increment(validatedData.answers.length),
        correctAnswers: adminDb.FieldValue.increment(
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
          totalScore: adminDb.FieldValue.increment(score),
          quizzesTaken: adminDb.FieldValue.increment(1),
          totalPlayTime: adminDb.FieldValue.increment(
            (validatedData.completedAt - validatedData.startedAt) / 1000
          ),
          // Update or set highest score if this one is higher
          highestScore: adminDb.FieldValue.increment(0), // Will be updated conditionally after transaction
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
        timesPlayed: adminDb.FieldValue.increment(1),
        totalScore: adminDb.FieldValue.increment(score),
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