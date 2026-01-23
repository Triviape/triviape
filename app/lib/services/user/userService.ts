/**
 * Unified User Service
 * Consolidates user management functionality from root-level service
 * Orchestrates all user operations using the focused services
 */

import { UserCredential } from 'firebase/auth';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';
import { BaseServiceImplementation } from '../core/baseService';
import { 
  DocumentData, 
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  handleValidationError,
  withErrorHandling
} from '../core/errorHandler';
import { 
  UserInputSchemas,
  sanitizeAndValidate 
} from '../../validation/securitySchemas';

// Import the focused services
import { ConsolidatedAuthService as AuthService } from '../auth/consolidatedAuthService';
import { ProfileService } from './profileService';
import { PreferencesService } from './preferencesService';
import { ProgressionService } from './progressionService';
import { StatsService } from './statsService';

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
 * Main UserService class - orchestrates all user operations
 * This maintains backward compatibility while using the new focused services
 */
export class UserService extends BaseServiceImplementation<UserProfile> {
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
      privacySettings: entity.privacySettings
    };
  }

  // Authentication methods (delegated to AuthService)
  static async registerWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    return AuthService.registerWithEmail(email, password, displayName);
  }

  static async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    return AuthService.signInWithEmail(email, password);
  }

  static async signInWithGoogle(): Promise<UserCredential> {
    return AuthService.signInWithGoogle();
  }

  static async signInWithTwitter(): Promise<UserCredential> {
    return AuthService.signInWithTwitter();
  }

  static async signInWithFacebook(): Promise<UserCredential> {
    return AuthService.signInWithFacebook();
  }

  static async sendPasswordReset(email: string): Promise<void> {
    return AuthService.sendPasswordReset(email);
  }

  static async signOut(): Promise<void> {
    return AuthService.signOut();
  }

  // Profile methods (delegated to ProfileService)
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    return ProfileService.getUserProfile(userId);
  }

  static async createUserProfile(userId: string, userData: {
    displayName: string;
    email: string;
    photoURL?: string;
  }): Promise<void> {
    return ProfileService.createUserProfileWithBatch(userId, userData);
  }

  static async updateLastLogin(userId: string): Promise<void> {
    return ProfileService.updateLastLogin(userId);
  }

  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    return ProfileService.updateUserProfile(userId, updates);
  }

  // Preferences methods (delegated to PreferencesService)
  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    return PreferencesService.updateUserPreferences(userId, preferences);
  }

  static async updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    return PreferencesService.updatePrivacySettings(userId, settings);
  }

  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return PreferencesService.getUserPreferences(userId);
  }

  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    return PreferencesService.getPrivacySettings(userId);
  }

  // Progression methods (delegated to ProgressionService)
  static async addUserXP(userId: string, xpAmount: number): Promise<{
    level: number;
    xp: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    levelsGained: number;
  }> {
    return ProgressionService.addUserXP(userId, xpAmount);
  }

  static async addUserCoins(userId: string, coinAmount: number): Promise<number> {
    return ProgressionService.addUserCoins(userId, coinAmount);
  }

  static async getUserProgression(userId: string): Promise<{
    level: number;
    xp: number;
    xpToNextLevel: number;
    coins: number;
  } | null> {
    return ProgressionService.getUserProgression(userId);
  }

  // Stats methods (delegated to StatsService)
  static async getUserStats(userId: string): Promise<any> {
    return StatsService.getUserStats(userId);
  }

  static async updateQuizStats(
    userId: string,
    correctAnswers: number,
    totalAnswers: number,
    pointsEarned: number
  ): Promise<void> {
    return StatsService.updateQuizStats(userId, correctAnswers, totalAnswers, pointsEarned);
  }

  static async incrementQuizzesCreated(userId: string): Promise<void> {
    return StatsService.incrementQuizzesCreated(userId);
  }

  // Utility methods
  static calculateLevelFromXP(xp: number): { level: number; xpToNextLevel: number } {
    return ProgressionService.calculateLevelFromXP(xp);
  }

  static calculateProgressionFromXP(currentXP: number, xpGain: number): {
    newXP: number;
    newLevel: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    levelsGained: number;
  } {
    return ProgressionService.calculateProgressionFromXP(currentXP, xpGain);
  }

  // Admin/Testing methods
  static async resetUserProgression(userId: string): Promise<void> {
    return ProgressionService.resetUserProgression(userId);
  }

  static async setUserProgression(
    userId: string,
    progression: {
      level?: number;
      xp?: number;
      coins?: number;
    }
  ): Promise<void> {
    return ProgressionService.setUserProgression(userId, progression);
  }

  static async resetUserPreferences(userId: string): Promise<void> {
    return PreferencesService.resetUserPreferences(userId);
  }

  static async resetPrivacySettings(userId: string): Promise<void> {
    return PreferencesService.resetPrivacySettings(userId);
  }
} 