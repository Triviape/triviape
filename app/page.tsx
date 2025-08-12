'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { HeroSection } from '@/app/components/home/hero-section';
import { ShadcnSidebar } from '@/app/components/navigation/shadcn-sidebar';
import { DailyQuizArea } from '@/app/components/daily/DailyQuizArea';
import { StageArea } from '@/app/components/home/stage-area';

// Define quiz state constants
export enum QuizState {
  HERO = 'HERO',
  PRE_QUIZ = 'PRE_QUIZ',
  GAMEPLAY = 'GAMEPLAY',
  RESULTS = 'RESULTS'
}

export default function Home() {
  // Quiz state management
  const [quizState, setQuizState] = useState<QuizState>(QuizState.HERO);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [quizResults, setQuizResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  } | null>(null);
  
  // Event handlers for quiz state transitions
  const handleStartDailyQuiz = () => {
    setQuizState(QuizState.PRE_QUIZ);
  };
  
  const handleBackToHome = () => {
    setQuizState(QuizState.HERO);
    // Reset quiz state
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizResults(null);
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

  const handleQuizComplete = (results: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  }) => {
    setQuizResults(results);
    setQuizState(QuizState.RESULTS);
  };

  const handleStartTeamQuiz = () => {
    // Navigate to team quiz page
    window.location.href = '/team';
  };

  const handleStartChallengeQuiz = () => {
    // Navigate to challenge quiz page
    window.location.href = '/challenge';
  };
  
  return (
    <AppLayout
      header={<Navbar />}
      sidebar={<ShadcnSidebar />}
      className="bg-background"
      useShadcnSidebar={true}
      maxWidth="xl"
    >
      <div className="w-full py-6 relative">
        <div className="flex flex-col md:flex-row w-full gap-8 min-h-[calc(100vh-12rem)]">
          {/* Left side - Hero Section or Daily Quiz */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            {quizState === QuizState.HERO ? (
              <HeroSection className="h-full" />
            ) : (
              <DailyQuizArea 
                quizState={quizState} 
                onBack={handleBackToHome}
                onStartQuiz={handleStartQuiz}
                onQuizComplete={handleQuizComplete}
                currentQuestionIndex={currentQuestionIndex}
                onAnswerSubmit={handleAnswerSubmit}
                onNextQuestion={handleNextQuestion}
                onPreviousQuestion={handlePreviousQuestion}
                userAnswers={userAnswers}
                quizResults={quizResults}
                className="h-full"
              />
            )}
          </div>
          
          {/* Right side - Stage Area with Game Mode Buttons */}
          <div className="w-full md:w-1/2 flex flex-col">
            <StageArea 
              className="h-full" 
              onDailyClick={handleStartDailyQuiz}
              onTeamClick={handleStartTeamQuiz}
              onChallengeClick={handleStartChallengeQuiz}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
