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
  startAfter,
  Timestamp,
  documentId,
  CollectionReference,
  Query,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getFirestoreDb } from '../../firebase';
import { 
  Quiz, 
  Question, 
  QuizCategory, 
  DifficultyLevel,
  QuestionSummary,
  QuestionType
} from '../../../types/quiz';
import { 
  COLLECTIONS, 
  PaginationResult, 
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
 * Fetches a paginated list of quizzes with optional filters
 */
export async function getQuizzes(
  options: {
    categoryId?: string;
    difficulty?: DifficultyLevel;
    pageSize?: number;
    startAfterQuiz?: Quiz;
  } = {}
): Promise<PaginationResult<Quiz>> {
  try {
    const db = getFirestoreDb();
    const quizzesRef = collection(db, COLLECTIONS.QUIZZES);
    
    // Build the query
    let quizzesQuery: Query<DocumentData> = query(quizzesRef);
    
    // Apply filters if provided
    if (options.categoryId) {
      quizzesQuery = query(quizzesQuery, where('categoryId', '==', options.categoryId));
    }
    
    if (options.difficulty) {
      quizzesQuery = query(quizzesQuery, where('difficulty', '==', options.difficulty));
    }
    
    // Apply sorting
    quizzesQuery = query(quizzesQuery, orderBy('createdAt', 'desc'));
    
    // Apply pagination
    if (options.startAfterQuiz) {
      quizzesQuery = query(quizzesQuery, startAfter(options.startAfterQuiz));
    }
    
    // Fetch one more than requested to determine if there are more results
    quizzesQuery = query(quizzesQuery, limit(options.pageSize || 10 + 1));
    
    // Execute the query
    const querySnapshot = await getDocs(quizzesQuery);
    
    const quizzes: Quiz[] = [];
    let lastDoc = null;
    
    querySnapshot.forEach((document) => {
      // Only process up to pageSize documents if we're within the page size
      if (quizzes.length < (options.pageSize || 10)) {
        const data = document.data();
        const timestamp = data.createdAt?.toDate?.() || new Date();
        
        // Convert to Quiz object with proper type mapping
        quizzes.push({
          id: document.id,
          title: data.title,
          description: data.description,
          categoryIds: [data.categoryId], // Convert to array for type compatibility
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
      }
      
      // Keep track of the last document for pagination
      lastDoc = document;
    });
    
    // Determine if there are more results
    const hasMore = querySnapshot.size > (options.pageSize || 10);
    
    return {
      items: quizzes,
      hasMore,
      lastDoc: hasMore ? lastDoc : null
    };
  } catch (error) {
    handleServiceError(`Failed to fetch quizzes`, error);
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
      categoryIds: [data.categoryId], // Convert to array for type compatibility
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
          type: data.type as QuestionType,
          difficulty: data.difficulty as DifficultyLevel,
          categoryIds: [data.categoryId], // Convert to array for type compatibility
          answers: data.options?.map((option: any, index: number) => ({
            id: `option-${index}`,
            text: option,
            isCorrect: index === data.correctOption
          })) || [],
          points: data.points || 1,
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
    
    // Sort questions to match the order of questionIds
    const questionMap = new Map<string, Question>();
    questions.forEach(question => questionMap.set(question.id, question));
    
    return questionIds
      .map(id => questionMap.get(id))
      .filter((question): question is Question => !!question);
  } catch (error) {
    handleServiceError(`Failed to fetch questions with IDs: ${questionIds.join(', ')}`, error);
  }
}

/**
 * Fetches a paginated list of question summaries with optional filters
 */
export async function getQuestionSummaries(
  options: {
    categoryId?: string;
    difficulty?: DifficultyLevel;
    pageSize?: number;
    startAfterQuestion?: QuestionSummary;
  } = {}
): Promise<PaginationResult<QuestionSummary>> {
  try {
    const db = getFirestoreDb();
    const questionsRef = collection(db, COLLECTIONS.QUESTIONS);
    
    // Build the query
    let questionsQuery: Query<DocumentData> = query(questionsRef);
    
    // Apply filters if provided
    if (options.categoryId) {
      questionsQuery = query(questionsQuery, where('categoryId', '==', options.categoryId));
    }
    
    if (options.difficulty) {
      questionsQuery = query(questionsQuery, where('difficulty', '==', options.difficulty));
    }
    
    // Apply sorting
    questionsQuery = query(questionsQuery, orderBy('createdAt', 'desc'));
    
    // Apply pagination
    if (options.startAfterQuestion) {
      questionsQuery = query(questionsQuery, startAfter(options.startAfterQuestion));
    }
    
    // Fetch one more than requested to determine if there are more results
    questionsQuery = query(questionsQuery, limit(options.pageSize || 20 + 1));
    
    // Execute the query
    const querySnapshot = await getDocs(questionsQuery);
    
    const questionSummaries: QuestionSummary[] = [];
    let lastDocument = null;
    
    querySnapshot.forEach((document) => {
      // Only process up to pageSize documents if we're within the page size
      if (questionSummaries.length < (options.pageSize || 20)) {
        const data = document.data();
        questionSummaries.push({
          id: document.id,
          text: data.text,
          type: data.type as QuestionType,
          difficulty: data.difficulty as DifficultyLevel,
          categoryIds: [data.categoryId], // Convert to array for type compatibility
          points: data.points || 1,
          isActive: data.isActive ?? true
        });
      }
      
      // Keep track of the last document for pagination
      lastDocument = document;
    });
    
    // Determine if there are more results
    const hasMore = querySnapshot.size > (options.pageSize || 20);
    
    return {
      items: questionSummaries,
      hasMore,
      lastDoc: hasMore ? lastDocument : null
    };
  } catch (error) {
    handleServiceError(`Failed to fetch question summaries`, error);
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
      categories.push({
        id: document.id,
        name: data.name,
        description: data.description || '',
        icon: data.iconUrl || undefined,
        parentCategoryId: data.parentCategoryId
      });
    });
    
    return categories;
  } catch (error) {
    handleServiceError(`Failed to fetch categories`, error);
  }
} 