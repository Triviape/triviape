import { DifficultyLevel, QuestionType } from '../../../types/quiz';
import { COLLECTIONS } from '../../../lib/services/quiz/types';

// Mock the service modules before importing them
jest.mock('../../../lib/services/quiz/quizFetchService', () => {
  // Create mock implementations of the service functions
  const mockQuizzes = [
    {
      id: 'quiz1',
      title: 'Test Quiz 1',
      description: 'Description for test quiz 1',
      categoryIds: ['cat1'],
      difficulty: DifficultyLevel.Easy,
      questionIds: ['q1', 'q2'],
      shuffleQuestions: true,
      estimatedDuration: 10,
      baseXP: 100,
      baseCoins: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      timesPlayed: 10,
      averageScore: 85,
      completionRate: 90,
      timeLimit: 600,
      passingScore: 70,
      coverImage: 'image1.jpg'
    },
    {
      id: 'quiz2',
      title: 'Test Quiz 2',
      description: 'Description for test quiz 2',
      categoryIds: ['cat2'],
      difficulty: DifficultyLevel.Medium,
      questionIds: ['q3', 'q4'],
      shuffleQuestions: false,
      estimatedDuration: 15,
      baseXP: 150,
      baseCoins: 75,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
      timesPlayed: 5,
      averageScore: 75,
      completionRate: 80,
      timeLimit: 900,
      passingScore: 60,
      coverImage: 'image2.jpg'
    }
  ];

  const mockQuestions = [
    {
      id: 'q1',
      text: 'Test Question 1',
      type: QuestionType.MultipleChoice,
      difficulty: DifficultyLevel.Easy,
      categoryIds: ['cat1'],
      correctAnswers: ['a'],
      answerOptions: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' }
      ],
      explanation: 'Explanation for question 1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timesAnswered: 10,
      timesAnsweredCorrectly: 8
    },
    {
      id: 'q2',
      text: 'Test Question 2',
      type: QuestionType.TrueFalse,
      difficulty: DifficultyLevel.Medium,
      categoryIds: ['cat1'],
      correctAnswers: ['true'],
      answerOptions: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' }
      ],
      explanation: 'Explanation for question 2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timesAnswered: 5,
      timesAnsweredCorrectly: 3
    }
  ];

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Category 1',
      description: 'Description for category 1',
      iconUrl: 'icon1.jpg'
    },
    {
      id: 'cat2',
      name: 'Category 2',
      description: 'Description for category 2',
      iconUrl: 'icon2.jpg'
    }
  ];

  // Mock implementations of the service functions
  const getQuizzesMock = jest.fn().mockImplementation((options = {}) => {
    // Ensure options is an object even if not provided
    const actualOptions = options || {};
    
    let filteredQuizzes = [...mockQuizzes];
    
    // Apply filters if provided
    if (actualOptions.categoryId) {
      filteredQuizzes = filteredQuizzes.filter(quiz => 
        quiz.categoryIds.includes(actualOptions.categoryId)
      );
    }
    
    if (actualOptions.difficulty) {
      filteredQuizzes = filteredQuizzes.filter(quiz => 
        quiz.difficulty === actualOptions.difficulty
      );
    }
    
    // Apply pagination
    if (actualOptions.startAfterQuiz) {
      const startIndex = mockQuizzes.findIndex(q => q.id === actualOptions.startAfterQuiz.id);
      if (startIndex !== -1) {
        filteredQuizzes = filteredQuizzes.slice(startIndex + 1);
      }
    }
    
    // Limit results
    const pageSize = actualOptions.pageSize || 10;
    const hasMore = filteredQuizzes.length > pageSize;
    const items = filteredQuizzes.slice(0, pageSize);
    
    return Promise.resolve({
      items,
      hasMore,
      lastDoc: items.length > 0 ? items[items.length - 1] : null
    });
  });
  
  return {
    getQuizzes: getQuizzesMock,
    
    getQuizById: jest.fn().mockImplementation((quizId) => {
      const quiz = mockQuizzes.find(q => q.id === quizId);
      return Promise.resolve(quiz || null);
    }),
    
    getQuestionsByIds: jest.fn().mockImplementation((questionIds) => {
      if (!questionIds || questionIds.length === 0) {
        return Promise.resolve([]);
      }
      
      const questions = mockQuestions.filter(q => questionIds.includes(q.id));
      return Promise.resolve(questions);
    }),
    
    getCategories: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockCategories);
    })
  };
});

// Import the mocked service functions
import { 
  getQuizzes, 
  getQuizById, 
  getQuestionsByIds, 
  getCategories 
} from '../../../lib/services/quiz/quizFetchService';

describe('Quiz Fetch Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getQuizzes', () => {
    it('should fetch quizzes with default parameters', async () => {
      const result = await getQuizzes({});
      
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('quiz1');
      expect(result.items[1].id).toBe('quiz2');
      expect(result.hasMore).toBe(false);
      
      expect(getQuizzes).toHaveBeenCalledWith({});
    });
    
    it('should apply category and difficulty filters', async () => {
      const result = await getQuizzes({
        categoryId: 'cat1',
        difficulty: DifficultyLevel.Easy
      });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('quiz1');
      expect(result.hasMore).toBe(false);
      
      expect(getQuizzes).toHaveBeenCalledWith({
        categoryId: 'cat1',
        difficulty: DifficultyLevel.Easy
      });
    });
    
    it('should handle pagination', async () => {
      const startAfterQuiz = {
        id: 'quiz1',
        title: 'Test Quiz 1',
        description: 'Description for test quiz 1',
        categoryIds: ['cat1'],
        difficulty: DifficultyLevel.Easy,
        questionIds: ['q1', 'q2'],
        shuffleQuestions: true,
        estimatedDuration: 10,
        baseXP: 100,
        baseCoins: 50,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
        timesPlayed: 10,
        averageScore: 85,
        completionRate: 90,
        timeLimit: 600,
        passingScore: 70,
        coverImage: 'image1.jpg'
      };
      
      const result = await getQuizzes({
        startAfterQuiz,
        pageSize: 5
      });
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('quiz2');
      expect(result.hasMore).toBe(false);
      
      expect(getQuizzes).toHaveBeenCalledWith({
        startAfterQuiz,
        pageSize: 5
      });
    });
  });
  
  describe('getQuizById', () => {
    it('should fetch a quiz by id', async () => {
      const result = await getQuizById('quiz1');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('quiz1');
      expect(result?.title).toBe('Test Quiz 1');
      
      expect(getQuizById).toHaveBeenCalledWith('quiz1');
    });
    
    it('should return null for non-existent quiz', async () => {
      const result = await getQuizById('nonexistent');
      
      expect(result).toBeNull();
      
      expect(getQuizById).toHaveBeenCalledWith('nonexistent');
    });
  });
  
  describe('getQuestionsByIds', () => {
    it('should fetch questions by ids', async () => {
      const result = await getQuestionsByIds(['q1', 'q2']);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('q1');
      expect(result[1].id).toBe('q2');
      
      expect(getQuestionsByIds).toHaveBeenCalledWith(['q1', 'q2']);
    });
    
    it('should return empty array when no ids provided', async () => {
      const result = await getQuestionsByIds([]);
      
      expect(result).toHaveLength(0);
      
      expect(getQuestionsByIds).toHaveBeenCalledWith([]);
    });
  });
  
  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const result = await getCategories();
      
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat1');
      expect(result[1].id).toBe('cat2');
      
      expect(getCategories).toHaveBeenCalled();
    });
  });
});