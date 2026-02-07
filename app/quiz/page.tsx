import React from 'react';
import QuizList from '@/app/components/quiz/QuizList';
import { QuizService } from '@/app/lib/services/quizService';
import { QuizCategory } from '@/app/types/quiz';

// This is a server component that fetches categories
export async function generateMetadata() {
  return {
    title: 'Quizzes | Triviape',
    description: 'Browse and take quizzes on various topics',
  };
}

export default async function QuizzesPage() {
  // Fetch categories on the server
  let categories: QuizCategory[] = [];
  
  try {
    categories = await QuizService.getCategories();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
        <p className="text-gray-600">Browse and take quizzes on various topics</p>
      </div>
      
      {/* Categories Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`/quiz/category/${category.id}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-300"
            >
              {category.name}
            </a>
          ))}
        </div>
      </div>
      
      {/* Featured Quizzes Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Quizzes</h2>
        {/* Client component for fetching and displaying quizzes */}
        <QuizList limit={6} />
      </div>
      
      {/* All Quizzes Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Quizzes</h2>
        {/* Client component for fetching and displaying all quizzes */}
        <QuizList />
      </div>
    </div>
  );
} 
