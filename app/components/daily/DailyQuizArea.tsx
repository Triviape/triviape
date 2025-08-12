'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { QuizState } from '@/app/page';
import { DailyQuizPreScreen } from './DailyQuizPreScreen';
import { DailyQuizGameplay } from './DailyQuizGameplay';
import { DailyQuizResults } from './DailyQuizResults';
import { useDailyQuiz } from '@/app/hooks/useQuizzes';
import { useQuizQuestions } from '@/app/hooks/useQuizQuestions';

interface DailyQuizAreaProps {
  className?: string;
  quizState: QuizState;
  onBack: () => void;
  onStartQuiz: () => void;
  onQuizComplete: (results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  }) => void;
  currentQuestionIndex: number;
  onAnswerSubmit: (questionId: string, answerIds: string[]) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  userAnswers: Record<string, string[]>;
  quizResults: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  } | null;
}

export function DailyQuizArea({
  className,
  quizState,
  onBack,
  onStartQuiz,
  onQuizComplete,
  currentQuestionIndex,
  onAnswerSubmit,
  onNextQuestion,
  onPreviousQuestion,
  userAnswers,
  quizResults
}: DailyQuizAreaProps) {
  // Fetch the daily quiz data
  const { data: dailyQuiz, isLoading: isQuizLoading } = useDailyQuiz();
  
  // Fetch the questions for the quiz
  const { data: questions, isLoading: isQuestionsLoading } = useQuizQuestions(
    dailyQuiz?.questionIds || []
  );
  
  const isLoading = isQuizLoading || isQuestionsLoading;
  
  // Calculate the total number of questions for display
  const totalQuestions = questions?.length || 0;
  
  // Handle quiz completion
  const handleCompleteQuiz = async () => {
    if (!questions || !dailyQuiz) return;
    
    try {
      // Use the standardized completion handler
      const { submitDailyQuizCompletion } = await import('@/app/lib/services/quiz/quizCompletionHandler');
      
      const result = await submitDailyQuizCompletion(
        dailyQuiz.id,
        userAnswers,
        questions,
        Date.now() - 600000, // Mock start time (10 minutes ago)
        Date.now()
      );
      
      // Call the completion handler with the standardized results
      onQuizComplete(result);
      
    } catch (error) {
      console.error('Error completing daily quiz:', error);
      
      // Fallback to local calculation if submission fails
      const { calculateQuizResults } = await import('@/app/lib/services/quiz/quizCompletionHandler');
      const fallbackResults = calculateQuizResults(userAnswers, questions, Date.now() - 600000);
      
      onQuizComplete({
        id: dailyQuiz.id,
        score: fallbackResults.score,
        totalQuestions: fallbackResults.totalQuestions,
        correctAnswers: fallbackResults.correctCount,
        xpEarned: Math.round((fallbackResults.score / 100) * (dailyQuiz?.baseXP || 100)),
        coinsEarned: Math.round((fallbackResults.score / 100) * (dailyQuiz?.baseCoins || 50))
      });
    }
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center w-full h-full",
        className
      )}>
        <div className="text-xl font-medium">Loading Daily Quiz...</div>
      </div>
    );
  }
  
  // Display error state if no quiz data
  if (!dailyQuiz) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center w-full h-full",
        className
      )}>
        <div className="text-xl font-medium">No daily quiz available</div>
        <button 
          onClick={onBack} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  // Render the component based on the current quiz state
  return (
    <div className={cn(
      "w-full h-full",
      className
    )}>
      {quizState === QuizState.PRE_QUIZ && (
        <DailyQuizPreScreen 
          onBack={onBack}
          onStartQuiz={onStartQuiz}
        />
      )}
      
      {quizState === QuizState.GAMEPLAY && questions && (
        <DailyQuizGameplay 
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          questions={questions}
          onAnswerSubmit={onAnswerSubmit}
          onNextQuestion={onNextQuestion}
          onPreviousQuestion={onPreviousQuestion}
          onCompleteQuiz={handleCompleteQuiz}
          userAnswers={userAnswers}
        />
      )}
      
      {quizState === QuizState.RESULTS && quizResults && (
        <DailyQuizResults 
          results={quizResults}
          onBack={onBack}
        />
      )}
    </div>
  );
} 