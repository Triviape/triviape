/**
 * Unified User Profile Management Service
 * Consolidates profile management functionality from both root-level and user directory services
 */

import { 
  DocumentData, 
  QueryDocumentSnapshot,
  writeBatch,
  doc,
  getFirestore,
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { updateProfile, User } from 'firebase/auth';
import { getFirestoreDb } from '../../firebase';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';
import { BaseServiceImplementation } from '../core/baseService';
import { 
  handleValidationError,
  withErrorHandling
} from '../core/errorHandler';
import { 
  UserInputSchemas,
  sanitizeAndValidate 
} from '../../validation/securitySchemas';
import { COLLECTIONS, UserServiceErrorType } from './types';
import { createUserError } from './errorHandler';
import { FirebaseError } from 'firebase/app';
import { profileUpdateSchema, userPreferencesSchema, privacySettingsSchema } from '../../validation/userSchemas';
import { validateOrThrow } from '../../validation/utils';

// Default user preferences - moved to configuration
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

// Default privacy settings - moved to configuration
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showOnLeaderboards: true,
  profileVisibility: 'public',
  showOnlineStatus: true,
  shareActivityWithFriends: true,
  allowFriendRequests: true
};

// Game configuration
const GAME_CONFIG = {
  XP_PER_LEVEL: parseInt(process.env.XP_PER_LEVEL || '100'),
  DEFAULT_COINS: parseInt(process.env.DEFAULT_COINS || '0')
};

/**
 * Unified Profile Service - handles user profile management
 * Combines functionality from both root-level and user directory services
 */
export class ProfileService extends BaseServiceImplementation<UserProfile> {
  protected collectionName = COLLECTIONS.USERS;

  protected validateCreateData(data: Partial<UserProfile>): void {
    const result = sanitizeAndValidate(UserInputSchemas.displayName, data.displayName);
    if (!result.success) {
      throw handleValidationError(new Error('Invalid display name'), 'displayName');
    }
  }

  protected validateUpdateData(data: Partial<UserProfile>): void {
    if (data.displayName) {
      const result = sanitizeAndValidate(UserInputSchemas.displayName, data.displayName);
      if (!result.success) {
        throw handleValidationError(new Error('Invalid display name'), 'displayName');
      }
    }
  }

  protected mapDocumentToEntity(doc: QueryDocumentSnapshot<DocumentData>): UserProfile {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: data.displayName || '',
      email: data.email || '',
      photoURL: data.photoURL || null,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      lastLoginAt: data.lastLoginAt?.toMillis() || Date.now(),
      isActive: data.isActive ?? true,
      level: data.level || 1,
      xp: data.xp || 0,
      xpToNextLevel: data.xpToNextLevel || GAME_CONFIG.XP_PER_LEVEL,
      coins: data.coins || 0,
      quizzesTaken: data.quizzesTaken || 0,
      questionsAnswered: data.questionsAnswered || 0,
      correctAnswers: data.correctAnswers || 0,
      preferences: data.preferences || DEFAULT_USER_PREFERENCES,
      privacySettings: data.privacySettings || DEFAULT_PRIVACY_SETTINGS
    };
  }

  protected mapEntityToDocument(entity: UserProfile): DocumentData {
    return {
      displayName: entity.displayName,
      email: entity.email,
      photoURL: entity.photoURL,
      createdAt: entity.createdAt,
      lastLoginAt: entity.lastLoginAt,
      isActive: entity.isActive,
      level: entity.level,
      xp: entity.xp,
      xpToNextLevel: entity.xpToNextLevel,
      coins: entity.coins,
      quizzesTaken: entity.quizzesTaken,
      questionsAnswered: entity.questionsAnswered,
      correctAnswers: entity.correctAnswers,
      preferences: entity.preferences,
      privacySettings: entity.privacySettings,
      updatedAt: serverTimestamp()
    };
  }

  /**
   * Create user profile with batch operation for consistency
   */
  static async createUserProfileWithBatch(
    userId: string, 
    userData: {
      displayName: string;
      email: string;
      photoURL?: string;
    }
  ): Promise<void> {
    return withErrorHandling(async () => {
      const db = getFirestore();
      const batch = writeBatch(db);
      
      const userDoc = doc(db, COLLECTIONS.USERS, userId);
      const userProfile: Partial<UserProfile> = {
        uid: userId,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL || null,
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
        privacySettings: DEFAULT_PRIVACY_SETTINGS
      };
      
      batch.set(userDoc, userProfile);
      await batch.commit();
    }, 'createUserProfileWithBatch');
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    return withErrorHandling(async () => {
      const instance = new ProfileService();
      await instance.update(userId, { lastLoginAt: Date.now() });
    }, 'updateLastLogin');
  }

  /**
   * Update user profile with validation
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    return withErrorHandling(async () => {
      // Validate profile data
      validateOrThrow(profileUpdateSchema, updates);
      
      const instance = new ProfileService();
      await instance.update(userId, updates);
    }, 'updateUserProfile');
  }

  /**
   * Get user profile with enhanced error handling
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const instance = new ProfileService();
      return await instance.read(userId);
    } catch (error) {
      throw createUserError(
        'Failed to get user profile',
        UserServiceErrorType.PROFILE_ERROR,
        error instanceof FirebaseError ? error.code : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update user profile with Firebase Auth integration
   */
  static async updateUserProfileWithAuth(
    user: User,
    profileData: Partial<UserProfile>
  ): Promise<void> {
    try {
      // Validate profile data
      validateOrThrow(profileUpdateSchema, profileData);
      
      const db = getFirestoreDb();
      const userDoc = doc(db, COLLECTIONS.USERS, user.uid);
      
      // Update the Firestore document
      await updateDoc(userDoc, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      
      // Update the Firebase Auth profile if display name or photo URL is provided
      if (profileData.displayName || profileData.photoURL) {
        await updateProfile(user, {
          displayName: profileData.displayName,
          photoURL: profileData.photoURL
        });
      }
    } catch (error) {
      throw createUserError(
        'Failed to update user profile',
        UserServiceErrorType.PROFILE_ERROR,
        error instanceof FirebaseError ? error.code : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update user preferences with validation
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      // Validate preferences
      validateOrThrow(userPreferencesSchema, preferences);
      
      const db = getFirestoreDb();
      const userDoc = doc(db, COLLECTIONS.USERS, userId);
      
      await updateDoc(userDoc, {
        'preferences': preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw createUserError(
        'Failed to update user preferences',
        UserServiceErrorType.PROFILE_ERROR,
        error instanceof FirebaseError ? error.code : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update privacy settings with validation
   */
  static async updatePrivacySettings(
    userId: string,
    privacySettings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      // Validate privacy settings
      validateOrThrow(privacySettingsSchema, privacySettings);
      
      const db = getFirestoreDb();
      const userDoc = doc(db, COLLECTIONS.USERS, userId);
      
      await updateDoc(userDoc, {
        'privacySettings': privacySettings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw createUserError(
        'Failed to update privacy settings',
        UserServiceErrorType.PROFILE_ERROR,
        error instanceof FirebaseError ? error.code : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const user = await this.getUserProfile(userId);
      return user?.preferences || null;
    } catch (error) {
      throw createUserError(
        'Failed to get user preferences',
        UserServiceErrorType.PROFILE_ERROR,
        error instanceof FirebaseError ? error.code : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    try {
      const user = await this.getUserProfile(userId);
      return user?.privacySettings || null;
    } catch (error) {
      throw createUserError(
        'Failed to get privacy settings',
        UserServiceErrorType.PROFILE_ERROR,
        error instanceof FirebaseError ? error.code : undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
} 