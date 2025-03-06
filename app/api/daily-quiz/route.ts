import { NextResponse } from 'next/server';
import { getDailyQuiz } from '@/app/actions/quizActions';

/**
 * GET /api/daily-quiz
 * Returns the quiz designated for the current day
 */
export async function GET() {
  try {
    const dailyQuiz = await getDailyQuiz();
    
    if (!dailyQuiz) {
      return NextResponse.json(
        { error: 'No daily quiz available' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(dailyQuiz);
  } catch (error) {
    console.error('Error fetching daily quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily quiz' },
      { status: 500 }
    );
  }
} 