import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { submitQuizAttempt } from '@/app/actions/quizActions';

/**
 * POST endpoint for submitting quiz attempts
 * This ensures the UI can submit quiz attempts without directly
 * exposing the server action.
 */
export async function POST(request: NextRequest) {
  try {
    // First, authenticate the request
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward the form data to the server action
    const formData = await request.formData();
    const result = await submitQuizAttempt(formData);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error submitting quiz attempt:', error);
    
    return NextResponse.json(
      { message: error.message || 'Failed to submit quiz attempt' },
      { status: 500 }
    );
  }
} 