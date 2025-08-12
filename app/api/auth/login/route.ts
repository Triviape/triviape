import { NextResponse } from 'next/server';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { withApiErrorHandling, ApiErrorCode, generateRequestId } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';
import { 
  AuthInputSchemas, 
  sanitizeAndValidate 
} from '@/app/lib/validation/securitySchemas';
import { 
  ServiceError, 
  ServiceErrorType, 
  handleValidationError,
  handleAuthError 
} from '@/app/lib/services/errorHandler';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { initializeFirebaseAuth } from '@/app/lib/firebase';

/**
 * API route to handle user login with enhanced security and rate limiting
 */
export async function POST(request: Request) {
  // Apply rate limiting to prevent brute force attacks
  const rateLimitedHandler = withRateLimit(async (req: Request) => {
    return withApiErrorHandling(req, async () => {
      // Parse and validate request body
      const body = await request.json();
      
      // Validate input with security checks
      const validationResult = sanitizeAndValidate(AuthInputSchemas.login, body);
      
      if (!validationResult.success) {
        throw {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Invalid login data',
          details: validationResult.errors,
          statusCode: 400
        };
      }
      
      const { email, password, rememberMe } = validationResult.data!;
      
      try {
        // SECURITY FIX: Properly verify password using Firebase Auth
        // This ensures passwords are actually validated before creating tokens
        const auth = initializeFirebaseAuth();
        let userCredential;
        
        try {
          // Verify credentials with Firebase Auth (this validates the password)
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (authError: any) {
          // Handle authentication errors with consistent messaging
          if (authError.code === 'auth/user-not-found' || 
              authError.code === 'auth/wrong-password' ||
              authError.code === 'auth/invalid-credential') {
            throw {
              code: ApiErrorCode.UNAUTHORIZED,
              message: 'Invalid email or password',
              statusCode: 401
            };
          }
          
          if (authError.code === 'auth/too-many-requests') {
            throw {
              code: ApiErrorCode.BAD_REQUEST,
              message: 'Too many failed login attempts. Please try again later or reset your password.',
              statusCode: 429
            };
          }
          
          // Handle other auth errors
          throw {
            code: ApiErrorCode.UNAUTHORIZED,
            message: getAuthErrorMessage(authError),
            statusCode: 401
          };
        }
        
        // Password verified successfully, now create a custom token for session management
        const customToken = await FirebaseAdminService.createCustomToken(userCredential.user.uid);
        
        // Get additional user info from Admin SDK for consistency
        const userRecord = await FirebaseAdminService.getUserByEmail(email);
        
        // Return success response with verified credentials
        return NextResponse.json({
          success: true,
          data: {
            token: customToken,
            user: {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userRecord.displayName || userCredential.user.displayName,
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: generateRequestId()
          }
        });
      } catch (error: any) {
        // If error is already formatted, rethrow it
        if (error.code && error.statusCode) {
          throw error;
        }
        
        // Handle unexpected errors
        console.error('Unexpected login error:', error);
        throw {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred during login',
          statusCode: 500
        };
      }
    });
  }, RateLimitConfigs.auth);

  return rateLimitedHandler(request);
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 