/**
 * Unified User Preferences Service
 * Consolidates preferences management functionality from root-level service
 */

import { UserPreferences, PrivacySettings } from '@/app/types/user';
import { 
  withErrorHandling
} from '../core/errorHandler';
import { ProfileService } from './profileService';

/**
 * Unified Preferences Service - handles user preferences and privacy settings
 * Consolidates functionality from root-level preferences service
 */
export class PreferencesService {
  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    return withErrorHandling(async () => {
      await ProfileService.updateUserPreferences(userId, preferences);
    }, 'updateUserPreferences');
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    return withErrorHandling(async () => {
      await ProfileService.updatePrivacySettings(userId, settings);
    }, 'updatePrivacySettings');
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return withErrorHandling(async () => {
      return await ProfileService.getUserPreferences(userId);
    }, 'getUserPreferences');
  }

  /**
   * Get user privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    return withErrorHandling(async () => {
      return await ProfileService.getPrivacySettings(userId);
    }, 'getPrivacySettings');
  }

  /**
   * Update specific preference category
   */
  static async updatePreferenceCategory(
    userId: string,
    category: keyof UserPreferences,
    value: any
  ): Promise<void> {
    return withErrorHandling(async () => {
      const currentPreferences = await this.getUserPreferences(userId);
      if (!currentPreferences) {
        throw new Error('User preferences not found');
      }

      const updatedPreferences = {
        ...currentPreferences,
        [category]: value
      };

      await ProfileService.updateUserPreferences(userId, updatedPreferences);
    }, 'updatePreferenceCategory');
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    notifications: Partial<UserPreferences['notifications']>
  ): Promise<void> {
    return withErrorHandling(async () => {
      const currentPreferences = await this.getUserPreferences(userId);
      if (!currentPreferences) {
        throw new Error('User preferences not found');
      }

      const updatedPreferences = {
        ...currentPreferences,
        notifications: {
          ...currentPreferences.notifications,
          ...notifications
        }
      };

      await ProfileService.updateUserPreferences(userId, updatedPreferences);
    }, 'updateNotificationPreferences');
  }

  /**
   * Reset user preferences to defaults
   */
  static async resetUserPreferences(userId: string): Promise<void> {
    return withErrorHandling(async () => {
      const defaultPreferences: UserPreferences = {
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

      await ProfileService.updateUserPreferences(userId, defaultPreferences);
    }, 'resetUserPreferences');
  }

  /**
   * Reset privacy settings to defaults
   */
  static async resetPrivacySettings(userId: string): Promise<void> {
    return withErrorHandling(async () => {
      const defaultPrivacySettings: PrivacySettings = {
        showOnLeaderboards: true,
        profileVisibility: 'public',
        showOnlineStatus: true,
        shareActivityWithFriends: true,
        allowFriendRequests: true
      };

      await ProfileService.updatePrivacySettings(userId, defaultPrivacySettings);
    }, 'resetPrivacySettings');
  }
} 