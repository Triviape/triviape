/**
 * User Services Index
 * Exports all unified user services
 */

// Core user services
export { UserService } from './userService';
export { ProfileService } from './profileService';
export { PreferencesService } from './preferencesService';
export { ProgressionService } from './progressionService';
export { StatsService } from './statsService';

// Auth service (imported from auth directory)
export { ConsolidatedAuthService as AuthService } from '../auth/consolidatedAuthService';

// Types and error handling
export * from './types';
export * from './errorHandler';

// Re-export commonly used types for convenience
export type { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user'; 