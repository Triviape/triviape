/**
 * Unified Authentication Service
 * Combines the best features from both auth services with enhanced functionality
 */

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
  UserCredential,
  AdditionalUserInfo
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, Timestamp, updateDoc } from 'firebase/firestore';
import { getAuthInstance, getFirestoreDb } from '../../firebase';
import { retryAuthOperation, logAuthError } from '../../authErrorHandler';
import { FirebaseError } from 'firebase/app';
import { COLLECTIONS } from '../../constants/collections';
import { 
  ServiceErrorType, 
  createServiceError,
  handleAuthError,
  withErrorHandling,
  withRetry
} from '../core/errorHandler';
import { 
  UserInputSchemas, 
  AuthInputSchemas,
  sanitizeAndValidate 
} from '../../validation/securitySchemas';
import { ErrorContext } from '../../errorHandler';
import { UserProfile } from '../../types/user';

// Configuration
const GAME_CONFIG = {
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
  MAX_AUTH_ATTEMPTS: parseInt(process.env.MAX_AUTH_ATTEMPTS || '5'),
  XP_PER_LEVEL: parseInt(process.env.XP_PER_LEVEL || '100'),
  DEFAULT_COINS: parseInt(process.env.DEFAULT_COINS || '0')
};

// Default user preferences
const DEFAULT_USER_PREFERENCES = {
  theme: 'system',
  soundEffects: true,
  musicVolume: 70,
  sfxVolume: 100,
  language: 'en',
  notifications: {
    dailyReminder: true,
    quizAvailable: true,
    friendActivity: true,
    teamActivity: true
  },
  animationLevel: 'full'
};

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS = {
  showOnLeaderboards: true,
  profileVisibility: 'public',
  showOnlineStatus: true,
  shareActivityWithFriends: true,
  allowFriendRequests: true
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
      throw createServiceError(
        `Rate limit exceeded for authentication`,
        ServiceErrorType.RATE_LIMIT_ERROR,
        'RATE_LIMIT',
        undefined,
        { operation: 'authentication', windowMs }
      );
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
 * Unified Authentication Service
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
        throw createServiceError('Invalid email', ServiceErrorType.VALIDATION_ERROR, 'INVALID_EMAIL');
      }
      if (!passwordValidation.success) {
        throw createServiceError('Invalid password', ServiceErrorType.VALIDATION_ERROR, 'INVALID_PASSWORD');
      }
      if (!displayNameValidation.success) {
        throw createServiceError('Invalid display name', ServiceErrorType.VALIDATION_ERROR, 'INVALID_DISPLAY_NAME');
      }

      // Rate limiting check
      await RateLimiter.checkRateLimit(`register:${email}`);

      // Use retry mechanism for network-sensitive operations
      return await withRetry(async () => {
        const auth = getAuthInstance();
        const db = getFirestoreDb();
        
        // Create the user account
        const userCredential = await retryAuthOperation(() => 
          createUserWithEmailAndPassword(auth, emailValidation.data!, passwordValidation.data!)
        );

        // Update profile with display name
        if (userCredential.user) {
          await updateProfile(userCredential.user, { 
            displayName: displayNameValidation.data! 
          });

          // Send email verification
          await sendEmailVerification(userCredential.user);

          // Create user profile and stats in a transaction
          await runTransaction(db, async (transaction) => {
            const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
            const userStatsDocRef = doc(db, COLLECTIONS.USER_STATS, userCredential.user.uid);
            
            // Create initial user profile
            const now = Timestamp.now();
            const userProfile: Partial<UserProfile> = {
              uid: userCredential.user.uid,
              displayName: displayNameValidation.data!,
              email: emailValidation.data!,
              ...(userCredential.user.photoURL && { photoURL: userCredential.user.photoURL }),
              createdAt: now.toMillis(),
              lastLoginAt: now.toMillis(),
              isActive: true,
              level: 1,
              xp: 0,
              xpToNextLevel: GAME_CONFIG.XP_PER_LEVEL,
              coins: GAME_CONFIG.DEFAULT_COINS,
              quizzesTaken: 0,
              questionsAnswered: 0,
              correctAnswers: 0,
              preferences: DEFAULT_USER_PREFERENCES,
              privacySettings: DEFAULT_PRIVACY_SETTINGS
            };
            
            // Create initial user stats
            const userStats = {
              userId: userCredential.user.uid,
              bestCategory: null,
              worstCategory: null,
              averageScore: 0,
              highestScore: 0,
              totalPlayTime: 0,
              longestStreak: 0,
              currentStreak: 0,
              quizzesTaken: 0,
              quizzesCreated: 0,
              questionsAnswered: 0,
              correctAnswers: 0,
              totalScore: 0,
              createdAt: now,
              updatedAt: now
            };
            
            transaction.set(userDocRef, userProfile);
            transaction.set(userStatsDocRef, userStats);
          });
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
        throw createServiceError('Invalid email', ServiceErrorType.VALIDATION_ERROR, 'INVALID_EMAIL');
      }

      // Rate limiting check
      await RateLimiter.checkRateLimit(`signin:${email}`);

      return await withRetry(async () => {
        const auth = getAuthInstance();
        const userCredential = await retryAuthOperation(() => 
          signInWithEmailAndPassword(auth, emailValidation.data!, password)
        );

        // Update last login timestamp
        if (userCredential.user) {
          const db = getFirestoreDb();
          const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
          await updateDoc(userDocRef, {
            lastLoginAt: serverTimestamp()
          });
        }

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
        const auth = getAuthInstance();
        const provider = new GoogleAuthProvider();
        const userCredential = await retryAuthOperation(() => 
          signInWithPopup(auth, provider)
        );

        // Handle additional user info and create profile if needed
        await this.handleSocialSignIn(userCredential);

        return userCredential;
      }, 3, 1000, 'signInWithGoogle');
    }, 'signInWithGoogle');
  }

  /**
   * Sign in with Twitter
   */
  static async signInWithTwitter(): Promise<UserCredential> {
    return withErrorHandling(async () => {
      return await withRetry(async () => {
        const auth = getAuthInstance();
        const provider = new TwitterAuthProvider();
        const userCredential = await retryAuthOperation(() => 
          signInWithPopup(auth, provider)
        );

        // Handle additional user info and create profile if needed
        await this.handleSocialSignIn(userCredential);

        return userCredential;
      }, 3, 1000, 'signInWithTwitter');
    }, 'signInWithTwitter');
  }

  /**
   * Sign in with Facebook
   */
  static async signInWithFacebook(): Promise<UserCredential> {
    return withErrorHandling(async () => {
      return await withRetry(async () => {
        const auth = getAuthInstance();
        const provider = new FacebookAuthProvider();
        const userCredential = await retryAuthOperation(() => 
          signInWithPopup(auth, provider)
        );

        // Handle additional user info and create profile if needed
        await this.handleSocialSignIn(userCredential);

        return userCredential;
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
        throw createServiceError('Invalid email', ServiceErrorType.VALIDATION_ERROR, 'INVALID_EMAIL');
      }

      // Rate limiting for password reset
      await RateLimiter.checkRateLimit(`reset:${email}`);

      return await withRetry(async () => {
        const auth = getAuthInstance();
        await retryAuthOperation(() => 
          sendPasswordResetEmail(auth, emailValidation.data!)
        );
      }, 3, 1000, 'sendPasswordReset');
    }, 'sendPasswordReset');
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<void> {
    return withErrorHandling(async () => {
      const auth = getAuthInstance();
      await retryAuthOperation(() => signOut(auth));
    }, 'signOut');
  }

  /**
   * Handle social sign-in and profile creation
   */
  private static async handleSocialSignIn(userCredential: UserCredential): Promise<void> {
    const db = getFirestoreDb();
    const user = userCredential.user;
    
    if (!user) return;

    // Check if user profile already exists
    const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create new user profile for social sign-in
      const now = Timestamp.now();
      const userProfile: Partial<UserProfile> = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous User',
        email: user.email || '',
        photoURL: user.photoURL,
        createdAt: now.toMillis(),
        lastLoginAt: now.toMillis(),
        isActive: true,
        level: 1,
        xp: 0,
        xpToNextLevel: GAME_CONFIG.XP_PER_LEVEL,
        coins: GAME_CONFIG.DEFAULT_COINS,
        quizzesTaken: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        preferences: DEFAULT_USER_PREFERENCES,
        privacySettings: DEFAULT_PRIVACY_SETTINGS
      };

      // Create user stats
      const userStatsDocRef = doc(db, COLLECTIONS.USER_STATS, user.uid);
      const userStats = {
        userId: user.uid,
        bestCategory: null,
        worstCategory: null,
        averageScore: 0,
        highestScore: 0,
        totalPlayTime: 0,
        longestStreak: 0,
        currentStreak: 0,
        quizzesTaken: 0,
        quizzesCreated: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        totalScore: 0,
        createdAt: now,
        updatedAt: now
      };

      // Use transaction to ensure both documents are created atomically
      await runTransaction(db, async (transaction) => {
        transaction.set(userDocRef, userProfile);
        transaction.set(userStatsDocRef, userStats);
      });
    } else {
      // Update last login timestamp for existing user
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp()
      });
    }
  }
} 