import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { withApiErrorHandling, ApiErrorCode } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';
import { 
  AuthInputSchemas, 
  sanitizeAndValidate 
} from '@/app/lib/validation/securitySchemas';
import { 
  handleConflictError 
} from '@/app/lib/services/errorHandler';

/**
 * API route to handle user registration with enhanced security and rate limiting
 */
export async function POST(request: Request) {
  // Apply rate limiting to prevent abuse
  const rateLimitedHandler = withRateLimit(async (req: Request) => {
    return withApiErrorHandling(req, async () => {
      // Parse and validate request body
      const body = await request.json();
      
      // Validate input with security checks
      const validationResult = sanitizeAndValidate(AuthInputSchemas.register, body);
      
      if (!validationResult.success) {
        throw {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Invalid registration data',
          details: validationResult.errors,
          statusCode: 400
        };
      }
      
      const { email, password, displayName, acceptTerms } = validationResult.data!;
      
      // Check if user accepted terms
      if (!acceptTerms) {
        throw {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'You must accept the terms and conditions',
          statusCode: 400
        };
      }
      
      try {
        // Check if user already exists
        try {
          const existingUser = await FirebaseAdminService.getUserByEmail(email);
          if (existingUser) {
            throw handleConflictError('User with this email already exists', { email });
          }
        } catch (error: any) {
          // If user not found, that's what we want
          if (error.code !== 'auth/user-not-found') {
            throw error;
          }
        }
        
        // Create new user
        const userRecord = await FirebaseAdminService.createUser({
          email,
          password,
          displayName,
          emailVerified: false
        });
        
        // Send email verification
        await FirebaseAdminService.sendEmailVerification(userRecord.uid);
        
        // Return success - user should sign in via NextAuth
        return {
          success: true,
          userId: userRecord.uid,
          message: 'Registration successful. Please sign in with your new account.'
        };
      } catch (error: any) {
        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-exists') {
          throw {
            code: ApiErrorCode.CONFLICT,
            message: 'An account with this email already exists',
            statusCode: 409
          };
        }
        
        if (error.code === 'auth/weak-password') {
          throw {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'Password is too weak. Please use a stronger password.',
            statusCode: 400
          };
        }
        
        if (error.code === 'auth/invalid-email') {
          throw {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'Invalid email address',
            statusCode: 400
          };
        }
        
        // If it's any other error, rethrow it
        throw error;
      }
    });
  }, RateLimitConfigs.auth);

  return rateLimitedHandler(request);
} 