'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
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

// Import FieldValue directly from firebase-admin/firestore
import { FieldValue, type Query } from 'firebase-admin/firestore';
import type { QuizCategory, Quiz } from '@/app/types/quiz';

/**
 * Validate and get the current user ID from the session
 */
async function getCurrentUserId(): Promise<string> {
  // Prefer NextAuth session (primary auth source)
  const session = await auth();
  const nextAuthUserId = session?.user?.id || session?.user?.uid;
  if (nextAuthUserId) return String(nextAuthUserId);

  // Backward-compatible fallback to Firebase Admin session cookie
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) {
    throw new Error('Not authenticated');
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw new Error('Not authenticated');
  }
}

// Schema for submitting a quiz attempt (kept internal to this server action file)
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

const MAX_QUESTIONS_PER_ATTEMPT = 50;

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Submit a quiz attempt
 * This is a server action that handles quiz submission securely
 */
export async function submitQuizAttempt(formData: FormData) {
  // Get and validate the current user
  const userId = await getCurrentUserId();
  
  // Parse form data
  const questionSequenceRaw = formData.get('questionSequence');
  const answersRaw = formData.get('answers');
  if (typeof questionSequenceRaw !== 'string' || typeof answersRaw !== 'string') {
    throw new Error('Invalid quiz submission payload');
  }

  let parsedQuestionSequence: unknown;
  let parsedAnswers: unknown;
  try {
    parsedQuestionSequence = JSON.parse(questionSequenceRaw);
    parsedAnswers = JSON.parse(answersRaw);
  } catch {
    throw new Error('Invalid quiz submission payload');
  }

  const rawData = {
    quizId: formData.get('quizId'),
    startedAt: Number(formData.get('startedAt')),
    completedAt: Number(formData.get('completedAt')),
    questionSequence: parsedQuestionSequence,
    answers: parsedAnswers,
  };
  
  // Validate the data
  const validatedData = QuizAttemptSchema.parse(rawData);
  if (
    validatedData.questionSequence.length === 0 ||
    validatedData.questionSequence.length > MAX_QUESTIONS_PER_ATTEMPT
  ) {
    throw new Error('Invalid number of questions in quiz attempt');
  }

  if (validatedData.answers.length !== validatedData.questionSequence.length) {
    throw new Error('Answer count does not match question count');
  }

  if (!Number.isFinite(validatedData.startedAt) || !Number.isFinite(validatedData.completedAt)) {
    throw new Error('Invalid quiz timing data');
  }

  if (validatedData.completedAt < validatedData.startedAt) {
    throw new Error('Quiz completion time is invalid');
  }
  
  try {
    // Get the quiz
    const quizRef = adminDb.collection(COLLECTIONS.QUIZZES).doc(validatedData.quizId);
    const quizDoc = await quizRef.get();
    
    if (!quizDoc.exists) {
      throw new Error('Quiz not found');
    }
    
    const quiz = quizDoc.data()!;
    const quizQuestionIds = Array.isArray(quiz.questionIds) ? quiz.questionIds : [];

    if (quizQuestionIds.length > 0) {
      const quizQuestionSet = new Set(quizQuestionIds);
      const hasUnexpectedId = validatedData.questionSequence.some(
        (questionId) => !quizQuestionSet.has(questionId)
      );

      if (hasUnexpectedId || validatedData.questionSequence.length > quizQuestionIds.length) {
        throw new Error('Quiz questions do not match quiz configuration');
      }
    }
    
    // Get all questions for scoring
    const questionIds = validatedData.questionSequence;
    const questions = new Map<string, Record<string, any>>();

    for (const chunk of chunkArray(questionIds, 10)) {
      const questionsSnapshot = await adminDb
        .collection(COLLECTIONS.QUESTIONS)
        .where('id', 'in', chunk)
        .get();

      questionsSnapshot.forEach((doc) => {
        questions.set(doc.id, doc.data());
      });
    }

    if (questions.size === 0) {
      throw new Error('Quiz questions could not be loaded');
    }
    
    // Score the quiz
    let score = 0;
    let maxPossibleScore = 0;
    
    const scoredAnswers = validatedData.answers.map(answer => {
      const question = questions.get(answer.questionId);
      
      if (!question) {
        return { ...answer, wasCorrect: false, pointsEarned: 0 };
      }
      
      const questionPoints = typeof question.points === 'number' ? question.points : 0;
      maxPossibleScore += questionPoints;
      
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
      
      const pointsEarned = isCorrect ? questionPoints : 0;
      score += pointsEarned;
      
      return { ...answer, wasCorrect: isCorrect, pointsEarned };
    });

    if (maxPossibleScore <= 0) {
      throw new Error('Quiz scoring data is invalid');
    }
    
    // Calculate rewards
    const xpMultiplier = 1 + (score / maxPossibleScore) * 0.5; // Bonus multiplier based on score
    const xpEarned = Math.round(quiz.baseXP * xpMultiplier);
    const coinsEarned = Math.round(quiz.baseCoins * xpMultiplier);
    
    // Create the quiz attempt record
    const attemptData = {
      userId,
      quizId: validatedData.quizId,
      startedAt: new Date(validatedData.startedAt),
      completedAt: new Date(validatedData.completedAt),
      questionSequence: validatedData.questionSequence,
      answers: scoredAnswers,
      score: Math.round((score / maxPossibleScore) * 100), // Percentage score
      maxPossibleScore,
      totalQuestions: questionIds.length,
      correctAnswers: scoredAnswers.filter(a => a.wasCorrect).length,
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
        .collection(COLLECTIONS.QUIZ_ATTEMPTS)
        .doc();
        
      transaction.set(attemptRef, {
        ...attemptData,
        id: attemptRef.id,
        createdAt: FieldValue.serverTimestamp(),
      });
      
      // Update user profile (add XP and coins)
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (userDoc.exists) {
        transaction.update(userRef, {
          xp: FieldValue.increment(xpEarned),
          coins: FieldValue.increment(coinsEarned),
          quizzesTaken: FieldValue.increment(1),
          questionsAnswered: FieldValue.increment(validatedData.answers.length),
          correctAnswers: FieldValue.increment(
            scoredAnswers.filter(a => a.wasCorrect).length
          ),
          lastActive: FieldValue.serverTimestamp(),
        });
      }
      
      // Update quiz completion status
      const quizStatusRef = adminDb
        .collection('users')
        .doc(userId)
        .collection('quiz_status')
        .doc(validatedData.quizId);
        
      transaction.set(quizStatusRef, {
        completed: true,
        lastCompletedAt: FieldValue.serverTimestamp(),
        score: Math.round((score / maxPossibleScore) * 100),
        attempts: FieldValue.increment(1)
      }, { merge: true });
      
      // Add to leaderboard - we'll create a weekly and all-time leaderboard
      const weekStart = getStartOfWeek(new Date());
      const weeklyLeaderboardRef = adminDb
        .collection('leaderboards')
        .doc(`weekly_${weekStart.toISOString().substring(0, 10)}`);
        
      // Add to user's weekly score
      transaction.set(weeklyLeaderboardRef, {
        [`users.${userId}`]: {
          score: FieldValue.increment(score),
          name: userDoc.exists ? (userDoc.data()?.displayName ?? 'Anonymous') : 'Anonymous',
          photoURL: userDoc.exists ? (userDoc.data()?.photoURL ?? null) : null,
          quizCount: FieldValue.increment(1)
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      
      // Update all-time leaderboard
      const allTimeLeaderboardRef = adminDb
        .collection('leaderboards')
        .doc('all_time');
        
      transaction.set(allTimeLeaderboardRef, {
        [`users.${userId}`]: {
          score: FieldValue.increment(score),
          name: userDoc.exists ? (userDoc.data()?.displayName ?? 'Anonymous') : 'Anonymous',
          photoURL: userDoc.exists ? (userDoc.data()?.photoURL ?? null) : null,
          quizCount: FieldValue.increment(1)
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });
    
    // Return the results object
    return {
      id: validatedData.quizId,
      score: Math.round((score / maxPossibleScore) * 100),
      totalQuestions: questionIds.length,
      correctAnswers: scoredAnswers.filter(a => a.wasCorrect).length,
      xpEarned,
      coinsEarned,
    };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    throw error;
  }
}

/**
 * Server-side get categories (uses Firebase Admin).
 * Use in server components and during static generation instead of quizService.getCategories().
 */
export async function getCategoriesForServer(): Promise<QuizCategory[]> {
  const snapshot = await adminDb
    .collection(COLLECTIONS.CATEGORIES)
    .orderBy('name', 'asc')
    .get();
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name ?? '',
      description: data.description,
      icon: data.iconUrl ?? data.icon,
    };
  });
}

/**
 * Server-side get quiz by ID (uses Firebase Admin).
 * Use in server components and during static generation instead of quizService.getQuizById().
 */
export async function getQuizByIdForServer(quizId: string): Promise<Quiz | null> {
  const docRef = await adminDb.collection(COLLECTIONS.QUIZZES).doc(quizId).get();
  if (!docRef.exists) return null;
  const data = docRef.data()!;
  return {
    id: docRef.id,
    ...data,
    description: data.description ?? '',
    timeLimit: data.timeLimit ?? 0,
    questionIds: data.questionIds ?? [],
    isActive: data.isActive ?? true,
    createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt),
  } as Quiz;
}

/**
 * Server-side get quizzes for API route (uses Firebase Admin).
 * Returns paginated quizzes with optional category/difficulty filters.
 */
export async function getQuizzesForApi(options: {
  categoryId?: string;
  difficulty?: string;
  pageSize?: number;
}): Promise<{ items: unknown[]; hasMore: boolean }> {
  const { categoryId, difficulty, pageSize = 10 } = options;
  const db = adminDb;
  let ref: Query = db.collection(COLLECTIONS.QUIZZES);
  if (categoryId) ref = ref.where('categoryId', '==', categoryId);
  if (difficulty) ref = ref.where('difficulty', '==', difficulty);
  const snapshot = await ref.orderBy('createdAt', 'desc').limit(pageSize + 1).get();
  const docs = snapshot.docs.slice(0, pageSize);
  const items = docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      description: data.description || '',
      categoryId: data.categoryId,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit || 0,
      questionIds: data.questionIds || [],
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      isDailyQuiz: data.isDailyQuiz,
      dailyQuizDate: data.dailyQuizDate,
      createdBy: data.createdBy,
      tags: data.tags,
      imageUrl: data.imageUrl,
      estimatedDuration: data.estimatedDuration,
      maxAttempts: data.maxAttempts,
      totalAttempts: data.totalAttempts,
      averageScore: data.averageScore,
      completionRate: data.completionRate,
    };
  });
  return {
    items,
    hasMore: snapshot.docs.length > pageSize,
  };
}

// Helper function to get the start of the week (Sunday)
function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay()); // Go to the start of the week (Sunday)
  result.setHours(0, 0, 0, 0); // Set to the start of the day
  return result;
}

const DAILY_QUIZ_CACHE_MS = 5 * 60 * 1000;
let cachedDailyQuiz: { date: string; data: Record<string, any> } | null = null;
let cachedDailyQuizAt = 0;

/**
 * Gets the quiz designated for the current day
 * This function determines which quiz should be shown as the "daily quiz"
 * based on the current date.
 */
export async function getDailyQuiz() {
  try {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    if (
      cachedDailyQuiz &&
      cachedDailyQuiz.date === dateString &&
      Date.now() - cachedDailyQuizAt < DAILY_QUIZ_CACHE_MS
    ) {
      return cachedDailyQuiz.data;
    }
    
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
          const result = {
            id: quizDoc.id,
            ...quizData,
            isDailyQuiz: true,
            dailyQuizDate: dateString
          };
          cachedDailyQuiz = { date: dateString, data: result };
          cachedDailyQuizAt = Date.now();
          return result;
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
    const result = {
      ...selectedQuiz,
      isDailyQuiz: true,
      dailyQuizDate: dateString
    };

    if (selectedQuiz?.id) {
      await db.collection('daily_quizzes').doc(dateString).set(
        {
          quizId: selectedQuiz.id,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    cachedDailyQuiz = { date: dateString, data: result };
    cachedDailyQuizAt = Date.now();
    return result;
  } catch (error) {
    console.error('Error getting daily quiz:', error);
    throw new Error('Failed to get daily quiz');
  }
}
