import React from 'react';
import { Quiz, DifficultyLevel } from '@/app/types/quiz';
import QuizCard from './QuizCard';
import useQuizzes from '@/app/hooks/useQuizzes';

interface QuizListProps {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  limit?: number;
}

const QuizList: React.FC<QuizListProps> = ({ 
  categoryId, 
  difficulty,
  limit = 10
}) => {
  const { 
    quizzes, 
    loading, 
    error, 
    hasMore, 
    loadMore 
  } = useQuizzes({ 
    categoryId, 
    difficulty, 
    pageSize: limit 
  });

  if (loading && quizzes.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error.message || 'Failed to load quizzes'}</span>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-600">
            {categoryId 
              ? 'No quizzes available in this category.' 
              : 'No quizzes available at the moment.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizList; 