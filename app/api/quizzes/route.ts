import { NextRequest } from 'next/server';
import { getQuizzes } from '@/app/lib/services/quiz/quizFetchService';
import { DifficultyLevel } from '@/app/types/quiz';
import { withApiErrorHandling } from '@/app/lib/apiUtils';

/**
 * GET /api/quizzes - Fetch quizzes with optional filtering
 * Query parameters:
 * - categoryId: string (optional) - Filter by category
 * - difficulty: DifficultyLevel (optional) - Filter by difficulty
 * - pageSize: number (optional) - Number of items per page (default: 10)
 */
export async function GET(request: NextRequest) {
  return withApiErrorHandling(request, async () => {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const categoryId = searchParams.get('categoryId') || undefined;
    const difficulty = searchParams.get('difficulty') as DifficultyLevel || undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Validate difficulty if provided
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new Error('Invalid difficulty level. Must be easy, medium, or hard.');
    }

    // Validate pageSize
    if (pageSize < 1 || pageSize > 50) {
      throw new Error('Page size must be between 1 and 50.');
    }

    // Fetch quizzes using the service
    const result = await getQuizzes({
      categoryId,
      difficulty,
      pageSize
    });

    // Return the results
    return {
      data: result.items,
      hasMore: result.hasMore,
      totalItems: result.items.length
    };
  });
}