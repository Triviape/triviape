import React, { useState, useCallback } from 'react';
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

  const isMultiSelect = question.type === QuestionType.MultipleChoice;
  const optionRole = isMultiSelect ? 'checkbox' : 'radio';
  const groupRole = isMultiSelect ? 'group' : 'radiogroup';

  const handleAnswerSelect = useCallback((answerId: string) => {
    if (isAnswered) return;

    let newSelectedIds: string[];

    if (isMultiSelect) {
      if (localSelectedIds.includes(answerId)) {
        newSelectedIds = localSelectedIds.filter(id => id !== answerId);
      } else {
        newSelectedIds = [...localSelectedIds, answerId];
      }
    } else {
      newSelectedIds = [answerId];
    }

    setLocalSelectedIds(newSelectedIds);
  }, [isAnswered, isMultiSelect, localSelectedIds]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, answerId: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleAnswerSelect(answerId);
    }
  }, [handleAnswerSelect]);

  const handleSubmit = () => {
    if (localSelectedIds.length === 0 || isAnswered) return;
    onAnswer(question.id, localSelectedIds);
  };

  const getAnswerStatusClass = (answerId: string) => {
    if (!showCorrectAnswer) {
      return localSelectedIds.includes(answerId)
        ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400'
        : 'bg-white';
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

  const questionTypeLabel =
    question.type === QuestionType.MultipleChoice ? 'Multiple Choice' :
    question.type === QuestionType.TrueFalse ? 'True/False' :
    question.type === QuestionType.ShortAnswer ? 'Short Answer' : 'Matching';

  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label={`Question: ${question.text}`}>
      {/* Question header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500">
            {questionTypeLabel}
          </span>

          {timeRemaining !== undefined && (
            <span className="text-sm font-medium text-gray-500" aria-live="polite" aria-atomic="true">
              Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900" id={`question-${question.id}`}>
          {question.text}
        </h3>

        {question.hint && (
          <div className="mt-2 text-sm text-gray-600 italic">
            <span className="font-medium">Hint:</span> {question.hint}
          </div>
        )}
      </div>

      {/* Answer options */}
      <div
        className="space-y-3 mb-6"
        role={groupRole}
        aria-labelledby={`question-${question.id}`}
      >
        {question.answers.map((answer) => {
          const isSelected = localSelectedIds.includes(answer.id);

          return (
            <div
              key={answer.id}
              role={optionRole}
              aria-checked={isSelected}
              aria-disabled={isAnswered}
              aria-label={answer.text}
              tabIndex={isAnswered ? -1 : 0}
              className={`border rounded-lg p-4 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${getAnswerStatusClass(answer.id)} ${isAnswered ? 'cursor-default' : ''}`}
              onClick={() => handleAnswerSelect(answer.id)}
              onKeyDown={(e) => handleKeyDown(e, answer.id)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  {isMultiSelect ? (
                    <div className={`w-5 h-5 border rounded-md flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div className={`w-5 h-5 border rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
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
          );
        })}
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={localSelectedIds.length === 0 || isAnswered}
          className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isAnswered ? 'Answered' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
