import { NextResponse } from 'next/server';
import { withApiErrorHandling } from '@/app/lib/apiUtils';

/**
 * API route to handle user logout
 * This endpoint clears the session cookie
 */
export async function POST(request: Request) {
  return withApiErrorHandling(request, async () => {
    // Determine if we're in a secure context
    const isSecure = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_URL?.includes('https');
    
    // Create response (withApiErrorHandling wraps it automatically)
    const response = NextResponse.json({});
    
    // Clear the session cookie with the same settings as when it was created
    response.cookies.set('session', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      ...(isSecure && { partitioned: true })
    });
    
    return { message: 'Logged out successfully' };
  }, {
    responseHandler: (response) => {
      // Clear the session cookie on the response
      const isSecure = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_URL?.includes('https');
      response.cookies.set('session', '', {
        path: '/',
        maxAge: 0,
        httpOnly: true,
        sameSite: isSecure ? 'none' : 'lax',
        secure: isSecure,
        ...(isSecure && { partitioned: true })
      });
    }
  });
} 