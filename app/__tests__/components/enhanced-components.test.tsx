import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from '@/app/components/ui/button';
import { DailyQuizCard } from '@/app/components/daily/DailyQuizCard';
import { QuizCard } from '@/app/components/quiz/QuizCard';
import { Navbar } from '@/app/components/navigation/navbar';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';
import { ErrorBoundary } from '@/app/lib/componentUtils';
import { ResponsiveContainer, ContainerQuery, ResponsiveText } from '@/app/components/layouts/responsive-container';

// Mock the performance hooks
jest.mock('@/app/hooks/performance/useBenchmark', () => ({
  useBenchmark: jest.fn().mockReturnValue({
    renderTimeMs: 10,
    frameDrops: 0,
    isPerformant: true
  })
}));

// Mock the auth hook
jest.mock('@/app/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    currentUser: null,
    profile: null,
    signOut: { mutate: jest.fn() }
  })
}));

// Mock the daily quiz hook
jest.mock('@/app/hooks/useDailyQuizStatus', () => ({
  useHasCompletedDailyQuiz: jest.fn().mockReturnValue({
    data: { hasCompleted: false, currentStreak: 5, bestStreak: 10 },
    isLoading: false
  })
}));

// Wrap component with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ResponsiveUIProvider>
      {ui}
    </ResponsiveUIProvider>
  );
};

describe('Enhanced Components', () => {
  describe('Button Component', () => {
    it('renders with accessibility attributes', () => {
      renderWithProviders(
        <Button aria-label="Test button" aria-describedby="description">
          Click me
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('shows loading state with proper accessibility', () => {
      renderWithProviders(
        <Button isLoading loadingText="Processing...">
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toHaveAttribute('id', 'loading-description');
    });

    it('handles keyboard navigation', () => {
      const handleClick = jest.fn();
      renderWithProviders(
        <Button onClick={handleClick}>
          Test Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('DailyQuizCard Component', () => {
    it('renders with proper accessibility', () => {
      renderWithProviders(
        <DailyQuizCard 
          ariaLabel="Daily quiz challenge card"
          variant="featured"
          showStats={true}
        />
      );
      
      expect(screen.getByLabelText(/daily quiz challenge card/i)).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /quiz statistics/i })).toBeInTheDocument();
    });

    it('handles different variants correctly', () => {
      const { rerender } = renderWithProviders(
        <DailyQuizCard variant="compact" />
      );
      
      // Test compact variant
      const card = screen.getByRole('article');
      expect(card).toHaveClass('p-3');
      
      rerender(<DailyQuizCard variant="featured" />);
      expect(card).toHaveClass('ring-2');
    });

    it('calls onStart callback when quiz is started', () => {
      const onStart = jest.fn();
      renderWithProviders(
        <DailyQuizCard onStart={onStart} />
      );
      
      const startButton = screen.getByRole('button', { name: /start daily quiz/i });
      fireEvent.click(startButton);
      
      expect(onStart).toHaveBeenCalled();
    });
  });

  describe('QuizCard Component', () => {
    const mockQuiz = {
      id: 'test-quiz',
      title: 'Test Quiz',
      description: 'A test quiz description',
      difficulty: 'Medium',
      estimatedDuration: 300,
      questionIds: ['q1', 'q2', 'q3'],
      coverImage: null
    };

    it('renders with proper accessibility', () => {
      renderWithProviders(
        <QuizCard 
          quiz={mockQuiz}
          ariaLabel="Test quiz card"
        />
      );
      
      expect(screen.getByLabelText(/test quiz card/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty level: medium/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estimated duration: 5 minutes/i)).toBeInTheDocument();
    });

    it('handles different variants', () => {
      const { rerender } = renderWithProviders(
        <QuizCard quiz={mockQuiz} variant="compact" />
      );
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('p-3');
      
      rerender(<QuizCard quiz={mockQuiz} variant="featured" />);
      expect(card).toHaveClass('ring-2');
    });

    it('optimizes images correctly', () => {
      const quizWithImage = {
        ...mockQuiz,
        coverImage: '/test-image.jpg'
      };
      
      renderWithProviders(
        <QuizCard quiz={quizWithImage} />
      );
      
      const image = screen.getByAltText(/cover image for test quiz quiz/i);
      expect(image).toHaveAttribute('sizes', expect.stringContaining('100vw'));
    });
  });

  describe('Navbar Component', () => {
    it('renders with proper accessibility', () => {
      renderWithProviders(
        <Navbar ariaLabel="Main navigation" />
      );
      
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    });

    it('handles share functionality', async () => {
      const mockShare = jest.fn();
      Object.assign(navigator, {
        share: mockShare
      });
      
      renderWithProviders(<Navbar />);
      
      const shareButton = screen.getByRole('button', { name: /share this page/i });
      fireEvent.click(shareButton);
      
      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'Triviape - The Ultimate Trivia Game',
          text: 'Check out Triviape - The Ultimate Trivia Game!',
          url: expect.any(String)
        });
      });
    });

    it('handles dropdown menu accessibility', () => {
      renderWithProviders(<Navbar />);
      
      const userMenu = screen.getByRole('button', { name: /user menu/i });
      expect(userMenu).toHaveAttribute('aria-haspopup', 'true');
      expect(userMenu).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('ResponsiveContainer Component', () => {
    it('renders with container queries', () => {
      renderWithProviders(
        <ResponsiveContainer containerQueries={true}>
          <div>Test content</div>
        </ResponsiveContainer>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('@container');
    });

    it('handles aspect ratios', () => {
      renderWithProviders(
        <ResponsiveContainer aspectRatio="square">
          <div>Test content</div>
        </ResponsiveContainer>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('aspect-square');
    });
  });

  describe('ContainerQuery Component', () => {
    it('renders with container query wrapper', () => {
      renderWithProviders(
        <ContainerQuery>
          <div>Test content</div>
        </ContainerQuery>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('@container');
    });
  });

  describe('ResponsiveText Component', () => {
    it('renders with responsive text classes', () => {
      renderWithProviders(
        <ResponsiveText>Test text</ResponsiveText>
      );
      
      const text = screen.getByText('Test text');
      expect(text).toHaveClass('@sm:text-sm');
      expect(text).toHaveClass('@md:text-base');
    });
  });

  describe('ErrorBoundary Component', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('catches errors and shows fallback', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('calls custom fallback component', () => {
      const CustomFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div>
          <p>Custom error: {error.message}</p>
          <button onClick={resetError}>Custom retry</button>
        </div>
      );
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom retry/i })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Monitoring', () => {
    it('logs performance warnings when thresholds are exceeded', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock useBenchmark to return poor performance
      jest.doMock('@/app/hooks/performance/useBenchmark', () => ({
        useBenchmark: jest.fn().mockReturnValue({
          renderTimeMs: 50,
          frameDrops: 10,
          isPerformant: false
        })
      }));
      
      renderWithProviders(<Button>Test</Button>);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Button render time exceeded threshold')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility Compliance', () => {
    it('ensures proper ARIA attributes', () => {
      renderWithProviders(
        <div>
          <Button aria-expanded={true} aria-controls="menu">
            Menu
          </Button>
          <div id="menu" role="menu">
            <div role="menuitem">Item 1</div>
          </div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-controls', 'menu');
    });

    it('supports screen reader navigation', () => {
      renderWithProviders(
        <div>
          <Button aria-describedby="help-text">Submit</Button>
          <div id="help-text" className="sr-only">
            Click to submit the form
          </div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });
}); 