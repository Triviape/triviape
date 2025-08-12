import { NextRequest, NextResponse } from 'next/server';
import { getQuizzes } from '@/app/lib/services/quiz/quizFetchService';
import { DifficultyLevel } from '@/app/types/quiz';

/**
 * GET /api/quizzes - Fetch quizzes with optional filtering
 * Query parameters:
 * - categoryId: string (optional) - Filter by category
 * - difficulty: DifficultyLevel (optional) - Filter by difficulty
 * - pageSize: number (optional) - Number of items per page (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const categoryId = searchParams.get('categoryId') || undefined;
    const difficulty = searchParams.get('difficulty') as DifficultyLevel || undefined;
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    // Validate difficulty if provided
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level. Must be easy, medium, or hard.' },
        { status: 400 }
      );
    }

    // Validate pageSize
    if (pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: 'Page size must be between 1 and 50.' },
        { status: 400 }
      );
    }

    // Fetch quizzes using the service
    const result = await getQuizzes({
      categoryId,
      difficulty,
      pageSize
    });

    // Return the results
    return NextResponse.json({
      success: true,
      data: result.items,
      hasMore: result.hasMore,
      totalItems: result.items.length
    });

  } catch (error) {
    console.error('Error fetching quizzes:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch quizzes',
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}