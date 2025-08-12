import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { handleDailyQuizCompletion, invalidateQuizCompletionCaches, QuizCompletionResult } from '@/app/lib/services/quizCompletionService';
import { useAuth } from '@/app/hooks/useAuth';

interface DailyQuizResultsProps {
  /**
   * ID of the completed quiz
   */
  quizId: string;
  
  /**
   * User's score (0-100)
   */
  score: number;
  
  /**
   * Time taken to complete the quiz in seconds
   */
  completionTime: number;
  
  /**
   * Called when results are ready
   */
  onResultsReady?: (results: QuizCompletionResult) => void;
}

/**
 * Component to process and display daily quiz results
 * This handles recording completion, updating streaks, and displaying rankings
 */
export function DailyQuizResults({ quizId, score, completionTime, onResultsReady }: DailyQuizResultsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [results, setResults] = React.useState<QuizCompletionResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  useEffect(() => {
    async function processResults() {
      if (!user?.uid) {
        setError(new Error('User is not authenticated'));
        setLoading(false);
        return;
      }
      
      try {
        // Process quiz completion
        const completionResults = await handleDailyQuizCompletion(
          user.uid,
          quizId,
          score,
          completionTime
        );
        
        // Invalidate caches to ensure fresh data
        invalidateQuizCompletionCaches(queryClient, quizId);
        
        // Update state
        setResults(completionResults);
        
        // Notify parent component
        if (onResultsReady) {
          onResultsReady(completionResults);
        }
      } catch (error) {
        console.error('Error processing quiz results:', error);
        setError(error instanceof Error ? error : new Error('An unknown error occurred'));
      } finally {
        setLoading(false);
      }
    }
    
    processResults();
  }, [user, quizId, score, completionTime, queryClient, onResultsReady]);
  
  if (loading) {
    return (
      <div className="results-loading">
        <h2>Processing Results...</h2>
        <p>Please wait while we calculate your score and ranking.</p>
        {/* Add loading spinner here */}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="results-error">
        <h2>Error Processing Results</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  if (!results) {
    return (
      <div className="results-unavailable">
        <h2>Results Unavailable</h2>
        <p>Unable to process your quiz results. Please try again.</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  return (
    <div className="daily-quiz-results">
      <div className="results-header">
        <h2>Quiz Complete!</h2>
        <p>Here's how you performed:</p>
      </div>
      
      <div className="results-content">
        <div className="score-section">
          <div className="score-display">
            <span className="score-value">{results.score}</span>
            <span className="score-label">Points</span>
          </div>
          <div className="completion-time">
            <span className="time-value">{formatTime(results.completionTime)}</span>
            <span className="time-label">Time</span>
          </div>
        </div>
        
        <div className="ranking-section">
          <h3>Your Ranking</h3>
          {results.ranking.rank ? (
            <div className="ranking-info">
              <span className="rank-number">#{results.ranking.rank}</span>
              <span className="rank-total">out of {results.ranking.totalEntries} players</span>
              {results.ranking.isInTopTen && (
                <span className="top-ten-badge">Top 10!</span>
              )}
            </div>
          ) : (
            <p>Ranking not available</p>
          )}
        </div>
        
        <div className="streak-section">
          <h3>Your Streak</h3>
          <div className="streak-info">
            <span className="current-streak">{results.streak.currentStreak} days</span>
            <span className="longest-streak">Best: {results.streak.longestStreak} days</span>
          </div>
        </div>
      </div>
      
      <div className="results-actions">
        <button className="btn-primary" onClick={() => window.location.href = '/daily'}>
          Play Again Tomorrow
        </button>
        <button className="btn-secondary" onClick={() => window.location.href = '/dashboard'}>
          View Dashboard
        </button>
      </div>
    </div>
  );
}

/**
 * Format seconds into a readable time string
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
} 