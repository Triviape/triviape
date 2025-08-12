/**
 * Service for fetching quizzes and related data
 */

import { 
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  documentId,
  CollectionReference,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
  startAfter
} from 'firebase/firestore';
import { getFirestoreDb } from '../../firebase';
import { 
  Quiz, 
  Question, 
  QuizCategory, 
  DifficultyLevel,
} from '../../../types/quiz';
import { 
  COLLECTIONS, 
  QuizServiceErrorType,
  QuizServiceError
} from './types';
import { createQuizError, logQuizServiceError } from './errorHandler';
import { FirebaseError } from 'firebase/app';

/**
 * Helper function to convert Firestore timestamps to Date objects
 */
const convertTimestamps = <T extends Record<string, any>>(data: T): T => {
  const result = { ...data };
  for (const key in result) {
    if (result[key] && typeof result[key].toDate === 'function') {
      result[key] = result[key].toDate();
    }
  }
  return result;
};

/**
 * Creates a QuizServiceError object from a string message
 */
const createErrorFromString = (message: string, type: QuizServiceErrorType, code?: string): QuizServiceError => {
  return {
    name: 'QuizServiceError',
    message,
    type,
    code,
    stack: new Error().stack
  };
};

/**
 * Helper function to handle errors in a consistent way
 */
function handleServiceError(errorMessage: string, error: unknown): never {
  const firebaseError = error instanceof FirebaseError ? error : undefined;
  const errorObject = error instanceof Error ? error : new Error(String(error));
  
  const quizError = createQuizError(
    errorMessage,
    QuizServiceErrorType.FETCH_ERROR,
    firebaseError?.code,
    errorObject
  );
  
  logQuizServiceError(quizError);
  throw quizError;
}

/**
 * Interface for quiz fetch options
 */
interface GetQuizzesOptions {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  startAfterQuiz?: Quiz;
  pageSize?: number;
}

/**
 * Interface for paginated quiz results
 */
interface PaginatedQuizResult {
  items: Quiz[];
  hasMore: boolean;
  lastDoc: Quiz | null;
}

/**
 * Fetches quizzes with optional filtering and pagination
 */
export async function getQuizzes(options: GetQuizzesOptions = {}): Promise<PaginatedQuizResult> {
  try {
    const db = getFirestoreDb();
    const quizzesRef = collection(db, COLLECTIONS.QUIZZES);
    
    // Start building the query
    let quizzesQuery: Query<DocumentData> = quizzesRef;
    
    // Apply category filter if provided
    if (options.categoryId) {
      quizzesQuery = query(quizzesQuery, where('categoryId', '==', options.categoryId));
    }
    
    // Apply difficulty filter if provided
    if (options.difficulty) {
      quizzesQuery = query(quizzesQuery, where('difficulty', '==', options.difficulty));
    }
    
    // Apply sorting by creation date (newest first)
    quizzesQuery = query(quizzesQuery, orderBy('createdAt', 'desc'));
    
    // Apply pagination if a starting document is provided
    if (options.startAfterQuiz) {
      const startDoc = await getDoc(doc(db, COLLECTIONS.QUIZZES, options.startAfterQuiz.id));
      if (startDoc.exists()) {
        quizzesQuery = query(quizzesQuery, startAfter(startDoc));
      }
    }
    
    // Apply limit
    const pageSize = options.pageSize || 10;
    quizzesQuery = query(quizzesQuery, limit(pageSize + 1)); // Fetch one extra to check if there are more
    
    // Execute the query
    const querySnapshot = await getDocs(quizzesQuery);
    
    // Process the results
    const quizzes: Quiz[] = [];
    let hasMore = false;
    
    // If we got more items than the page size, there are more items available
    if (querySnapshot.docs.length > pageSize) {
      hasMore = true;
      querySnapshot.docs.pop(); // Remove the extra item
    }
    
    // Convert the documents to Quiz objects
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.createdAt?.toDate?.() || new Date();
      
      quizzes.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        difficulty: data.difficulty,
        questionIds: data.questionIds || [],
        shuffleQuestions: data.shuffleQuestions || false,
        estimatedDuration: data.estimatedDuration || 0,
        baseXP: data.baseXP || 0,
        baseCoins: data.baseCoins || 0,
        createdAt: timestamp.getTime(),
        updatedAt: (data.updatedAt?.toDate?.() || timestamp).getTime(),
        isActive: data.isActive ?? true,
        timesPlayed: data.timesPlayed || 0,
        averageScore: data.averageScore || 0,
        completionRate: data.completionRate || 0,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore,
        coverImage: data.imageUrl
      });
    });
    
    return {
      items: quizzes,
      hasMore,
      lastDoc: quizzes.length > 0 ? quizzes[quizzes.length - 1] : null
    };
  } catch (error) {
    handleServiceError('Failed to fetch quizzes', error);
  }
}

/**
 * Fetches a quiz by its ID
 */
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const db = getFirestoreDb();
    const quizRef = doc(db, COLLECTIONS.QUIZZES, quizId);
    const quizSnap = await getDoc(quizRef);
    
    if (!quizSnap.exists()) {
      return null;
    }
    
    const data = quizSnap.data();
    const timestamp = data.createdAt?.toDate?.() || new Date();
    
    return {
      id: quizSnap.id,
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      difficulty: data.difficulty,
      questionIds: data.questionIds || [],
      shuffleQuestions: data.shuffleQuestions || false,
      estimatedDuration: data.estimatedDuration || 0,
      baseXP: data.baseXP || 0,
      baseCoins: data.baseCoins || 0,
      createdAt: timestamp.getTime(),
      updatedAt: (data.updatedAt?.toDate?.() || timestamp).getTime(),
      isActive: data.isActive ?? true,
      timesPlayed: data.timesPlayed || 0,
      averageScore: data.averageScore || 0,
      completionRate: data.completionRate || 0,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
      coverImage: data.imageUrl
    };
  } catch (error) {
    handleServiceError(`Failed to fetch quiz with ID: ${quizId}`, error);
  }
}

/**
 * Fetches questions by their IDs
 */
export async function getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
  if (questionIds.length === 0) {
    return [];
  }
  
  try {
    const db = getFirestoreDb();
    const questionsRef = collection(db, COLLECTIONS.QUESTIONS);
    
    // Firestore "in" queries are limited to 10 items, so we need to batch
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < questionIds.length; i += batchSize) {
      const batch = questionIds.slice(i, i + batchSize);
      const batchQuery = query(
        questionsRef,
        where(documentId(), 'in', batch)
      );
      batches.push(getDocs(batchQuery));
    }
    
    const results = await Promise.all(batches);
    const questions: Question[] = [];
    
    results.forEach(querySnapshot => {
      querySnapshot.forEach(document => {
        const data = document.data();
        const timestamp = data.createdAt?.toDate?.() || new Date();
        
        // Map the Firestore data to the Question type
        questions.push({
          id: document.id,
          text: data.text,
          type: data.type,
          difficulty: data.difficulty,
          categoryId: data.categoryId || (data.categoryIds && data.categoryIds[0]) || '',
          answers: data.options ? data.options.map((option: string, index: number) => ({
            id: `option-${index}`,
            text: option,
            isCorrect: index === data.correctOptionIndex
          })) : [],
          points: data.points || 10,
          timeLimit: data.timeLimit,
          hint: data.hint,
          timesAnswered: data.timesAnswered || 0,
          timesAnsweredCorrectly: data.timesAnsweredCorrectly || 0,
          averageAnswerTime: data.averageAnswerTime || 0,
          skipRate: data.skipRate || 0,
          tags: data.tags || [],
          createdAt: timestamp.getTime(),
          updatedAt: (data.updatedAt?.toDate?.() || timestamp).getTime(),
          isActive: data.isActive ?? true
        });
      });
    });
    
    return questions;
  } catch (error) {
    handleServiceError(`Failed to fetch questions`, error);
  }
}

/**
 * Fetches all quiz categories
 */
export async function getCategories(): Promise<QuizCategory[]> {
  try {
    const db = getFirestoreDb();
    const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
    const categoriesQuery = query(categoriesRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(categoriesQuery);
    
    const categories: QuizCategory[] = [];
    
    querySnapshot.forEach(document => {
      const data = document.data();
      const timestamp = data.createdAt?.toDate?.() || new Date();
      
      categories.push({
        id: document.id,
        name: data.name,
        description: data.description,
        icon: data.iconUrl,
        parentCategoryId: data.parentCategoryId
      });
    });
    
    return categories;
  } catch (error) {
    handleServiceError(`Failed to fetch categories`, error);
  }
} 