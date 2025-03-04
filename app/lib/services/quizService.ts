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
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
      // Start building the query
      let q = collection(db, COLLECTIONS.QUIZZES);
      let constraints = [];

      // Add filters if provided
      if (categoryId) {
        constraints.push(where('categoryIds', 'array-contains', categoryId));
      }
      
      if (difficulty) {
        constraints.push(where('difficulty', '==', difficulty));
      }
      
      // Always filter for active quizzes
      constraints.push(where('isActive', '==', true));
      
      // Add ordering
      constraints.push(orderBy('updatedAt', 'desc'));
      
      // Add pagination limit
      constraints.push(limit(pageSize));
      
      // Add startAfter if we have a last document
      if (lastQuizDoc) {
        constraints.push(startAfter(lastQuizDoc));
      }
      
      // Build the final query
      q = query(q, ...constraints);
      
      // Execute the query
      const snapshot = await getDocs(q);
      
      // Process the results
      const quizzes: Quiz[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        quizzes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis() || 0,
          updatedAt: data.updatedAt?.toMillis() || 0
        } as Quiz);
      });
      
      // Get the last document for pagination
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      
      return { quizzes, lastVisible };
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }

  /**
   * Fetch a single quiz by ID
   * @param quizId The ID of the quiz to fetch
   * @returns The quiz object or null if not found
   */
  static async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const quizDoc = await getDoc(doc(db, COLLECTIONS.QUIZZES, quizId));
      
      if (!quizDoc.exists()) {
        return null;
      }
      
      const data = quizDoc.data();
      return {
        id: quizDoc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || 0,
        updatedAt: data.updatedAt?.toMillis() || 0
      } as Quiz;
    } catch (error) {
      console.error(`Error fetching quiz with ID ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch questions for a quiz efficiently
   * @param questionIds Array of question IDs to fetch
   * @returns Array of questions
   */
  static async getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
    try {
      if (!questionIds.length) {
        return [];
      }
      
      // Firestore has a limit of 10 items for 'in' queries,
      // so we need to batch our requests if we have more IDs
      const questions: Question[] = [];
      const batchSize = 10;
      
      // Process in batches of 10
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, COLLECTIONS.QUESTIONS),
          where(documentId(), 'in', batch),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          questions.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis() || 0,
            updatedAt: data.updatedAt?.toMillis() || 0
          } as Question);
        });
      }
      
      // Return questions in the same order as the input IDs
      return questionIds.map(id => 
        questions.find(q => q.id === id)
      ).filter(Boolean) as Question[];
    } catch (error) {
      console.error('Error fetching questions by IDs:', error);
      throw error;
    }
  }

  /**
   * Get a list of question summaries (lighter version of questions for list views)
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
      // Start building the query
      let q = collection(db, COLLECTIONS.QUESTIONS);
      let constraints = [];
      
      // Add filters if provided
      if (categoryId) {
        constraints.push(where('categoryIds', 'array-contains', categoryId));
      }
      
      if (difficulty) {
        constraints.push(where('difficulty', '==', difficulty));
      }
      
      // Always filter for active questions
      constraints.push(where('isActive', '==', true));
      
      // Add ordering
      constraints.push(orderBy('updatedAt', 'desc'));
      
      // Add pagination limit
      constraints.push(limit(pageSize));
      
      // Add startAfter if we have a last document
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      // Build the final query
      q = query(q, ...constraints);
      
      // Execute the query
      const snapshot = await getDocs(q);
      
      // Process the results
      const summaries: QuestionSummary[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        summaries.push({
          id: doc.id,
          text: data.text,
          type: data.type,
          difficulty: data.difficulty,
          categoryIds: data.categoryIds,
          points: data.points,
          isActive: data.isActive
        });
      });
      
      // Get the last document for pagination
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      
      return { summaries, lastVisible };
    } catch (error) {
      console.error('Error fetching question summaries:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   * @returns Array of quiz categories
   */
  static async getCategories(): Promise<QuizCategory[]> {
    try {
      const snapshot = await getDocs(
        query(collection(db, COLLECTIONS.CATEGORIES), 
        orderBy('name'))
      );
      
      const categories: QuizCategory[] = [];
      snapshot.forEach(doc => {
        categories.push({
          id: doc.id,
          ...doc.data()
        } as QuizCategory);
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
   * @param answerTime Time spent answering in seconds
   * @param wasSkipped Whether the question was skipped
   */
  static async updateQuestionAnalytics(
    questionId: string,
    wasCorrect: boolean,
    answerTime: number,
    wasSkipped: boolean
  ): Promise<void> {
    try {
      const questionRef = doc(db, COLLECTIONS.QUESTIONS, questionId);
      
      const updates: Record<string, any> = {
        timesAnswered: increment(1)
      };
      
      if (wasCorrect) {
        updates.timesAnsweredCorrectly = increment(1);
      }
      
      // Update average answer time
      // This requires a transaction to read the current values first,
      // but for simplicity in this example, we'll use a field to track total time
      // and compute the average on read
      updates.totalAnswerTime = increment(answerTime);
      
      if (wasSkipped) {
        updates.timesSkipped = increment(1);
      }
      
      await updateDoc(questionRef, updates);
    } catch (error) {
      console.error(`Error updating analytics for question ${questionId}:`, error);
      // Don't throw here as this is a non-critical operation
      // that shouldn't break the user experience
    }
  }

  /**
   * Record a quiz attempt
   * @param attempt The quiz attempt data
   * @returns The ID of the created attempt document
   */
  static async recordQuizAttempt(attempt: any): Promise<string> {
    try {
      // Create the attempt document
      const attemptRef = await addDoc(collection(db, COLLECTIONS.QUIZ_ATTEMPTS), {
        ...attempt,
        startedAt: Timestamp.fromMillis(attempt.startedAt),
        completedAt: attempt.completedAt ? Timestamp.fromMillis(attempt.completedAt) : null
      });
      
      // Update quiz analytics in a batch
      const batch = writeBatch(db);
      
      // Update quiz play count
      const quizRef = doc(db, COLLECTIONS.QUIZZES, attempt.quizId);
      batch.update(quizRef, {
        timesPlayed: increment(1),
        // If completed, update the completion rate and average score
        ...(attempt.completedAt ? {
          completionCount: increment(1),
          totalScoreSum: increment(attempt.score)
        } : {})
      });
      
      // Update question analytics in the same batch
      attempt.answers.forEach((answer: any) => {
        if (!answer.wasSkipped) {
          const questionRef = doc(db, COLLECTIONS.QUESTIONS, answer.questionId);
          batch.update(questionRef, {
            timesAnswered: increment(1),
            ...(answer.wasCorrect ? { timesAnsweredCorrectly: increment(1) } : {}),
            totalAnswerTime: increment(answer.timeSpent)
          });
        }
      });
      
      await batch.commit();
      
      return attemptRef.id;
    } catch (error) {
      console.error('Error recording quiz attempt:', error);
      throw error;
    }
  }
} 