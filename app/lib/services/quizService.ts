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
  addDoc,
  updateDoc,
  increment,
  writeBatch,
  CollectionReference,
  Query,
  DocumentData,
  serverTimestamp
} from 'firebase/firestore';
import { db, getFirestoreDb } from '../firebase';
import { 
  Quiz, 
  Question, 
  QuestionSummary, 
  QuizCategory,
  QuestionType,
  DifficultyLevel
} from '@/app/types/quiz';

// Collection names for Firestore
const COLLECTIONS = {
  QUIZZES: 'quizzes',
  QUESTIONS: 'questions',
  CATEGORIES: 'categories',
  QUIZ_ATTEMPTS: 'quiz_attempts'
};

/**
 * Service for handling quiz-related operations with efficient data fetching
 */
export class QuizService {
  /**
   * Fetch a paginated list of quizzes
   * @param categoryId Optional category ID to filter by
   * @param difficulty Optional difficulty level to filter by
   * @param pageSize Number of quizzes to fetch
   * @param lastQuizDoc Last document for pagination
   * @returns Array of quizzes and the last document for pagination
   */
  static async getQuizzes(
    categoryId?: string, 
    difficulty?: DifficultyLevel,
    pageSize = 10,
    lastQuizDoc?: any
  ) {
    try {
      // Start with a base query
      let quizQuery: Query<DocumentData>;
      
      // Create the collection reference
      const quizzesRef = collection(getFirestoreDb(), COLLECTIONS.QUIZZES);
      
      // Build the query based on filters
      if (categoryId && difficulty) {
        quizQuery = query(
          quizzesRef,
          where('categoryId', '==', categoryId),
          where('difficulty', '==', difficulty),
          orderBy('createdAt', 'desc')
        );
      } else if (categoryId) {
        quizQuery = query(
          quizzesRef,
          where('categoryId', '==', categoryId),
          orderBy('createdAt', 'desc')
        );
      } else if (difficulty) {
        quizQuery = query(
          quizzesRef,
          where('difficulty', '==', difficulty),
          orderBy('createdAt', 'desc')
        );
      } else {
        quizQuery = query(
          quizzesRef,
          orderBy('createdAt', 'desc')
        );
      }
      
      // Apply pagination
      if (lastQuizDoc) {
        quizQuery = query(
          quizQuery,
          startAfter(lastQuizDoc),
          limit(pageSize)
        );
      } else {
        quizQuery = query(
          quizQuery,
          limit(pageSize)
        );
      }
      
      // Execute the query
      const quizSnapshot = await getDocs(quizQuery);
      
      // Process the results
      const quizzes: Quiz[] = [];
      quizSnapshot.forEach(doc => {
        const quizData = doc.data();
        quizzes.push({
          id: doc.id,
          ...quizData,
          createdAt: quizData.createdAt?.toDate() || new Date(),
          updatedAt: quizData.updatedAt?.toDate() || new Date()
        } as Quiz);
      });
      
      // Return the quizzes and the last document for pagination
      return {
        quizzes,
        lastDoc: quizSnapshot.docs[quizSnapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }
  
  /**
   * Get a single quiz by ID
   * @param quizId Quiz ID
   * @returns Quiz object or null if not found
   */
  static async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const quizDoc = await getDoc(doc(getFirestoreDb(), COLLECTIONS.QUIZZES, quizId));
      
      if (!quizDoc.exists()) {
        return null;
      }
      
      const quizData = quizDoc.data();
      return {
        id: quizDoc.id,
        ...quizData,
        createdAt: quizData.createdAt?.toDate() || new Date(),
        updatedAt: quizData.updatedAt?.toDate() || new Date()
      } as Quiz;
    } catch (error) {
      console.error(`Error fetching quiz ${quizId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get multiple questions by their IDs
   * @param questionIds Array of question IDs
   * @returns Array of Question objects
   */
  static async getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
    try {
      if (!questionIds.length) {
        return [];
      }
      
      // Firestore has a limit of 10 items in an 'in' query
      // So we need to batch our requests if we have more than 10 IDs
      const questions: Question[] = [];
      const batchSize = 10;
      
      // Process in batches of 10
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        
        const questionsQuery = query(
          collection(getFirestoreDb(), COLLECTIONS.QUESTIONS),
          where(documentId(), 'in', batch)
        );
        
        const questionSnapshot = await getDocs(questionsQuery);
        
        questionSnapshot.forEach(doc => {
          const questionData = doc.data();
          questions.push({
            id: doc.id,
            ...questionData,
            createdAt: questionData.createdAt?.toDate() || new Date(),
            updatedAt: questionData.updatedAt?.toDate() || new Date()
          } as Question);
        });
      }
      
      // Sort questions to match the order of the input IDs
      const orderedQuestions = questionIds.map(id => 
        questions.find(q => q.id === id)
      ).filter(q => q !== undefined) as Question[];
      
      return orderedQuestions;
    } catch (error) {
      console.error('Error fetching questions by IDs:', error);
      throw error;
    }
  }
  
  /**
   * Get a paginated list of question summaries
   * @param categoryId Optional category ID to filter by
   * @param difficulty Optional difficulty level to filter by
   * @param pageSize Number of questions to fetch
   * @param lastDoc Last document for pagination
   * @returns Array of question summaries and the last document for pagination
   */
  static async getQuestionSummaries(
    categoryId?: string,
    difficulty?: DifficultyLevel,
    pageSize = 20,
    lastDoc?: any
  ) {
    try {
      // Start with a base query
      let questionsQuery: Query<DocumentData>;
      
      // Create the collection reference
      const questionsRef = collection(getFirestoreDb(), COLLECTIONS.QUESTIONS);
      
      // Build the query based on filters
      if (categoryId && difficulty) {
        questionsQuery = query(
          questionsRef,
          where('categoryId', '==', categoryId),
          where('difficulty', '==', difficulty),
          orderBy('createdAt', 'desc')
        );
      } else if (categoryId) {
        questionsQuery = query(
          questionsRef,
          where('categoryId', '==', categoryId),
          orderBy('createdAt', 'desc')
        );
      } else if (difficulty) {
        questionsQuery = query(
          questionsRef,
          where('difficulty', '==', difficulty),
          orderBy('createdAt', 'desc')
        );
      } else {
        questionsQuery = query(
          questionsRef,
          orderBy('createdAt', 'desc')
        );
      }
      
      // Apply pagination
      if (lastDoc) {
        questionsQuery = query(
          questionsQuery,
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        questionsQuery = query(
          questionsQuery,
          limit(pageSize)
        );
      }
      
      // Execute the query
      const questionSnapshot = await getDocs(questionsQuery);
      
      // Process the results
      const questionSummaries: QuestionSummary[] = [];
      questionSnapshot.forEach(doc => {
        const questionData = doc.data();
        questionSummaries.push({
          id: doc.id,
          text: questionData.text,
          type: questionData.type,
          difficulty: questionData.difficulty,
          categoryIds: questionData.categoryId ? [questionData.categoryId] : [],
          points: questionData.points || 10,
          isActive: questionData.isActive !== false
        });
      });
      
      // Return the question summaries and the last document for pagination
      return {
        questionSummaries,
        lastDoc: questionSnapshot.docs[questionSnapshot.docs.length - 1] || null
      };
    } catch (error) {
      console.error('Error fetching question summaries:', error);
      throw error;
    }
  }
  
  /**
   * Get all quiz categories
   * @returns Array of quiz categories
   */
  static async getCategories(): Promise<QuizCategory[]> {
    try {
      const categoriesQuery = query(
        collection(getFirestoreDb(), COLLECTIONS.CATEGORIES),
        orderBy('name', 'asc')
      );
      
      const categorySnapshot = await getDocs(categoriesQuery);
      
      const categories: QuizCategory[] = [];
      categorySnapshot.forEach(doc => {
        const categoryData = doc.data();
        categories.push({
          id: doc.id,
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.iconUrl
        });
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
  
  /**
   * Update question analytics after a user answers
   * @param questionId Question ID
   * @param wasCorrect Whether the answer was correct
   * @param answerTime Time taken to answer in seconds
   * @param wasSkipped Whether the question was skipped
   */
  static async updateQuestionAnalytics(
    questionId: string,
    wasCorrect: boolean,
    answerTime: number,
    wasSkipped: boolean
  ): Promise<void> {
    try {
      const questionRef = doc(getFirestoreDb(), COLLECTIONS.QUESTIONS, questionId);
      
      if (wasSkipped) {
        // If skipped, just increment the times answered counter
        await updateDoc(questionRef, {
          'stats.timesAnswered': increment(1),
          'stats.timesSkipped': increment(1)
        });
      } else {
        // Update analytics based on the answer
        const updates: any = {
          'stats.timesAnswered': increment(1)
        };
        
        if (wasCorrect) {
          updates['stats.timesCorrect'] = increment(1);
        }
        
        // Update the average answer time
        // We need to get the current stats first
        const questionDoc = await getDoc(questionRef);
        if (questionDoc.exists()) {
          const stats = questionDoc.data().stats || { timesAnswered: 0, averageTime: 0 };
          const currentTotal = stats.averageTime * stats.timesAnswered;
          const newTotal = currentTotal + answerTime;
          const newAverage = newTotal / (stats.timesAnswered + 1);
          
          updates['stats.averageTime'] = newAverage;
        } else {
          updates['stats.averageTime'] = answerTime;
        }
        
        await updateDoc(questionRef, updates);
      }
    } catch (error) {
      console.error(`Error updating analytics for question ${questionId}:`, error);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Record a quiz attempt
   * @param attempt Quiz attempt data
   * @returns ID of the created attempt document
   */
  static async recordQuizAttempt(attempt: any): Promise<string> {
    try {
      const attemptsRef = collection(getFirestoreDb(), COLLECTIONS.QUIZ_ATTEMPTS);
      const attemptDoc = await addDoc(attemptsRef, {
        ...attempt,
        timestamp: serverTimestamp()
      });
      
      return attemptDoc.id;
    } catch (error) {
      console.error('Error recording quiz attempt:', error);
      throw error;
    }
  }
} 