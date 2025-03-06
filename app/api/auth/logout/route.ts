import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * API route to handle user logout
 * This endpoint clears the session cookie
 */
export async function POST(request: Request) {
  try {
    // Create a response with success message
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
    
    // Determine if we're in a secure context
    const isSecure = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_URL?.includes('https');
    
    // Clear the session cookie with the same settings as when it was created
    response.cookies.set('session', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      ...(isSecure && { partitioned: true })
    });
    
    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred during logout',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 