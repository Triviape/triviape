import React from 'react';
import { useDailyQuiz } from '@/app/hooks/useDailyQuiz';
import { useHasCompletedDailyQuiz } from '@/app/hooks/useDailyQuizStatus';
import { useAuth } from '@/app/hooks/useAuth';

interface DailyQuizCardProps {
  onStartClick?: () => void;
}

export function DailyQuizCard({ onStartClick }: DailyQuizCardProps) {
  const { data: dailyQuiz, isLoading: isQuizLoading, error: quizError } = useDailyQuiz();
  const { hasCompleted, currentStreak, isLoading: isStatusLoading } = useHasCompletedDailyQuiz();
  const { user } = useAuth();
  
  const isLoading = isQuizLoading || isStatusLoading;
  
  if (isLoading) {
    return (
      <div className="daily-quiz-card loading">
        <div className="card-header">
          <div className="title-skeleton"></div>
          <div className="description-skeleton"></div>
        </div>
        <div className="card-body">
          <div className="stats-skeleton"></div>
        </div>
        <div className="card-footer">
          <div className="button-skeleton"></div>
        </div>
      </div>
    );
  }
  
  if (quizError || !dailyQuiz) {
    return (
      <div className="daily-quiz-card error">
        <div className="card-header">
          <h2>Daily Quiz</h2>
          <p>{quizError ? 'Error loading daily quiz' : 'No daily quiz available today'}</p>
        </div>
        <div className="card-footer">
          <button className="btn-secondary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const handleClick = () => {
    if (onStartClick) {
      onStartClick();
    }
  };
  
  return (
    <div className="daily-quiz-card">
      <div className="card-header">
        <div className="title-area">
          <h2>{dailyQuiz.title}</h2>
          <span className="difficulty-badge">{dailyQuiz.difficulty}</span>
        </div>
        <p className="description">{dailyQuiz.description}</p>
      </div>
      
      <div className="card-body">
        <div className="quiz-stats">
          <div className="stat">
            <span className="stat-value">{dailyQuiz.questionIds.length}</span>
            <span className="stat-label">Questions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round((dailyQuiz.timeLimit ?? 0) / 60)}</span>
            <span className="stat-label">Minutes</span>
          </div>
          {currentStreak > 0 && (
            <div className="stat streak">
              <span className="stat-value">{currentStreak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="card-footer">
        {!user ? (
          <button className="btn-secondary" disabled>Sign in to play</button>
        ) : hasCompleted ? (
          <div className="completed-status">
            <span className="completed-badge">Completed</span>
            <p className="completed-message">Come back tomorrow for a new quiz!</p>
          </div>
        ) : (
          <button className="btn-primary" onClick={handleClick}>
            Start Quiz
          </button>
        )}
      </div>
    </div>
  );
} 
