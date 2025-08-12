import { UserPreferences, PrivacySettings } from '@/app/types/user';
import { 
  withErrorHandling
} from './errorHandler';
import { ProfileService } from './profileService';

/**
 * Preferences Service - handles user preferences and privacy settings
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
      const instance = new ProfileService();
      await instance.update(userId, { preferences });
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
      const instance = new ProfileService();
      await instance.update(userId, { privacySettings: settings });
    }, 'updatePrivacySettings');
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return withErrorHandling(async () => {
      const user = await ProfileService.getUserProfile(userId);
      return user?.preferences || null;
    }, 'getUserPreferences');
  }

  /**
   * Get user privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    return withErrorHandling(async () => {
      const user = await ProfileService.getUserProfile(userId);
      return user?.privacySettings || null;
    }, 'getPrivacySettings');
  }
} 