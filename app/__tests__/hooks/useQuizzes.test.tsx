import { renderHook, waitFor } from '@testing-library/react';
import { useQuizzes, useQuiz, useQuizQuestions } from '@/app/hooks/useQuizzes';
import { QuizService } from '@/app/lib/services/quizService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { DifficultyLevel } from '@/app/types/quiz';

// Mock the QuizService
jest.mock('@/app/lib/services/quizService', () => ({
  QuizService: {
    getQuizzes: jest.fn(),
    getQuizById: jest.fn(),
    getQuestionsByIds: jest.fn()
  }
}));

// Mock document snapshot
const createMockSnapshot = (): QueryDocumentSnapshot<DocumentData, DocumentData> => {
  return {
    exists: jest.fn().mockReturnValue(true),
    id: 'mock-id',
    data: jest.fn().mockReturnValue({}),
    get: jest.fn(),
    metadata: {} as any,
    ref: {} as any,
  } as any;
};

// Create a wrapper for react-query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Quiz Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('useQuizzes', () => {
    it('fetches quizzes correctly', async () => {
      const mockSnapshot = createMockSnapshot();
      const mockResponse = {
        quizzes: [
          { id: '1', title: 'Quiz 1', difficulty: 'easy' as DifficultyLevel },
          { id: '2', title: 'Quiz 2', difficulty: 'medium' as DifficultyLevel }
        ],
        lastVisible: mockSnapshot
      };
      
      (QuizService.getQuizzes as jest.Mock).mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useQuizzes('category1', 'easy' as DifficultyLevel), {
        wrapper: createWrapper()
      });
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(QuizService.getQuizzes).toHaveBeenCalledWith(
        'category1', 
        'easy', 
        10, // default pageSize
        null  // initial pageParam
      );
      
      expect(result.current.data?.pages[0].quizzes).toEqual(mockResponse.quizzes);
    });
  });
  
  describe('useQuiz', () => {
    it('fetches a single quiz correctly', async () => {
      const mockQuiz = {
        id: 'quiz1',
        title: 'Test Quiz',
        description: 'A quiz for testing',
        difficulty: 'medium' as DifficultyLevel,
        questionIds: ['q1', 'q2', 'q3']
      };
      
      (QuizService.getQuizById as jest.Mock).mockResolvedValue(mockQuiz);
      
      const { result } = renderHook(() => useQuiz('quiz1'), {
        wrapper: createWrapper()
      });
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(QuizService.getQuizById).toHaveBeenCalledWith('quiz1');
      expect(result.current.data).toEqual(mockQuiz);
    });
  });
  
  describe('useQuizQuestions', () => {
    it('fetches questions correctly when questionIds are provided', async () => {
      const mockQuestions = [
        { id: 'q1', text: 'Question 1', options: [] },
        { id: 'q2', text: 'Question 2', options: [] }
      ];
      
      (QuizService.getQuestionsByIds as jest.Mock).mockResolvedValue(mockQuestions);
      
      const questionIds = ['q1', 'q2'];
      const { result } = renderHook(() => useQuizQuestions(questionIds), {
        wrapper: createWrapper()
      });
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(QuizService.getQuestionsByIds).toHaveBeenCalledWith(questionIds);
      expect(result.current.data).toEqual(mockQuestions);
    });
    
    it('does not fetch questions when questionIds are undefined', async () => {
      const { result } = renderHook(() => useQuizQuestions(undefined), {
        wrapper: createWrapper()
      });
      
      expect(result.current.fetchStatus).toBe('idle');
      expect(QuizService.getQuestionsByIds).not.toHaveBeenCalled();
    });
  });
}); 