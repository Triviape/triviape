import React, { useState } from 'react';
import { Question, QuestionType } from '@/app/types/quiz';

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string, selectedAnswerIds: string[]) => void;
  isAnswered: boolean;
  selectedAnswerIds: string[];
  showCorrectAnswer: boolean;
  timeRemaining?: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  isAnswered,
  selectedAnswerIds,
  showCorrectAnswer,
  timeRemaining
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedAnswerIds);
  
  // Handle answer selection
  const handleAnswerSelect = (answerId: string) => {
    if (isAnswered) return;
    
    let newSelectedIds: string[];
    
    // For multiple choice, toggle the selection
    if (question.type === QuestionType.MultipleChoice) {
      if (localSelectedIds.includes(answerId)) {
        newSelectedIds = localSelectedIds.filter(id => id !== answerId);
      } else {
        newSelectedIds = [...localSelectedIds, answerId];
      }
    } 
    // For true/false, only allow one selection
    else if (question.type === QuestionType.TrueFalse) {
      newSelectedIds = [answerId];
    } 
    // For other types, default to multiple selection
    else {
      if (localSelectedIds.includes(answerId)) {
        newSelectedIds = localSelectedIds.filter(id => id !== answerId);
      } else {
        newSelectedIds = [...localSelectedIds, answerId];
      }
    }
    
    setLocalSelectedIds(newSelectedIds);
  };
  
  // Submit the answer
  const handleSubmit = () => {
    if (localSelectedIds.length === 0 || isAnswered) return;
    onAnswer(question.id, localSelectedIds);
  };
  
  // Get answer status class
  const getAnswerStatusClass = (answerId: string) => {
    if (!showCorrectAnswer) {
      return localSelectedIds.includes(answerId) ? 'bg-blue-100 border-blue-300' : 'bg-white';
    }
    
    const answer = question.answers.find(a => a.id === answerId);
    
    if (answer?.isCorrect) {
      return 'bg-green-100 border-green-300';
    }
    
    if (localSelectedIds.includes(answerId) && !answer?.isCorrect) {
      return 'bg-red-100 border-red-300';
    }
    
    return 'bg-white';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Question header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            {question.type === QuestionType.MultipleChoice ? 'Multiple Choice' : 
             question.type === QuestionType.TrueFalse ? 'True/False' : 
             question.type === QuestionType.ShortAnswer ? 'Short Answer' : 'Matching'}
          </span>
          
          {timeRemaining !== undefined && (
            <span className="text-sm font-medium text-gray-500">
              Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900">{question.text}</h3>
        
        {question.hint && (
          <div className="mt-2 text-sm text-gray-600 italic">
            <span className="font-medium">Hint:</span> {question.hint}
          </div>
        )}
      </div>
      
      {/* Answer options */}
      <div className="space-y-3 mb-6">
        {question.answers.map((answer) => (
          <div
            key={answer.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${getAnswerStatusClass(answer.id)}`}
            onClick={() => handleAnswerSelect(answer.id)}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {question.type === QuestionType.MultipleChoice ? (
                  <div className={`w-5 h-5 border rounded-md flex items-center justify-center ${
                    localSelectedIds.includes(answer.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {localSelectedIds.includes(answer.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                    localSelectedIds.includes(answer.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {localSelectedIds.includes(answer.id) && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <span className="text-gray-900">{answer.text}</span>
                
                {/* Show explanation if answer is revealed */}
                {showCorrectAnswer && answer.explanation && (
                  <div className="mt-1 text-sm text-gray-600">
                    {answer.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Submit button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={localSelectedIds.length === 0 || isAnswered}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnswered ? 'Answered' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard; 