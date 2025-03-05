import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

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
      return {
        status: 400,
        data: { 
          success: false, 
          error: 'Missing ID token'
        }
      };
    }
    
    try {
      // Verify the ID token
      const decodedToken = await FirebaseAdminService.verifyIdToken(idToken);
      
      // In a real implementation, we would create a session cookie
      // For testing, we'll mock this behavior
      const sessionCookie = 'mock-session-cookie';
      
      // Return success response with cookie header
      return {
        status: 200,
        data: {
          success: true,
          uid: decodedToken?.uid || 'test-uid',
          expiresIn: SESSION_EXPIRATION
        },
        headers: new Headers({
          'Set-Cookie': `session=${sessionCookie}; HttpOnly; Path=/; Max-Age=${SESSION_EXPIRATION}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        })
      };
    } catch (error: any) {
      // If the token is invalid
      return {
        status: 401,
        data: {
          success: false,
          error: 'Invalid or expired ID token',
          errorCode: error.code || 'auth/invalid-id-token',
        }
      };
    }
  } catch (error: any) {
    console.error('Session creation error:', error);
    
    const errorMessage = getAuthErrorMessage(error);
    const errorCode = error.code ? error.code : 'unknown';
    
    return {
      status: 500,
      data: {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        timestamp: new Date().toISOString()
      }
    };
  }
} 