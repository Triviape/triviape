'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getQuizById, getQuestionsByIds } from '@/app/lib/services/quiz/quizFetchService';
import { Quiz, Question } from '@/app/types/quiz';
import QuestionCard from '@/app/components/quiz/QuestionCard';
import { useAuth } from '@/app/hooks/useAuth';
import { QuizErrorBoundary } from '@/app/components/errors/QuizErrorBoundary';


interface QuizSessionState {
  currentQuestionIndex: number;
  answers: {
    questionId: string;
    selectedAnswerIds: string[];
    isCorrect: boolean;
    timeSpent: number;
  }[];
  startTime: number;
  endTime?: number;
  score: number;
  maxScore: number;
  isComplete: boolean;
  timeRemaining?: number;
}

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function QuizStartPage({ params }: PageProps) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const [quizState, setQuizState] = useState<QuizSessionState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    score: 0,
    maxScore: 0,
    isComplete: false
  });
  
  // Load quiz and questions
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoading(true);
        
        // Fetch quiz
        const quizData = await getQuizById(params.id);
        if (!quizData) {
          throw new Error('Quiz not found');
        }
        
        setQuiz(quizData);
        
        // Fetch questions
        const questionIds = quizData.shuffleQuestions 
          ? [...quizData.questionIds].sort(() => Math.random() - 0.5) 
          : quizData.questionIds;
          
        const questionsData = await getQuestionsByIds(questionIds);
        setQuestions(questionsData);
        
        // Initialize quiz state
        const maxPossibleScore = questionsData.reduce((total, q) => total + q.points, 0);
        
        setQuizState({
          currentQuestionIndex: 0,
          answers: [],
          startTime: Date.now(),
          score: 0,
          maxScore: maxPossibleScore,
          isComplete: false,
          timeRemaining: quizData.timeLimit
        });
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load quiz'));
        setLoading(false);
      }
    };
    
    loadQuizData();
  }, [params.id]);
  
  // Timer for quiz time limit
  useEffect(() => {
    if (!quiz?.timeLimit || quizState.isComplete) return;
    
    const timer = setInterval(() => {
      setQuizState(prev => {
        // If time is up, complete the quiz
        if (prev.timeRemaining !== undefined && prev.timeRemaining <= 0) {
          clearInterval(timer);
          return {
            ...prev,
            isComplete: true,
            endTime: Date.now(),
            timeRemaining: 0
          };
        }
        
        // Otherwise, decrement the time
        return {
          ...prev,
          timeRemaining: prev.timeRemaining !== undefined ? prev.timeRemaining - 1 : undefined
        };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quiz, quizState.isComplete]);
  
  // Auto-submit quiz when completed
  useEffect(() => {
    if (quizState.isComplete && quizState.answers.length > 0) {
      handleFinish();
    }
  }, [quizState.isComplete, quizState.answers.length, handleFinish]);
  
  // Handle answering a question
  const handleAnswer = (questionId: string, selectedAnswerIds: string[]) => {
    const currentQuestion = questions[quizState.currentQuestionIndex];
    
    // Calculate if the answer is correct
    const correctAnswerIds = currentQuestion.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);
    
    const isCorrect = 
      selectedAnswerIds.length === correctAnswerIds.length && 
      selectedAnswerIds.every(id => correctAnswerIds.includes(id));
    
    // Calculate points earned
    const pointsEarned = isCorrect ? currentQuestion.points : 0;
    
    // Calculate time spent on this question
    const timeSpent = Math.floor((Date.now() - quizState.startTime) / 1000);
    
    // Update quiz state
    setQuizState(prev => {
      const newAnswers = [
        ...prev.answers,
        {
          questionId,
          selectedAnswerIds,
          isCorrect,
          timeSpent
        }
      ];
      
      const newScore = prev.score + pointsEarned;
      const isLastQuestion = prev.currentQuestionIndex === questions.length - 1;
      
      return {
        ...prev,
        answers: newAnswers,
        score: newScore,
        currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        isComplete: isLastQuestion,
        endTime: isLastQuestion ? Date.now() : undefined
      };
    });
  };
  
  // Handle skipping a question
  const handleSkip = () => {
    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };
  
  // Handle finishing the quiz
  const handleFinish = useCallback(async () => {
    if (!quiz || !questions.length || !quizState.isComplete) {
      console.error('Cannot finish quiz: missing required data');
      return;
    }

    try {
      // Use the standardized completion handler
      const { submitQuizCompletion } = await import('@/app/lib/services/quiz/quizCompletionHandler');
      
      // Format answers according to the expected schema
      const formattedAnswers = quizState.answers.map(answer => ({
        questionId: answer.questionId,
        selectedAnswerIds: answer.selectedAnswerIds,
        timeSpent: answer.timeSpent,
        wasSkipped: false // Current implementation doesn't track skips in this flow
      }));
      
      const completionData = {
        quizId: params.id,
        startTime: quizState.startTime,
        endTime: quizState.endTime || Date.now(),
        answers: formattedAnswers,
        questionSequence: questions.map(q => q.id)
      };
      
      // Submit using standardized flow
      const result = await submitQuizCompletion(completionData);
      
      // Redirect to results page on success
      router.push(`/quiz/${params.id}/results?score=${result.score}&totalQuestions=${result.totalQuestions}&correctAnswers=${result.correctAnswers}&xpEarned=${result.xpEarned}&coinsEarned=${result.coinsEarned}`);
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      // For now, still redirect to results page but maybe show an error state
      // In production, you'd want to show a proper error message to the user
      router.push(`/quiz/${params.id}/results?error=submission_failed`);
    }
  }, [quiz, questions, quizState.isComplete, quizState.startTime, quizState.endTime, quizState.answers, params.id, router]);
  
  if (loading) {
    return (
      <QuizErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading quiz...</p>
          </div>
        </div>
      </QuizErrorBoundary>
    );
  }
  
  if (error) {
    return (
      <QuizErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error.message}</span>
          </div>
        </div>
      </QuizErrorBoundary>
    );
  }
  
  if (!quiz || questions.length === 0) {
    return (
      <QuizErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
            <p className="text-gray-600 mb-6">The quiz you&apos;re looking for doesn&apos;t exist or has no questions.</p>
            <button
              onClick={() => router.push('/quiz')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </QuizErrorBoundary>
    );
  }
  
  // If quiz is complete, show results
  if (quizState.isComplete) {
    const correctAnswers = quizState.answers.filter(a => a.isCorrect).length;
    const scorePercentage = Math.round((quizState.score / quizState.maxScore) * 100);
    const isPassing = quiz.passingScore ? scorePercentage >= quiz.passingScore : true;
    
    return (
      <QuizErrorBoundary>
        <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
          
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              {isPassing ? (
                <div className="bg-green-100 text-green-800 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="bg-red-100 text-red-800 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-center mb-2">
              {isPassing ? 'Congratulations!' : 'Better luck next time!'}
            </h3>
            
            <p className="text-center text-gray-600 mb-6">
              {isPassing 
                ? 'You passed the quiz successfully.' 
                : `You didn&apos;t reach the passing score of ${quiz.passingScore}%.`}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-500 mb-1">Score</div>
              <div className="text-2xl font-bold">{scorePercentage}%</div>
              <div className="text-sm text-gray-500">{quizState.score} / {quizState.maxScore} points</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-500 mb-1">Correct Answers</div>
              <div className="text-2xl font-bold">{correctAnswers} / {questions.length}</div>
              <div className="text-sm text-gray-500">
                {Math.round((correctAnswers / questions.length) * 100)}% accuracy
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              See Detailed Results
            </button>
          </div>
        </div>
        </div>
      </QuizErrorBoundary>
    );
  }
  
  // Show current question
  const currentQuestion = questions[quizState.currentQuestionIndex];
  const currentAnswer = quizState.answers.find(a => a.questionId === currentQuestion.id);
  const isAnswered = !!currentAnswer;
  
  return (
    <QuizErrorBoundary>
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          
          {quizState.timeRemaining !== undefined && (
            <div className="text-lg font-medium">
              Time: {Math.floor(quizState.timeRemaining / 60)}:{(quizState.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((quizState.currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Question {quizState.currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>
      
      <QuestionCard
        question={currentQuestion}
        onAnswer={handleAnswer}
        isAnswered={isAnswered}
        selectedAnswerIds={currentAnswer?.selectedAnswerIds || []}
        showCorrectAnswer={isAnswered}
        timeRemaining={quizState.timeRemaining}
      />
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.push(`/quiz/${params.id}`)}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
        >
          Exit Quiz
        </button>
        
        {!isAnswered && quizState.currentQuestionIndex < questions.length - 1 && (
          <button
            onClick={handleSkip}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Skip Question
          </button>
        )}
      </div>
      </div>
    </QuizErrorBoundary>
  );
} 