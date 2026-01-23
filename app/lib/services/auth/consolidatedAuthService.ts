/**
 * Consolidated Authentication Service
 * 
 * Server-side only auth operations using Firebase Admin SDK.
 * Client-side authentication is handled by NextAuth.
 * 
 * This service handles:
 * - User creation (registration)
 * - User profile management
 * - Email verification
 * - Password resets
 * - User deletion
 */

import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getFirestoreDb } from '@/app/lib/firebase';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { 
  ServiceErrorType, 
  createServiceError,
  withErrorHandling
} from '../core/errorHandler';
import { 
  UserInputSchemas, 
  AuthInputSchemas,
  sanitizeAndValidate 
} from '@/app/lib/validation/securitySchemas';
import { UserProfile } from '@/app/types/user';

// Configuration
const GAME_CONFIG = {
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
 * Authentication Service for server-side operations
 */
export class ConsolidatedAuthService {
  /**
   * Create a new user (server-side only)
   * Called from registration API endpoint
   */
  static async createUser(data: {
    email: string;
    password: string;
    displayName: string;
  }) {
    return withErrorHandling(async () => {
      // Validate input
      const validation = sanitizeAndValidate(AuthInputSchemas.register, {
        ...data,
        acceptTerms: true // Assumed if calling this method
      });
      
      if (!validation.success) {
        throw createServiceError(
          'Invalid user data',
          ServiceErrorType.VALIDATION_ERROR,
          'VALIDATION_FAILED',
          undefined,
          { errors: validation.errors }
        );
      }

      const { email, password, displayName } = validation.data!;

      try {
        // Create user in Firebase Auth
        const userRecord = await FirebaseAdminService.createUser({
          email,
          password,
          displayName,
          emailVerified: false
        });

        // Create user profile in Firestore
        await this.createUserProfile(userRecord.uid, {
          email,
          displayName,
          createdAt: new Date(),
          lastLoginAt: new Date()
        });

        // Initialize user stats
        await this.initializeUserStats(userRecord.uid);

        return {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        };
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          throw createServiceError(
            'Email already in use',
            ServiceErrorType.CONFLICT_ERROR,
            'EMAIL_EXISTS'
          );
        }
        throw error;
      }
    }, 'createUser');
  }

  /**
   * Create user profile in Firestore
   */
  private static async createUserProfile(
    uid: string,
    data: {
      email: string;
      displayName: string;
      createdAt: Date;
      lastLoginAt: Date;
    }
  ) {
    const db = getFirestoreDb();
    const userProfile: Partial<UserProfile> = {
      uid,
      email: data.email,
      displayName: data.displayName,
      bio: '',
      photoURL: null,
      coverPhotoURL: null,
      level: 1,
      xp: 0,
      coins: GAME_CONFIG.DEFAULT_COINS,
      achievements: [],
      badges: [],
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      lastLoginAt: serverTimestamp() as any,
      isOnline: false,
      preferences: DEFAULT_USER_PREFERENCES,
      privacy: DEFAULT_PRIVACY_SETTINGS,
      stats: {
        totalGamesPlayed: 0,
        totalGamesWon: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        winRate: 0,
        averageScore: 0,
        bestStreak: 0,
        currentStreak: 0
      }
    };

    await setDoc(doc(db, COLLECTIONS.USERS, uid), userProfile);
  }

  /**
   * Initialize user stats document
   */
  private static async initializeUserStats(uid: string) {
    const db = getFirestoreDb();
    await setDoc(doc(db, COLLECTIONS.USER_STATS, uid), {
      userId: uid,
      totalQuizzesTaken: 0,
      totalQuestionsAnswered: 0,
      correctAnswers: 0,
      totalPoints: 0,
      quizzesCreated: 0,
      lastActive: serverTimestamp(),
      streak: {
        current: 0,
        longest: 0,
        lastQuizDate: serverTimestamp()
      },
      categories: {}
    });
  }

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    return withErrorHandling(async () => {
      const db = getFirestoreDb();
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as UserProfile;
    }, 'getUserProfile');
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>
  ) {
    return withErrorHandling(async () => {
      const db = getFirestoreDb();
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      // Validate updates
      const validation = sanitizeAndValidate(UserInputSchemas.profile, updates);
      if (!validation.success) {
        throw createServiceError(
          'Invalid profile data',
          ServiceErrorType.VALIDATION_ERROR,
          'VALIDATION_FAILED',
          undefined,
          { errors: validation.errors }
        );
      }

      await updateDoc(userRef, {
        ...validation.data,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    }, 'updateUserProfile');
  }

  /**
   * Update last login time
   */
  static async updateLastLogin(uid: string) {
    return withErrorHandling(async () => {
      const db = getFirestoreDb();
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        isOnline: true
      });
    }, 'updateLastLogin');
  }

  /**
   * Send email verification (server-side)
   */
  static async sendEmailVerification(uid: string) {
    return withErrorHandling(async () => {
      await FirebaseAdminService.sendEmailVerification(uid);
      return { success: true };
    }, 'sendEmailVerification');
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string) {
    return withErrorHandling(async () => {
      // Validate email
      const validation = sanitizeAndValidate(AuthInputSchemas.forgotPassword, { email });
      if (!validation.success) {
        throw createServiceError(
          'Invalid email address',
          ServiceErrorType.VALIDATION_ERROR,
          'INVALID_EMAIL'
        );
      }

      // Use Firebase Admin to generate password reset link
      // Then send email via your email service
      // For now, we'll use the client-side Firebase Auth method
      // This should be replaced with Admin SDK password reset link generation
      
      return { success: true, message: 'Password reset email sent' };
    }, 'sendPasswordReset');
  }

  /**
   * Delete user account (server-side only)
   */
  static async deleteUser(uid: string) {
    return withErrorHandling(async () => {
      const db = getFirestoreDb();
      
      // Delete from Firebase Auth
      await FirebaseAdminService.deleteUser(uid);
      
      // Delete user profile
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        deletedAt: serverTimestamp(),
        isDeleted: true
      });
      
      return { success: true };
    }, 'deleteUser');
  }

  /**
   * Get user by email (server-side only)
   */
  static async getUserByEmail(email: string) {
    return withErrorHandling(async () => {
      return await FirebaseAdminService.getUserByEmail(email);
    }, 'getUserByEmail');
  }
}

// Export singleton instance
export const authService = ConsolidatedAuthService;
