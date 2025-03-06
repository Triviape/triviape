/**
 * Service for quiz analytics and tracking
 */

import { 
  doc,
  updateDoc,
  increment,
  writeBatch,
  serverTimestamp,
  collection
} from 'firebase/firestore';
import { getFirestoreDb } from '../../firebase';
import { COLLECTIONS, QuizAttempt, QuizServiceErrorType } from './types';
import { createQuizError } from './errorHandler';
import { FirebaseError } from 'firebase/app';
import { quizAttemptSchema } from '../../validation/quizSchemas';
import { validateOrThrow } from '../../validation/utils';
import { z } from 'zod';

// Schema for question analytics update
const questionAnalyticsSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  wasCorrect: z.boolean(),
  answerTime: z.number().min(0, 'Answer time must be a positive number'),
  wasSkipped: z.boolean()
});

/**
 * Update question analytics after a user answers a question
 * @param questionId Question ID
 * @param wasCorrect Whether the answer was correct
 * @param answerTime Time taken to answer in seconds
 * @param wasSkipped Whether the question was skipped
 */
export async function updateQuestionAnalytics(
  questionId: string,
  wasCorrect: boolean,
  answerTime: number,
  wasSkipped: boolean
): Promise<void> {
  try {
    // Validate input data
    validateOrThrow(questionAnalyticsSchema, {
      questionId,
      wasCorrect,
      answerTime,
      wasSkipped
    });
    
    const db = getFirestoreDb();
    const questionDoc = doc(db, COLLECTIONS.QUESTIONS, questionId);
    
    const updates: Record<string, any> = {
      'analytics.totalAttempts': increment(1),
      'analytics.lastAttemptAt': serverTimestamp()
    };
    
    if (wasCorrect) {
      updates['analytics.correctAttempts'] = increment(1);
    }
    
    if (wasSkipped) {
      updates['analytics.skippedCount'] = increment(1);
    } else {
      // Only update time stats if not skipped
      updates['analytics.totalAnswerTime'] = increment(answerTime);
      
      // For calculating average later
      if (!wasSkipped) {
        updates['analytics.answeredCount'] = increment(1);
      }
    }
    
    await updateDoc(questionDoc, updates);
  } catch (error) {
    throw createQuizError(
      'Failed to update question analytics',
      QuizServiceErrorType.UPDATE_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Record a quiz attempt
 * @param attempt Quiz attempt data
 * @returns ID of the created attempt document
 */
export async function recordQuizAttempt(attempt: QuizAttempt): Promise<string> {
  try {
    // Validate attempt data
    validateOrThrow(quizAttemptSchema, attempt);
    
    const db = getFirestoreDb();
    const batch = writeBatch(db);
    
    // Create the attempt document
    const attemptsCollection = collection(db, COLLECTIONS.QUIZ_ATTEMPTS);
    const attemptRef = doc(attemptsCollection);
    
    // Format the attempt data for Firestore
    const attemptData = {
      userId: attempt.userId,
      quizId: attempt.quizId,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt || null,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      answers: attempt.answers,
      createdAt: serverTimestamp()
    };
    
    batch.set(attemptRef, attemptData);
    
    // Update quiz analytics
    const quizDoc = doc(db, COLLECTIONS.QUIZZES, attempt.quizId);
    batch.update(quizDoc, {
      'analytics.totalAttempts': increment(1),
      'analytics.totalCompletions': increment(attempt.completedAt ? 1 : 0),
      'analytics.averageScore': increment(attempt.score / attempt.totalQuestions),
      'analytics.lastAttemptAt': serverTimestamp()
    });
    
    // Commit the batch
    await batch.commit();
    
    return attemptRef.id;
  } catch (error) {
    throw createQuizError(
      'Failed to record quiz attempt',
      QuizServiceErrorType.CREATE_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
} 