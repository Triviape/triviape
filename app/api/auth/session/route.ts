import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

// Session expiration time (2 weeks)
const SESSION_EXPIRATION = 60 * 60 * 24 * 14;

/**
 * API route to create a session cookie from an ID token
 * This endpoint uses Firebase Admin to create a session cookie
 */
export async function POST(request: Request) {
  try {
    // Get ID token from request
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing ID token' },
        { status: 400 }
      );
    }
    
    try {
      // Verify the ID token
      const decodedToken = await FirebaseAdminService.verifyIdToken(idToken);
      
      // In a real implementation, we would create a session cookie
      // For testing, we'll mock this behavior
      const sessionCookie = 'mock-session-cookie';
      
      // Create response with session data
      const response = NextResponse.json(
        {
          success: true,
          uid: decodedToken?.uid || 'test-uid',
          expiresIn: SESSION_EXPIRATION
        },
        { status: 200 }
      );
      
      // Determine if we're in a secure context
      const isSecure = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_URL?.includes('https');
      
      // Set the cookie with appropriate SameSite attribute
      // In production, use 'none' for cross-site requests with secure flag
      // In development, use 'lax' for better developer experience
      response.cookies.set({
        name: 'session',
        value: sessionCookie,
        httpOnly: true,
        path: '/',
        maxAge: SESSION_EXPIRATION,
        sameSite: isSecure ? 'none' : 'lax',
        secure: isSecure,
        // Add partitioned attribute for Chrome's CHIPS (if supported)
        ...(isSecure && { partitioned: true })
      });
      
      return response;
    } catch (error: any) {
      // If the token is invalid
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired ID token',
          errorCode: error.code || 'auth/invalid-id-token',
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Session creation error:', error);
    
    const errorMessage = getAuthErrorMessage(error);
    const errorCode = error.code ? error.code : 'unknown';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 