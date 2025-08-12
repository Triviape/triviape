import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Quiz, DifficultyLevel } from '@/app/types/quiz';
import { useBenchmark } from '@/app/hooks/performance/useBenchmark';
import { cn } from '@/app/lib/utils';

// Helper function to get difficulty badge color
const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case DifficultyLevel.Easy:
      return 'bg-green-100 text-green-800';
    case DifficultyLevel.Medium:
      return 'bg-yellow-100 text-yellow-800';
    case DifficultyLevel.Hard:
      return 'bg-orange-100 text-orange-800';
    case DifficultyLevel.Expert:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface QuizCardProps {
  quiz: Quiz;
  variant?: 'default' | 'compact' | 'featured';
  showImage?: boolean;
  ariaLabel?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  quiz, 
  variant = 'default',
  showImage = true,
  ariaLabel
}) => {
  // Performance benchmarking
  const metrics = useBenchmark({
    name: 'QuizCard',
    enabled: process.env.NODE_ENV === 'development',
    threshold: 32,
    onThresholdExceeded: (metrics) => {
      console.warn(`QuizCard render time exceeded threshold: ${metrics.renderTimeMs}ms`);
    }
  });

  // Format estimated duration from seconds to minutes
  const formattedDuration = Math.ceil(quiz.estimatedDuration / 60);
  
  // Determine card styling based on variant
  const getCardStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'featured':
        return 'ring-2 ring-primary/20 shadow-lg';
      default:
        return '';
    }
  };
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
        getCardStyles()
      )}
      aria-label={ariaLabel || `${quiz.title} quiz card`}
    >
      {showImage && (
        <div className="relative h-48 w-full">
          {quiz.coverImage ? (
            <Image
              src={quiz.coverImage}
              alt={`Cover image for ${quiz.title} quiz`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={variant === 'featured'}
            />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-white text-xl font-bold">{quiz.title}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {quiz.title}
          </h3>
          <span 
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              getDifficultyColor(quiz.difficulty)
            )}
            aria-label={`Difficulty level: ${quiz.difficulty}`}
          >
            {quiz.difficulty}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {quiz.description}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span aria-label={`Estimated duration: ${formattedDuration} minutes`}>
              {formattedDuration} min
            </span>
          </div>
          
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span aria-label={`${quiz.questionIds.length} questions`}>
              {quiz.questionIds.length} questions
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <Link 
            href={`/quiz/${quiz.id}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
            aria-label={`Start ${quiz.title} quiz`}
          >
            Start Quiz
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizCard; 