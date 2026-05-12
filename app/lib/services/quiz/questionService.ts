import {
  collection,
  getDocs,
  query,
  where,
  doc,
  DocumentData,
  QueryDocumentSnapshot,
  updateDoc,
  increment,
  serverTimestamp,
  documentId
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Question } from "@/app/types/question";
import { handleServiceError } from "@/app/lib/utils/errorHandling";

/**
 * Maps Firestore document data to Question type
 * @param doc Firestore document snapshot
 * @returns Question object with properly mapped fields
 */
export function mapFirestoreToQuestion(doc: QueryDocumentSnapshot<DocumentData>): Question {
  const data = doc.data();
  const timestamp = data.createdAt?.toDate?.() || new Date();
  
  return {
    id: doc.id,
    text: data.text,
    difficulty: data.difficulty,
    categoryId: data.categoryId || (data.categoryIds && data.categoryIds[0]) || '',
    answers: data.options ? data.options.map((option: string, index: number) => ({
      id: `option-${index}`,
      text: option,
      isCorrect: index === data.correctOptionIndex
    })) : [],
    createdAt: timestamp,
    updatedAt: data.updatedAt?.toDate?.() || timestamp,
    imageUrl: data.imageUrl
  };
}

/**
 * Fetches questions by their IDs, optimized for both small and large batches
 * @param questionIds Array of question IDs to fetch
 * @returns Array of Question objects in the same order as the input IDs
 */
export async function getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
  try {
    if (!questionIds.length) return [];
    
    const questionsRef = collection(db, "questions");
    const questions: Question[] = [];
    const idToIndexMap = new Map<string, number>();
    
    // Create a map of ID to its original position in the input array
    questionIds.forEach((id, index) => {
      idToIndexMap.set(id, index);
    });
    
    // Optimize for small batches (10 or fewer IDs)
    if (questionIds.length <= 10) {
      const singleQuery = query(questionsRef, where(documentId(), 'in', questionIds));
      const result = await getDocs(singleQuery);
      
      result.forEach(doc => {
        questions.push(mapFirestoreToQuestion(doc));
      });
    } else {
      // For larger sets, process in batches of 10
      const batchSize = 10;
      
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        const batchQuery = query(questionsRef, where(documentId(), 'in', batch));
        const result = await getDocs(batchQuery);
        
        result.forEach(doc => {
          questions.push(mapFirestoreToQuestion(doc));
        });
      }
    }
    
    // Sort questions to match the original order of IDs
    questions.sort((a, b) => {
      const indexA = idToIndexMap.get(a.id) ?? 0;
      const indexB = idToIndexMap.get(b.id) ?? 0;
      return indexA - indexB;
    });
    
    return questions;
  } catch (error) {
    return handleServiceError(error, "Failed to fetch questions by IDs");
  }
}

/**
 * Gets questions by category ID
 * @param categoryId Category ID to filter questions by
 * @param limit Optional limit on number of questions to return
 * @returns Array of Question objects
 */
export async function getQuestionsByCategory(categoryId: string, limit?: number): Promise<Question[]> {
  try {
    const questionsRef = collection(db, "questions");
    let questionsQuery = query(
      questionsRef,
      where("categoryId", "==", categoryId),
      where("isActive", "==", true)
    );
    
    const result = await getDocs(questionsQuery);
    const questions = result.docs.map(doc => mapFirestoreToQuestion(doc));
    
    // Apply limit if specified
    if (limit && questions.length > limit) {
      return questions.slice(0, limit);
    }
    
    return questions;
  } catch (error) {
    return handleServiceError(error, "Failed to fetch questions by category");
  }
}

/**
 * Gets questions by difficulty level
 * @param difficulty Difficulty level to filter questions by
 * @param limit Optional limit on number of questions to return
 * @returns Array of Question objects
 */
export async function getQuestionsByDifficulty(difficulty: string, limit?: number): Promise<Question[]> {
  try {
    const questionsRef = collection(db, "questions");
    let questionsQuery = query(
      questionsRef,
      where("difficulty", "==", difficulty),
      where("isActive", "==", true)
    );
    
    const result = await getDocs(questionsQuery);
    const questions = result.docs.map(doc => mapFirestoreToQuestion(doc));
    
    // Apply limit if specified
    if (limit && questions.length > limit) {
      return questions.slice(0, limit);
    }
    
    return questions;
  } catch (error) {
    return handleServiceError(error, "Failed to fetch questions by difficulty");
  }
}

/**
 * Interface for question analytics update data
 */
interface QuestionAnalyticsUpdate {
  questionId: string;
  answerTime: number;  // Time in milliseconds
  wasCorrect: boolean;
  wasSkipped: boolean;
}

/**
 * Interface for Firestore document reference
 */
interface FirestoreDocRef {
  id: string;
  path: string;
}

/**
 * Updates question analytics with retry logic for reliability
 * @param params Question analytics update parameters
 * @param maxRetries Maximum number of retry attempts
 */
export async function updateQuestionAnalytics(
  params: QuestionAnalyticsUpdate, 
  maxRetries = 3
): Promise<void> {
  try {
    const questionRef = doc(db, "questions", params.questionId);
    
    const updates: Record<string, unknown> = {
      timesAnswered: increment(1),
      averageAnswerTime: increment(params.answerTime),
      updatedAt: serverTimestamp()
    };
    
    if (params.wasCorrect) {
      updates.timesAnsweredCorrectly = increment(1);
    }
    
    if (params.wasSkipped) {
      updates.skipRate = increment(1);
    }
    
    await updateWithRetry(questionRef, updates, maxRetries);
    
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`Updated analytics for question ${params.questionId}:`, {
        answerTime: params.answerTime,
        wasCorrect: params.wasCorrect,
        wasSkipped: params.wasSkipped
      });
    }
  } catch (error) {
    console.error('Failed to update question analytics:', error);
    // Don't throw here as analytics updates shouldn't break the main flow
  }
}

/**
 * Updates a Firestore document with retry logic
 * @param docRef Firestore document reference
 * @param updates Updates to apply
 * @param retries Number of retries remaining
 */
async function updateWithRetry(
  docRef: ReturnType<typeof doc>, 
  updates: Record<string, unknown>, 
  retries = 3
): Promise<void> {
  try {
    await updateDoc(docRef, updates as any);
  } catch (error: any) {
    if (retries > 0 && (error.code === 'unavailable' || error.code === 'deadline-exceeded')) {
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, 3 - retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return updateWithRetry(docRef, updates, retries - 1);
    }
    
    throw error;
  }
} 
