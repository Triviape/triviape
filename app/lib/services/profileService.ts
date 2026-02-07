import { 
  DocumentData, 
  QueryDocumentSnapshot,
  writeBatch,
  doc,
  getFirestore
} from 'firebase/firestore';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';
import { BaseServiceImplementation } from './baseService';
import { 
  handleValidationError,
  withErrorHandling
} from './errorHandler';
import { 
  UserInputSchemas,
  sanitizeAndValidate 
} from '../validation/securitySchemas';

// Collections - configurable
const COLLECTIONS = {
  USERS: process.env.USERS_COLLECTION || 'users'
};

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
 * Profile Service - handles user profile management
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
      photoURL: data.photoURL || undefined,
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
      privacySettings: entity.privacySettings
    };
  }

  /**
   * Create user profile with batch operation for atomicity
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
      // Validate input data
      const displayNameValidation = sanitizeAndValidate(UserInputSchemas.displayName, userData.displayName);
      const emailValidation = sanitizeAndValidate(UserInputSchemas.email, userData.email);

      if (!displayNameValidation.success) {
        throw handleValidationError(new Error('Invalid display name'), 'displayName');
      }
      if (!emailValidation.success) {
        throw handleValidationError(new Error('Invalid email'), 'email');
      }

      // Validate photoURL if provided
      let validatedPhotoURL: string | undefined;
      if (userData.photoURL) {
        const urlValidation = sanitizeAndValidate(UserInputSchemas.url, userData.photoURL);
        if (!urlValidation.success) {
          throw handleValidationError(new Error('Invalid photo URL'), 'photoURL');
        }
        validatedPhotoURL = urlValidation.data!;
      }

      const userProfile: Partial<UserProfile> = {
        uid: userId,
        displayName: displayNameValidation.data!,
        email: emailValidation.data!,
        photoURL: validatedPhotoURL,
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

      // Use batch operation for atomicity
      const db = getFirestore();
      const batch = writeBatch(db);
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      
      batch.set(userRef, userProfile);
      
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
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    return withErrorHandling(async () => {
      const instance = new ProfileService();
      await instance.update(userId, updates);
    }, 'updateUserProfile');
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    return withErrorHandling(async () => {
      const instance = new ProfileService();
      return await instance.read(userId);
    }, 'getUserProfile');
  }
} 
