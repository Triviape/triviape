'use client';

import React, { useState } from 'react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Question } from '@/app/types/quiz';
import { ChevronLeft, ChevronRight, Check, Flag } from 'lucide-react';

interface DailyQuizGameplayProps {
  className?: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: Question[];
  onAnswerSubmit: (questionId: string, answerIds: string[]) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onCompleteQuiz: () => void;
  userAnswers: Record<string, string[]>;
}

export function DailyQuizGameplay({
  className,
  currentQuestionIndex,
  totalQuestions,
  questions,
  onAnswerSubmit,
  onNextQuestion,
  onPreviousQuestion,
  onCompleteQuiz,
  userAnswers
}: DailyQuizGameplayProps) {
  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Track local selected answer state
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>(
    userAnswers[currentQuestion?.id] || []
  );
  
  // Reset selected answers when question changes
  React.useEffect(() => {
    setSelectedAnswerIds(userAnswers[currentQuestion?.id] || []);
  }, [currentQuestion?.id, userAnswers]);
  
  // No question to display
  if (!currentQuestion) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center w-full h-full p-8 bg-card rounded-lg",
        className
      )}>
        <div className="text-xl font-medium">Question not found</div>
      </div>
    );
  }
  
  // Handle answer selection
  const handleAnswerSelect = (answerId: string) => {
    // Create a new selection array based on the current selection
    let newSelectedIds: string[];
    
    // For true/false questions, only allow one selection
    if (currentQuestion.type === 'true_false') {
      newSelectedIds = [answerId];
    } else if (selectedAnswerIds.includes(answerId)) {
      // For other questions, toggle the selection
      newSelectedIds = selectedAnswerIds.filter(id => id !== answerId);
    } else {
      newSelectedIds = [...selectedAnswerIds, answerId];
    }
    
    // Update local state
    setSelectedAnswerIds(newSelectedIds);
    
    // Send selection to parent
    onAnswerSubmit(currentQuestion.id, newSelectedIds);
  };
  
  // Handle moving to the next question
  const handleNextQuestion = () => {
    // If this is the last question, complete the quiz
    if (currentQuestionIndex === totalQuestions - 1) {
      onCompleteQuiz();
    } else {
      onNextQuestion();
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  
  // Check if all questions have been answered
  const allQuestionsAnswered = questions.every(q => (userAnswers[q.id] || []).length > 0);
  
  return (
    <div className={cn(
      "flex flex-col w-full h-full bg-card rounded-lg animate-in fade-in",
      className
    )}>
      {/* Progress bar and question number */}
      <div className="px-6 pt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          {allQuestionsAnswered && (
            <button 
              onClick={onCompleteQuiz}
              className="text-sm text-primary flex items-center gap-1"
            >
              <Flag className="h-3 w-3" /> Finish Quiz
            </button>
          )}
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question text */}
      <div className="p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">
          {currentQuestion.text}
        </h2>
        
        {/* Hint if available */}
        {currentQuestion.hint && (
          <p className="text-sm text-muted-foreground mb-4 italic">
            Hint: {currentQuestion.hint}
          </p>
        )}
        
        {/* Answer options */}
        <div className="space-y-3 mt-6">
          {currentQuestion.answers.map((answer) => {
            const isSelected = selectedAnswerIds.includes(answer.id);
            
            return (
              <button
                key={answer.id}
                onClick={() => handleAnswerSelect(answer.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  isSelected 
                    ? "bg-primary/10 border-primary" 
                    : "bg-background hover:bg-secondary/50 border-border"
                )}
              >
                <div className="flex items-center">
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center mr-3 flex-shrink-0",
                    isSelected 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-input"
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <span>{answer.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="mt-auto p-6 flex justify-between">
        <Button
          variant="outline"
          onClick={onPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex gap-2 items-center"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <Button
          onClick={handleNextQuestion}
          disabled={selectedAnswerIds.length === 0}
          className="flex gap-2 items-center"
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Complete' : 'Next'}
          {currentQuestionIndex < totalQuestions - 1 && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
} 