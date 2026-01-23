/**
 * Authentication service for user-related operations
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  UserCredential,
  AdditionalUserInfo
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction, Timestamp, updateDoc } from 'firebase/firestore';
import { getAuthInstance, getFirestoreDb } from '../../firebase';
import { retryAuthOperation, logAuthError } from '../../authErrorHandler';
import { FirebaseError } from 'firebase/app';
import { COLLECTIONS, DEFAULT_USER_PREFERENCES, DEFAULT_PRIVACY_SETTINGS, UserServiceErrorType } from './types';
import { createUserError } from '@/app/lib/services/user/errorHandler';
import { registerSchema, loginSchema, resetPasswordSchema } from '../../validation/userSchemas';
import { validateOrThrow } from '../../validation/utils';
import { ErrorContext } from '@/app/lib/errorHandler';
import { UserProfile } from '@/app/types/user';

/**
 * Register a new user with email and password
 * @param email User's email
 * @param password User's password
 * @param displayName User's display name
 * @returns UserCredential object
 */
export async function registerWithEmailPassword(
  email: string, 
  password: string, 
  displayName: string
): Promise<UserCredential> {
  try {
    // Validate input data
    validateOrThrow(registerSchema, { email, password, displayName });
    
    const auth = getAuthInstance();
    const db = getFirestoreDb();
    
    // Create the user account
    const userCredential = await retryAuthOperation(() => 
      createUserWithEmailAndPassword(auth, email, password)
    );
    
    // Update the user's profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      try {
        // Use a transaction to ensure both user profile and stats are created atomically
        await runTransaction(db, async (transaction) => {
          const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
          const userStatsDocRef = doc(db, COLLECTIONS.USER_STATS, userCredential.user.uid);
          
          // Create initial user profile that matches the UserProfile interface
          const now = Timestamp.now();
          const userProfile: Partial<UserProfile> = {
            uid: userCredential.user.uid,
            displayName,
            email,
            // Only add photoURL if it exists
            ...(userCredential.user.photoURL && { photoURL: userCredential.user.photoURL }),
            createdAt: now.toMillis(),
            lastLoginAt: now.toMillis(),
            isActive: true,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            coins: 0,
            quizzesTaken: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            preferences: DEFAULT_USER_PREFERENCES,
            privacySettings: DEFAULT_PRIVACY_SETTINGS
          };
          
          // Create initial user stats
          const userStats = {
            userId: userCredential.user.uid,
            bestCategory: null,
            worstCategory: null,
            averageScore: 0,
            highestScore: 0,
            totalPlayTime: 0,
            longestStreak: 0,
            currentStreak: 0,
            quizzesTaken: 0,
            quizzesCreated: 0,
            totalPoints: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            streak: 0,
            lastPlayed: null,
            createdAt: now,
            updatedAt: now
          };
          
          // Set both documents in the transaction
          transaction.set(userDocRef, userProfile);
          transaction.set(userStatsDocRef, userStats);
        });
        
        console.log(`User profile and stats created for ${userCredential.user.uid}`);
      } catch (firestoreError) {
        // If Firestore creation fails, we should still return the user credential
        // but log the error for monitoring
        console.error('Failed to create user profile in Firestore:', firestoreError);
        
        // Attempt to create the documents individually as a fallback
        try {
          const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
          const now = Timestamp.now();
          
          await setDoc(userDocRef, {
            uid: userCredential.user.uid,
            displayName,
            email,
            // Only add photoURL if it exists
            ...(userCredential.user.photoURL && { photoURL: userCredential.user.photoURL }),
            createdAt: now.toMillis(),
            lastLoginAt: now.toMillis(),
            isActive: true,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            coins: 0,
            quizzesTaken: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            preferences: DEFAULT_USER_PREFERENCES,
            privacySettings: DEFAULT_PRIVACY_SETTINGS
          });
          
          console.log(`User profile created for ${userCredential.user.uid} (fallback method)`);
        } catch (fallbackError) {
          console.error('Fallback user profile creation also failed:', fallbackError);
        }
      }
    }
    
    return userCredential;
  } catch (error: unknown) {
    const context: Omit<ErrorContext, 'timestamp'> = { action: 'Registration failed' };
    logAuthError(error, context);
    throw createUserError(
      'Registration failed',
      UserServiceErrorType.AUTHENTICATION_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Sign in with email and password
 * @param email User's email
 * @param password User's password
 * @returns UserCredential object
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  try {
    // Validate input data
    validateOrThrow(loginSchema, { email, password });
    
    const auth = getAuthInstance();
    const userCredential = await retryAuthOperation(() => 
      signInWithEmailAndPassword(auth, email, password)
    );
    
    // Update last login time in Firestore
    if (userCredential.user) {
      try {
        const db = getFirestoreDb();
        const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
        await updateDoc(userDocRef, {
          lastLoginAt: Timestamp.now().toMillis()
        });
      } catch (error) {
        // Don't fail the sign-in if updating last login time fails
        console.warn('Failed to update last login time:', error);
      }
    }
    
    return userCredential;
  } catch (error: unknown) {
    const context: Omit<ErrorContext, 'timestamp'> = { action: 'Email sign-in failed' };
    logAuthError(error, context);
    throw createUserError(
      'Email sign-in failed',
      UserServiceErrorType.AUTHENTICATION_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Sign in with Google
 * @returns UserCredential object
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const userCredential = await signInWithPopup(auth, provider);
    
    // Check if this is a new user
    const additionalUserInfo = userCredential as unknown as { _tokenResponse: AdditionalUserInfo };
    const isNewUser = additionalUserInfo._tokenResponse?.isNewUser;
    
    if (isNewUser && userCredential.user) {
      // Create user document in Firestore for new users
      const db = getFirestoreDb();
      
      try {
        // Use a transaction to ensure both user profile and stats are created atomically
        await runTransaction(db, async (transaction) => {
          const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
          const userStatsDocRef = doc(db, COLLECTIONS.USER_STATS, userCredential.user.uid);
          
          // Check if the document already exists
          const docSnap = await transaction.get(userDocRef);
          
          if (!docSnap.exists()) {
            // Create initial user profile that matches the UserProfile interface
            const now = Timestamp.now();
            const userProfile: Partial<UserProfile> = {
              uid: userCredential.user.uid,
              displayName: userCredential.user.displayName || `User${userCredential.user.uid.substring(0, 6)}`,
              email: userCredential.user.email || '',
              // Only add photoURL if it exists
              ...(userCredential.user.photoURL && { photoURL: userCredential.user.photoURL }),
              createdAt: now.toMillis(),
              lastLoginAt: now.toMillis(),
              isActive: true,
              level: 1,
              xp: 0,
              xpToNextLevel: 100,
              coins: 0,
              quizzesTaken: 0,
              questionsAnswered: 0,
              correctAnswers: 0,
              preferences: DEFAULT_USER_PREFERENCES,
              privacySettings: DEFAULT_PRIVACY_SETTINGS
            };
            
            // Create initial user stats
            const userStats = {
              userId: userCredential.user.uid,
              bestCategory: null,
              worstCategory: null,
              averageScore: 0,
              highestScore: 0,
              totalPlayTime: 0,
              longestStreak: 0,
              currentStreak: 0,
              quizzesTaken: 0,
              quizzesCreated: 0,
              totalPoints: 0,
              correctAnswers: 0,
              totalAnswers: 0,
              streak: 0,
              lastPlayed: null,
              createdAt: now,
              updatedAt: now
            };
            
            // Set both documents in the transaction
            transaction.set(userDocRef, userProfile);
            transaction.set(userStatsDocRef, userStats);
            
            console.log(`User profile and stats created for Google user ${userCredential.user.uid}`);
          } else {
            // Update last login time
            transaction.update(userDocRef, {
              lastLoginAt: Timestamp.now().toMillis()
            });
          }
        });
      } catch (firestoreError) {
        // If Firestore creation fails, we should still return the user credential
        // but log the error for monitoring
        console.error('Failed to create Google user profile in Firestore:', firestoreError);
        
        // Attempt to create the documents individually as a fallback
        try {
          const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
          const userStatsDocRef = doc(db, COLLECTIONS.USER_STATS, userCredential.user.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (!docSnap.exists()) {
            const now = Timestamp.now();
            
            // Create user profile
            await setDoc(userDocRef, {
              uid: userCredential.user.uid,
              displayName: userCredential.user.displayName || `User${userCredential.user.uid.substring(0, 6)}`,
              email: userCredential.user.email || '',
              // Only add photoURL if it exists
              ...(userCredential.user.photoURL && { photoURL: userCredential.user.photoURL }),
              createdAt: now.toMillis(),
              lastLoginAt: now.toMillis(),
              isActive: true,
              level: 1,
              xp: 0,
              xpToNextLevel: 100,
              coins: 0,
              quizzesTaken: 0,
              questionsAnswered: 0,
              correctAnswers: 0,
              preferences: DEFAULT_USER_PREFERENCES,
              privacySettings: DEFAULT_PRIVACY_SETTINGS
            });
            
            // Create user stats
            await setDoc(userStatsDocRef, {
              userId: userCredential.user.uid,
              quizzesTaken: 0,
              quizzesCreated: 0,
              totalPoints: 0,
              correctAnswers: 0,
              totalAnswers: 0,
              streak: 0,
              lastPlayed: null,
              createdAt: now,
              updatedAt: now
            });
            
            console.log(`User profile and stats created for Google user ${userCredential.user.uid} (fallback method)`);
          } else {
            // Update last login time
            await updateDoc(userDocRef, {
              lastLoginAt: Timestamp.now().toMillis()
            });
          }
        } catch (fallbackError) {
          console.error('Fallback Google user profile creation also failed:', fallbackError);
        }
      }
    } else if (userCredential.user) {
      // Update last login time for existing users
      try {
        const db = getFirestoreDb();
        const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
        await updateDoc(userDocRef, {
          lastLoginAt: Timestamp.now().toMillis()
        });
      } catch (error) {
        console.warn('Failed to update last login time:', error);
      }
    }
    
    return userCredential;
  } catch (error: unknown) {
    const context: Omit<ErrorContext, 'timestamp'> = { action: 'Google sign-in failed' };
    logAuthError(error, context);
    throw createUserError(
      'Google sign-in failed',
      UserServiceErrorType.AUTHENTICATION_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Send password reset email
 * @param email User's email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    // Validate input data
    validateOrThrow(resetPasswordSchema, { email });
    
    const auth = getAuthInstance();
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    const context: Omit<ErrorContext, 'timestamp'> = { action: 'Password reset failed' };
    logAuthError(error, context);
    throw createUserError(
      'Password reset failed',
      UserServiceErrorType.AUTHENTICATION_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Sign out the current user
 */
export async function logoutUser(): Promise<void> {
  try {
    const auth = getAuthInstance();
    await signOut(auth);
  } catch (error: unknown) {
    const context: Omit<ErrorContext, 'timestamp'> = { action: 'Logout failed' };
    logAuthError(error, context);
    throw createUserError(
      'Logout failed',
      UserServiceErrorType.AUTHENTICATION_ERROR,
      error instanceof FirebaseError ? error.code : undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
} 