import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  UserCredential
} from 'firebase/auth';
import { getAuthInstance } from '../firebase';
import { 
  ServiceErrorType, 
  createServiceError,
  handleValidationError,
  handleRateLimitError,
  withErrorHandling,
  withRetry
} from './errorHandler';
import { 
  UserInputSchemas, 
  AuthInputSchemas,
  sanitizeAndValidate 
} from '../validation/securitySchemas';

// Configuration
const GAME_CONFIG = {
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
  MAX_AUTH_ATTEMPTS: parseInt(process.env.MAX_AUTH_ATTEMPTS || '5')
};

/**
 * Rate limiting utility for authentication attempts
 */
class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>();

  static async checkRateLimit(identifier: string, maxAttempts: number = GAME_CONFIG.MAX_AUTH_ATTEMPTS): Promise<boolean> {
    const now = Date.now();
    const windowMs = GAME_CONFIG.RATE_LIMIT_WINDOW;
    
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (attempt.count >= maxAttempts) {
      throw handleRateLimitError('authentication', windowMs);
    }
    
    attempt.count++;
    return true;
  }

  static async recordFailedAttempt(identifier: string): Promise<void> {
    const attempt = this.attempts.get(identifier);
    if (attempt) {
      attempt.count++;
    }
  }
}

/**
 * Authentication Service - handles all authentication operations
 */
export class AuthService {
  /**
   * Register a new user with email and password (server-side operation)
   */
  static async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> {
    return withErrorHandling(async () => {
      // Validate input data
      const emailValidation = sanitizeAndValidate(UserInputSchemas.email, email);
      const passwordValidation = sanitizeAndValidate(AuthInputSchemas.register.shape.password, password);
      const displayNameValidation = sanitizeAndValidate(UserInputSchemas.displayName, displayName);

      if (!emailValidation.success) {
        throw handleValidationError(new Error('Invalid email'), 'email');
      }
      if (!passwordValidation.success) {
        throw handleValidationError(new Error('Invalid password'), 'password');
      }
      if (!displayNameValidation.success) {
        throw handleValidationError(new Error('Invalid display name'), 'displayName');
      }

      // Rate limiting check
      await RateLimiter.checkRateLimit(`register:${email}`);

      // Use retry mechanism for network-sensitive operations
      return await withRetry(async () => {
        const userCredential = await createUserWithEmailAndPassword(
          getAuthInstance(),
          emailValidation.data!,
          passwordValidation.data!
        );

        // Update profile with display name
        if (userCredential.user) {
          await updateProfile(userCredential.user, { 
            displayName: displayNameValidation.data! 
          });

          // Send email verification
          await sendEmailVerification(userCredential.user);
        }

        return userCredential;
      }, 3, 1000, 'registerWithEmail');
    }, 'registerWithEmail');
  }

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return withErrorHandling(async () => {
      const emailValidation = sanitizeAndValidate(UserInputSchemas.email, email);
      if (!emailValidation.success) {
        throw handleValidationError(new Error('Invalid email'), 'email');
      }

      // Rate limiting check
      await RateLimiter.checkRateLimit(`signin:${email}`);

      return await withRetry(async () => {
        const userCredential = await signInWithEmailAndPassword(
          getAuthInstance(),
          emailValidation.data!,
          password
        );

        return userCredential;
      }, 3, 1000, 'signInWithEmail');
    }, 'signInWithEmail');
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<UserCredential> {
    return withErrorHandling(async () => {
      return await withRetry(async () => {
        const provider = new GoogleAuthProvider();
        return await signInWithPopup(getAuthInstance(), provider);
      }, 3, 1000, 'signInWithGoogle');
    }, 'signInWithGoogle');
  }

  /**
   * Sign in with Twitter
   */
  static async signInWithTwitter(): Promise<UserCredential> {
    return withErrorHandling(async () => {
      return await withRetry(async () => {
        const provider = new TwitterAuthProvider();
        return await signInWithPopup(getAuthInstance(), provider);
      }, 3, 1000, 'signInWithTwitter');
    }, 'signInWithTwitter');
  }

  /**
   * Sign in with Facebook
   */
  static async signInWithFacebook(): Promise<UserCredential> {
    return withErrorHandling(async () => {
      return await withRetry(async () => {
        const provider = new FacebookAuthProvider();
        return await signInWithPopup(getAuthInstance(), provider);
      }, 3, 1000, 'signInWithFacebook');
    }, 'signInWithFacebook');
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    return withErrorHandling(async () => {
      const emailValidation = sanitizeAndValidate(UserInputSchemas.email, email);
      if (!emailValidation.success) {
        throw handleValidationError(new Error('Invalid email'), 'email');
      }

      // Rate limiting for password reset
      await RateLimiter.checkRateLimit(`reset:${email}`);

      return await withRetry(async () => {
        await sendPasswordResetEmail(getAuthInstance(), emailValidation.data!);
      }, 3, 1000, 'sendPasswordReset');
    }, 'sendPasswordReset');
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<void> {
    return withErrorHandling(async () => {
      await signOut(getAuthInstance());
    }, 'signOut');
  }
} 