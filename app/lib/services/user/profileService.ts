/**
 * User profile management service
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, User } from 'firebase/auth';
import { getFirestoreDb } from '../../firebase';
import { UserProfile } from '@/app/types/user';
import { COLLECTIONS, UserServiceErrorType } from './types';
import { createUserError } from './errorHandler';
import { FirebaseError } from 'firebase/app';
import { profileUpdateSchema, userPreferencesSchema, privacySettingsSchema } from '../../validation/userSchemas';
import { validateOrThrow } from '../../validation/utils';

/**
 * Get a user's profile from Firestore
 * @param userId User ID
 * @returns User profile data
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const db = getFirestoreDb();
    const userDoc = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(userDoc);
    
    if (!docSnap.exists()) {
      throw createUserError(
        'User profile not found',
        UserServiceErrorType.PROFILE_ERROR
      );
    }
    
    return docSnap.data() as UserProfile;
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
 * Update a user's profile
 * @param user Firebase User object
 * @param profileData Profile data to update
 */
export async function updateUserProfile(
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
 * Update user preferences
 * @param userId User ID
 * @param preferences Preferences to update
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, any>
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
      UserServiceErrorType.PREFERENCES_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Update user privacy settings
 * @param userId User ID
 * @param privacySettings Privacy settings to update
 */
export async function updatePrivacySettings(
  userId: string,
  privacySettings: Record<string, any>
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
      UserServiceErrorType.PREFERENCES_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
} 