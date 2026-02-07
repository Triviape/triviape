'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DailyQuizArea } from '@/app/components/daily/DailyQuizArea';
import { updateDailyQuizCompletion } from '@/app/hooks/useDailyQuizStatus';
import { QuizState } from '@/app/page';

export default function DailyQuizPage() {
  const router = useRouter();
  const [quizState, setQuizState] = useState<QuizState>(QuizState.PRE_QUIZ);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [quizResults, setQuizResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  } | null>(null);
  
  const handleBack = () => {
    router.push('/');
  };
  
  const handleStartQuiz = () => {
    setQuizState(QuizState.GAMEPLAY);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
  };
  
  const handleAnswerSubmit = (questionId: string, answerIds: string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIds
    }));
  };
  
  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
  };
  
  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };
  
  const handleQuizComplete = async (results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  }) => {
    setQuizResults(results);
    setQuizState(QuizState.RESULTS);
    
    try {
      // Record the completion with the API
      await updateDailyQuizCompletion('daily-quiz', results.score);
    } catch (error) {
      console.error('Failed to record quiz completion:', error);
      // Show error to user
    }
  };
  
  return (
    <main className="container mx-auto p-4 pt-8 min-h-[90vh] flex flex-col">
      <DailyQuizArea
        quizState={quizState}
        onBack={handleBack}
        onStartQuiz={handleStartQuiz}
        onQuizComplete={handleQuizComplete}
        currentQuestionIndex={currentQuestionIndex}
        onAnswerSubmit={handleAnswerSubmit}
        onNextQuestion={handleNextQuestion}
        onPreviousQuestion={handlePreviousQuestion}
        userAnswers={userAnswers}
        quizResults={quizResults}
      />
    </main>
  );
} 
