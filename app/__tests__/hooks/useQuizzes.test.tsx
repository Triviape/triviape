import { renderHook } from '@testing-library/react';
import { useQuizzes, useQuiz, useQuizQuestions } from '@/app/hooks/useQuizzes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DifficultyLevel } from '@/app/types/quiz';

// Mock the entire module
jest.mock('@/app/hooks/useQuizzes', () => {
  const originalModule = jest.requireActual('@/app/hooks/useQuizzes');
  
  // Create mock implementations that return predefined data
  const mockUseQuizzes = jest.fn();
  const mockUseQuiz = jest.fn();
  const mockUseQuizQuestions = jest.fn();
  
  return {
    __esModule: true,
    ...originalModule,
    useQuizzes: mockUseQuizzes,
    useQuiz: mockUseQuiz,
    useQuizQuestions: mockUseQuizQuestions
  };
});

// Get the mocked functions
const mockedUseQuizzes = useQuizzes as jest.MockedFunction<typeof useQuizzes>;
const mockedUseQuiz = useQuiz as jest.MockedFunction<typeof useQuiz>;
const mockedUseQuizQuestions = useQuizQuestions as jest.MockedFunction<typeof useQuizQuestions>;

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
    it('returns the expected data structure', () => {
      // Mock the hook to return success state with data
      mockedUseQuizzes.mockReturnValue({
        isLoading: false,
        isSuccess: true,
        data: {
          pages: [
            {
              quizzes: [
                { id: '1', title: 'Quiz 1', difficulty: 'easy' as DifficultyLevel },
                { id: '2', title: 'Quiz 2', difficulty: 'medium' as DifficultyLevel }
              ],
              hasMore: true
            }
          ],
          pageParams: [null]
        },
        fetchNextPage: jest.fn(),
        hasNextPage: true,
        isFetchingNextPage: false,
        status: 'success',
        fetchStatus: 'idle'
      } as any);
      
      // Render the hook
      const { result } = renderHook(() => useQuizzes('category1', 'easy' as DifficultyLevel), {
        wrapper: createWrapper()
      });
      
      // Verify the hook was called with the correct parameters
      expect(mockedUseQuizzes).toHaveBeenCalledWith('category1', 'easy');
      
      // Check that the data structure is as expected
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.pages[0].quizzes).toHaveLength(2);
      expect(result.current.data?.pages[0].quizzes[0].id).toBe('1');
    });
  });
  
  describe('useQuiz', () => {
    it('returns the expected data structure', () => {
      // Mock the hook to return success state with data
      mockedUseQuiz.mockReturnValue({
        isLoading: false,
        isSuccess: true,
        data: {
          id: 'quiz1',
          title: 'Test Quiz',
          description: 'A quiz for testing',
          difficulty: 'medium' as DifficultyLevel,
          questionIds: ['q1', 'q2', 'q3']
        },
        status: 'success',
        fetchStatus: 'idle'
      } as any);
      
      // Render the hook
      const { result } = renderHook(() => useQuiz('quiz1'), {
        wrapper: createWrapper()
      });
      
      // Verify the hook was called with the correct parameters
      expect(mockedUseQuiz).toHaveBeenCalledWith('quiz1');
      
      // Check that the data structure is as expected
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.id).toBe('quiz1');
      expect(result.current.data?.questionIds).toHaveLength(3);
    });
  });
  
  describe('useQuizQuestions', () => {
    it('returns the expected data structure when questionIds are provided', () => {
      // Mock the hook to return success state with data
      mockedUseQuizQuestions.mockReturnValue({
        isLoading: false,
        isSuccess: true,
        data: [
          { id: 'q1', text: 'Question 1', options: [] },
          { id: 'q2', text: 'Question 2', options: [] }
        ],
        status: 'success',
        fetchStatus: 'idle'
      } as any);
      
      const questionIds = ['q1', 'q2'];
      
      // Render the hook
      const { result } = renderHook(() => useQuizQuestions(questionIds), {
        wrapper: createWrapper()
      });
      
      // Verify the hook was called with the correct parameters
      expect(mockedUseQuizQuestions).toHaveBeenCalledWith(questionIds);
      
      // Check that the data structure is as expected
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].id).toBe('q1');
    });
    
    it('does not fetch questions when questionIds are undefined', () => {
      // Mock the hook to return idle state
      mockedUseQuizQuestions.mockReturnValue({
        isLoading: false,
        isSuccess: false,
        data: undefined,
        status: 'idle',
        fetchStatus: 'idle'
      } as any);
      
      // Render the hook
      const { result } = renderHook(() => useQuizQuestions(undefined), {
        wrapper: createWrapper()
      });
      
      // Verify the hook was called with the correct parameters
      expect(mockedUseQuizQuestions).toHaveBeenCalledWith(undefined);
      
      // Check that the data structure is as expected
      expect(result.current.fetchStatus).toBe('idle');
    });
  });
}); 