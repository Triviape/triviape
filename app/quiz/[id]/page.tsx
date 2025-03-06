import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getQuizById, getCategories } from '@/app/lib/services/quiz/quizFetchService';
import { DifficultyLevel } from '@/app/types/quiz';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Generate metadata for the page
export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const quiz = await getQuizById(params.id);
  
  if (!quiz) {
    return {
      title: 'Quiz Not Found | Triviape',
      description: 'The requested quiz could not be found.',
    };
  }
  
  return {
    title: `${quiz.title} | Triviape`,
    description: quiz.description,
  };
}

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

// Define the params type for page
interface QuizPageParams {
  id: string;
}

// Define the page component
export default async function QuizPage({ 
  params 
}: { 
  params: QuizPageParams;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Fetch quiz data
  const quiz = await getQuizById(params.id);
  
  // If quiz not found, show 404 page
  if (!quiz) {
    notFound();
  }
  
  // Fetch categories to display category names
  const categories = await getCategories();
  
  // Find category names for this quiz
  const quizCategories = categories.filter(category => 
    quiz.categoryIds.includes(category.id)
  );
  
  // Format estimated duration from seconds to minutes
  const formattedDuration = Math.ceil(quiz.estimatedDuration / 60);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link 
          href="/quiz"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Quizzes
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Quiz Header */}
        <div className="relative h-64 w-full">
          {quiz.coverImage ? (
            <Image
              src={quiz.coverImage}
              alt={quiz.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <h1 className="text-white text-3xl font-bold px-4 text-center">{quiz.title}</h1>
            </div>
          )}
          
          {/* Overlay for text if there's an image */}
          {quiz.coverImage && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <h1 className="text-white text-3xl font-bold px-4 text-center">{quiz.title}</h1>
            </div>
          )}
        </div>
        
        {/* Quiz Details */}
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-sm px-3 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
              {quiz.difficulty}
            </span>
            
            {quizCategories.map(category => (
              <span key={category.id} className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                {category.name}
              </span>
            ))}
          </div>
          
          <p className="text-gray-700 mb-6">{quiz.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Questions</div>
              <div className="text-xl font-semibold">{quiz.questionIds.length}</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Duration</div>
              <div className="text-xl font-semibold">{formattedDuration} min</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">XP Reward</div>
              <div className="text-xl font-semibold">{quiz.baseXP} XP</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Coins Reward</div>
              <div className="text-xl font-semibold">{quiz.baseCoins} coins</div>
            </div>
          </div>
          
          {quiz.passingScore && (
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-1">Passing Score</div>
              <div className="text-lg font-medium">{quiz.passingScore}%</div>
            </div>
          )}
          
          <div className="flex justify-center">
            <Link
              href={`/quiz/${quiz.id}/start`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition-colors duration-300 text-center"
            >
              Start Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 