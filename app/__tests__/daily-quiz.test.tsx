import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DailyQuizCard } from '@/app/components/daily/DailyQuizCard';
import { DailyQuizPreScreen } from '@/app/components/daily/DailyQuizPreScreen';
import { DailyQuizResults } from '@/app/components/daily/DailyQuizResults';
import { useHasCompletedDailyQuiz, updateDailyQuizCompletion } from '@/app/hooks/useDailyQuizStatus';
import { useDailyQuiz } from '@/app/hooks/useQuizzes';

// Mock the hooks
jest.mock('@/app/hooks/useDailyQuizStatus', () => ({
  useHasCompletedDailyQuiz: jest.fn(),
  updateDailyQuizCompletion: jest.fn()
}));

jest.mock('@/app/hooks/useQuizzes', () => ({
  useDailyQuiz: jest.fn()
}));

jest.mock('@/app/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    currentUser: { uid: 'test-user-id' },
    isLoading: false
  }))
}));

// Create a wrapper with React Query provider
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

describe('Daily Quiz Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('DailyQuizCard', () => {
    it('should display loading state initially', () => {
      // Mock the hook to return loading state
      (useHasCompletedDailyQuiz as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true
      });
      
      render(<DailyQuizCard />, { wrapper: createWrapper() });
      
      // Check for loading skeleton
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });
    
    it('should display completed state when quiz is completed', async () => {
      // Mock the hook to return completed state
      (useHasCompletedDailyQuiz as jest.Mock).mockReturnValue({
        data: {
          hasCompleted: true,
          currentStreak: 3,
          bestStreak: 5,
          completedAt: Date.now(),
          lastCompletedDate: new Date().toISOString().split('T')[0]
        },
        isLoading: false
      });
      
      render(<DailyQuizCard />, { wrapper: createWrapper() });
      
      // Check for completed message
      expect(screen.getByText(/Today's Challenge Completed!/i)).toBeInTheDocument();
      
      // Check for streak information
      expect(screen.getByText('3')).toBeInTheDocument(); // Current streak
      expect(screen.getByText('5')).toBeInTheDocument(); // Best streak
      
      // Check that button is disabled
      const button = screen.getByRole('button', { name: /Completed Today/i });
      expect(button).toBeDisabled();
    });
    
    it('should display not completed state when quiz is not completed', async () => {
      // Mock the hook to return not completed state
      (useHasCompletedDailyQuiz as jest.Mock).mockReturnValue({
        data: {
          hasCompleted: false,
          currentStreak: 2,
          bestStreak: 5
        },
        isLoading: false
      });
      
      render(<DailyQuizCard />, { wrapper: createWrapper() });
      
      // Check for not completed message
      expect(screen.getByText(/Ready for Today's Challenge\?/i)).toBeInTheDocument();
      
      // Check that button is enabled
      const button = screen.getByRole('button', { name: /Start Daily Quiz/i });
      expect(button).not.toBeDisabled();
    });
  });
  
  describe('DailyQuizPreScreen', () => {
    it('should display quiz information and handle start button click', async () => {
      // Mock the hooks
      (useHasCompletedDailyQuiz as jest.Mock).mockReturnValue({
        data: {
          hasCompleted: false,
          currentStreak: 2,
          bestStreak: 5
        },
        isLoading: false
      });
      
      (useDailyQuiz as jest.Mock).mockReturnValue({
        data: {
          id: 'daily-quiz-1',
          title: 'Test Daily Quiz',
          description: 'Test description',
          difficulty: 'medium',
          questionIds: ['q1', 'q2', 'q3'],
          baseXP: 100,
          baseCoins: 50
        },
        isLoading: false
      });
      
      const handleStartQuiz = jest.fn();
      const handleBack = jest.fn();
      
      render(
        <DailyQuizPreScreen 
          onStartQuiz={handleStartQuiz} 
          onBack={handleBack} 
        />, 
        { wrapper: createWrapper() }
      );
      
      // Check for quiz information
      expect(screen.getByText('Test Daily Quiz')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('medium', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('3', { exact: false })).toBeInTheDocument(); // 3 questions
      
      // Click start button
      fireEvent.click(screen.getByRole('button', { name: /Start Challenge/i }));
      expect(handleStartQuiz).toHaveBeenCalled();
      
      // Click back button
      fireEvent.click(screen.getByRole('button', { name: /Back/i }));
      expect(handleBack).toHaveBeenCalled();
    });
    
    it('should disable start button when quiz is already completed', async () => {
      // Mock the hooks
      (useHasCompletedDailyQuiz as jest.Mock).mockReturnValue({
        data: {
          hasCompleted: true,
          currentStreak: 3,
          bestStreak: 5
        },
        isLoading: false
      });
      
      (useDailyQuiz as jest.Mock).mockReturnValue({
        data: {
          id: 'daily-quiz-1',
          title: 'Test Daily Quiz',
          description: 'Test description',
          difficulty: 'medium',
          questionIds: ['q1', 'q2', 'q3']
        },
        isLoading: false
      });
      
      const handleStartQuiz = jest.fn();
      const handleBack = jest.fn();
      
      render(
        <DailyQuizPreScreen 
          onStartQuiz={handleStartQuiz} 
          onBack={handleBack} 
        />, 
        { wrapper: createWrapper() }
      );
      
      // Check for already completed message
      expect(screen.getByText(/You've already completed today's challenge!/i)).toBeInTheDocument();
      
      // Check that start button is disabled
      const startButton = screen.getByRole('button', { name: /Already Completed/i });
      expect(startButton).toBeDisabled();
    });
  });
  
  describe('DailyQuizResults', () => {
    it('should display quiz results and handle save button click', async () => {
      // Mock the updateDailyQuizCompletion function
      (updateDailyQuizCompletion as jest.Mock).mockResolvedValue({
        hasCompleted: true,
        currentStreak: 3,
        bestStreak: 5
      });
      
      const handleBack = jest.fn();
      
      render(
        <DailyQuizResults 
          score={80}
          totalQuestions={5}
          correctAnswers={4}
          xpEarned={120}
          coinsEarned={60}
          onBack={handleBack}
          quizId="daily-quiz-1"
        />, 
        { wrapper: createWrapper() }
      );
      
      // Check for results information
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('4 / 5')).toBeInTheDocument();
      expect(screen.getByText('+120')).toBeInTheDocument();
      expect(screen.getByText('+60')).toBeInTheDocument();
      
      // Click save button
      fireEvent.click(screen.getByRole('button', { name: /Save Results/i }));
      
      // Wait for the submission to complete
      await waitFor(() => {
        expect(updateDailyQuizCompletion).toHaveBeenCalledWith('daily-quiz-1', 80);
        expect(screen.getByText(/Your results have been saved successfully!/i)).toBeInTheDocument();
      });
      
      // Check that back button text changed
      expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });
    
    it('should handle errors when saving results', async () => {
      // Mock the updateDailyQuizCompletion function to throw an error
      (updateDailyQuizCompletion as jest.Mock).mockRejectedValue(new Error('Failed to save results'));
      
      const handleBack = jest.fn();
      
      render(
        <DailyQuizResults 
          score={80}
          totalQuestions={5}
          correctAnswers={4}
          xpEarned={120}
          coinsEarned={60}
          onBack={handleBack}
          quizId="daily-quiz-1"
        />, 
        { wrapper: createWrapper() }
      );
      
      // Click save button
      fireEvent.click(screen.getByRole('button', { name: /Save Results/i }));
      
      // Wait for the error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Failed to save results/i)).toBeInTheDocument();
      });
      
      // Check that the button is not disabled
      expect(screen.getByRole('button', { name: /Save Results/i })).not.toBeDisabled();
    });
  });
}); 