/**
 * User service types
 */

import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  USER_STATS: 'user_stats',
  USER_INVENTORY: 'user_inventory'
};

// Default user preferences
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
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
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  showOnlineStatus: true,
  showActivity: true,
  allowFriendRequests: true,
  allowTeamInvites: true
};

// User service error types
export enum UserServiceErrorType {
  AUTHENTICATION_ERROR = 'authentication_error',
  PROFILE_ERROR = 'profile_error',
  PREFERENCES_ERROR = 'preferences_error',
  STATS_ERROR = 'stats_error',
  INVENTORY_ERROR = 'inventory_error',
  GENERAL_ERROR = 'general_error'
}

export interface UserServiceError extends Error {
  type: UserServiceErrorType;
  code?: string;
  originalError?: Error;
} 