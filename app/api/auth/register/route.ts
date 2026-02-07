import type { NextRequest } from 'next/server';
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
import { createSessionCookie } from '@/app/lib/authUtils';
import { signInWithEmailAndPasswordViaRest } from '@/app/lib/auth-config';

/**
 * API route to handle user registration with enhanced security and rate limiting
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting to prevent abuse
  const rateLimitedHandler = withRateLimit(async (req: NextRequest) => {
    return withApiErrorHandling(req, async () => {
      // Parse and validate request body
      const body = await req.json();
      
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
        
        // TODO: Send email verification via generateEmailVerificationLink + email service when implemented
        // Firebase Admin SDK does not have sendEmailVerification; use auth().generateEmailVerificationLink(email) + email provider

        // Sign in once via Firebase REST to get an ID token for session cookie issuance.
        const signInResult = await signInWithEmailAndPasswordViaRest(email, password);
        const sessionResult = await createSessionCookie(signInResult.idToken);

        if (sessionResult && typeof sessionResult === 'object' && !sessionResult.success) {
          throw {
            code: ApiErrorCode.INTERNAL_ERROR,
            message: sessionResult.error || 'Failed to create session',
            statusCode: 500
          };
        }

        return {
          success: true,
          userId: userRecord.uid,
          message: 'Registration successful',
          autoSignedIn: true
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
