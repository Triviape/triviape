/**
 * Zod validation schemas for user-related data
 */

import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(100, 'Email must be less than 100 characters');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Display name validation schema
export const displayNameSchema = z
  .string()
  .min(3, 'Display name must be at least 3 characters')
  .max(50, 'Display name must be less than 50 characters')
  .regex(
    /^[a-zA-Z0-9_\- ]+$/,
    'Display name can only contain letters, numbers, underscores, hyphens, and spaces'
  );

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Password reset schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// User profile update schema
export const profileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  photoURL: z.string().url('Photo URL must be a valid URL').optional().nullable(),
  website: z.string().url('Website must be a valid URL').optional().nullable(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

// User preferences schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  soundEffects: z.boolean(),
  musicVolume: z.number().min(0).max(100),
  sfxVolume: z.number().min(0).max(100),
  language: z.string().min(2).max(10),
  notifications: z.object({
    dailyReminder: z.boolean(),
    quizAvailable: z.boolean(),
    friendActivity: z.boolean(),
    teamActivity: z.boolean(),
  }),
  animationLevel: z.enum(['none', 'minimal', 'full']),
});

// Privacy settings schema
export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']),
  showOnlineStatus: z.boolean(),
  showActivity: z.boolean(),
  allowFriendRequests: z.boolean(),
  allowTeamInvites: z.boolean(),
}); 