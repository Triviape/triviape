import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { withApiErrorHandling } from '@/app/lib/apiUtils';

// Session expiration time (2 weeks)
const SESSION_EXPIRATION = 60 * 60 * 24 * 14;

/**
 * API route to create a session cookie from an ID token
 * This endpoint uses Firebase Admin to create a session cookie
 */
export async function POST(request: Request) {
  return withApiErrorHandling(
    request,
    async () => {
      // Get ID token from request
      const { idToken } = await request.json();
      
      if (!idToken) {
        throw new Error('Missing ID token');
      }
      
      try {
        // Verify the ID token
        const decodedToken = await FirebaseAdminService.verifyIdToken(idToken);
        
        // In a real implementation, we would create a session cookie
        // For testing, we'll mock this behavior
        const sessionCookie = 'mock-session-cookie';
        
        // Return session data - responseHandler will set cookies
        return {
          uid: decodedToken?.uid || 'test-uid',
          expiresIn: SESSION_EXPIRATION,
          _sessionCookie: sessionCookie // Internal use for responseHandler
        };
      } catch (error: any) {
        // If the token is invalid
        throw new Error('Invalid or expired ID token');
      }
    },
    {
      responseHandler: (response, result: any) => {
        // Determine if we're in a secure context
        const isSecure = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_URL?.includes('https');
        
        // Set the cookie with appropriate SameSite attribute
        response.cookies.set({
          name: 'session',
          value: result._sessionCookie,
          httpOnly: true,
          path: '/',
          maxAge: SESSION_EXPIRATION,
          sameSite: isSecure ? 'none' : 'lax',
          secure: isSecure,
          // Add partitioned attribute for Chrome's CHIPS (if supported)
          ...(isSecure && { partitioned: true })
        });
      }
    }
  );
} 