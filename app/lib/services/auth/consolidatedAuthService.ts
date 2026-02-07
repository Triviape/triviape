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
import { getFirestoreDb, initializeFirebaseAuth } from '@/app/lib/firebase';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  type UserCredential,
} from 'firebase/auth';
import { 
  ServiceErrorType, 
  createServiceError,
  withErrorHandling
} from '../core/errorHandler';
import { 
  AuthInputSchemas,
  sanitizeAndValidate 
} from '@/app/lib/validation/securitySchemas';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';

// Configuration
const GAME_CONFIG = {
  XP_PER_LEVEL: parseInt(process.env.XP_PER_LEVEL || '100'),
  DEFAULT_COINS: parseInt(process.env.DEFAULT_COINS || '0')
};

// Default user preferences
const DEFAULT_USER_PREFERENCES: UserPreferences = {
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
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
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
  static async registerWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    const auth = initializeFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (credential.user && displayName) {
      await updateProfile(credential.user, { displayName });
    }

    return credential;
  }

  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    const auth = initializeFirebaseAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }

  static async signInWithGoogle(): Promise<UserCredential> {
    if (typeof window === 'undefined') {
      throw new Error('Google sign-in is only available in the browser');
    }
    const auth = initializeFirebaseAuth();
    return signInWithPopup(auth, new GoogleAuthProvider());
  }

  static async signInWithTwitter(): Promise<UserCredential> {
    if (typeof window === 'undefined') {
      throw new Error('Twitter sign-in is only available in the browser');
    }
    const auth = initializeFirebaseAuth();
    return signInWithPopup(auth, new TwitterAuthProvider());
  }

  static async signInWithFacebook(): Promise<UserCredential> {
    if (typeof window === 'undefined') {
      throw new Error('Facebook sign-in is only available in the browser');
    }
    const auth = initializeFirebaseAuth();
    return signInWithPopup(auth, new FacebookAuthProvider());
  }

  static async signOut(): Promise<void> {
    const auth = initializeFirebaseAuth();
    await auth.signOut();
  }

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
    const userProfile: UserProfile = {
      uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: undefined,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      isActive: true,
      level: 1,
      xp: 0,
      xpToNextLevel: GAME_CONFIG.XP_PER_LEVEL,
      coins: GAME_CONFIG.DEFAULT_COINS,
      quizzesTaken: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      preferences: DEFAULT_USER_PREFERENCES,
      privacySettings: DEFAULT_PRIVACY_SETTINGS,
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

      // Only persist user profile keys present in the shared UserProfile contract.
      const safeUpdates: Partial<UserProfile> = {};
      if (typeof updates.displayName === 'string') safeUpdates.displayName = updates.displayName;
      if (typeof updates.photoURL === 'string' || updates.photoURL === undefined) safeUpdates.photoURL = updates.photoURL;
      if (updates.preferences) safeUpdates.preferences = updates.preferences;
      if (updates.privacySettings) safeUpdates.privacySettings = updates.privacySettings;

      await updateDoc(userRef, safeUpdates as any);

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
      const user = await FirebaseAdminService.getUserById(uid);
      if (!user.email) {
        throw createServiceError(
          'User does not have an email address',
          ServiceErrorType.VALIDATION_ERROR,
          'MISSING_EMAIL'
        );
      }
      await FirebaseAdminService.getAuth().generateEmailVerificationLink(user.email);
      return { success: true };
    }, 'sendEmailVerification');
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    return withErrorHandling(async () => {
      // Validate email
      const validation = sanitizeAndValidate(AuthInputSchemas.resetPassword, { email });
      if (!validation.success) {
        throw createServiceError(
          'Invalid email address',
          ServiceErrorType.VALIDATION_ERROR,
          'INVALID_EMAIL'
        );
      }

      const auth = initializeFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
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
