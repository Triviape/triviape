import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Quiz, DifficultyLevel } from '@/app/types/quiz';

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
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz }) => {
  // Format estimated duration from seconds to minutes
  const formattedDuration = Math.ceil(quiz.estimatedDuration / 60);
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-full">
        {quiz.coverImage ? (
          <Image
            src={quiz.coverImage}
            alt={quiz.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xl font-bold">{quiz.title}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{quiz.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{quiz.description}</p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formattedDuration} min</span>
          </div>
          
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{quiz.questionIds.length} questions</span>
          </div>
        </div>
        
        <div className="mt-4">
          <Link 
            href={`/quiz/${quiz.id}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300"
          >
            Start Quiz
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizCard; 