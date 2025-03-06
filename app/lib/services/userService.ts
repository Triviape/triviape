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
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  DocumentReference,
  Timestamp
} from 'firebase/firestore';
import { auth, db, getAuthInstance, getFirestoreDb } from '../firebase';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';
import { retryAuthOperation, logAuthError } from '../authErrorHandler';
import { FirebaseError } from 'firebase/app';
import { ErrorCategory, ErrorSeverity } from '../errorHandler';

// Collections
const COLLECTIONS = {
  USERS: 'users',
  USER_STATS: 'user_stats',
  USER_INVENTORY: 'user_inventory'
};

// Default user preferences
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

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showOnLeaderboards: true,
  profileVisibility: 'public',
  showOnlineStatus: true,
  shareActivityWithFriends: true,
  allowFriendRequests: true
};

/**
 * Service for handling user-related operations
 * Uses Firebase Authentication and Firestore
 */
export class UserService {
  /**
   * Register a new user with email and password
   * @param email User email
   * @param password User password
   * @param displayName User display name
   * @returns UserCredential object
   */
  static async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> {
    const operationContext = {
      action: 'registerWithEmail',
      category: ErrorCategory.AUTHENTICATION,
      additionalData: {
        email,
        displayName
      }
    };
    
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        throw new Error('Server-side registration should be done through API routes');
      }
      
      // Client-side registration
      // Use retry mechanism for network-sensitive operations
      return await retryAuthOperation(async () => {
        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(
          getAuthInstance(),
          email,
          password
        );
        
        // Update the user profile with the display name
        await updateProfile(userCredential.user, {
          displayName
        });
        
        // Create the user profile in Firestore
        await this.createUserProfile(userCredential.user.uid, {
          displayName,
          email,
          photoURL: userCredential.user.photoURL || ''
        });
        
        return userCredential;
      });
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Sign in with email and password
   * @param email User email
   * @param password User password
   * @returns UserCredential object
   */
  static async signInWithEmail(
    email: string,
    password: string
  ): Promise<UserCredential> {
    const operationContext = {
      action: 'signInWithEmail',
      category: ErrorCategory.AUTHENTICATION,
      additionalData: {
        email
      }
    };
    
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        throw new Error('Server-side authentication should be done through API routes');
      }
      
      // Client-side authentication
      return await retryAuthOperation(async () => {
        const userCredential = await signInWithEmailAndPassword(
          getAuthInstance(),
          email,
          password
        );
        
        // Update last login timestamp
        await this.updateLastLogin(userCredential.user.uid);
        
        return userCredential;
      });
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Sign in with Google
   * @returns UserCredential object
   */
  static async signInWithGoogle(): Promise<UserCredential> {
    const operationContext = {
      action: 'signInWithGoogle',
      category: ErrorCategory.AUTHENTICATION
    };
    
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        throw new Error('Server-side authentication should be done through API routes');
      }
      
      // Client-side authentication
      return await retryAuthOperation(async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        const userCredential = await signInWithPopup(getAuthInstance(), provider);
        
        // Check if this is a new user
        const additionalUserInfo = userCredential as unknown as { _tokenResponse: { isNewUser: boolean } };
        const isNewUser = additionalUserInfo._tokenResponse?.isNewUser;
        
        if (isNewUser) {
          // Create user profile for new users
          await this.createUserProfile(userCredential.user.uid, {
            displayName: userCredential.user.displayName || 'User',
            email: userCredential.user.email || '',
            photoURL: userCredential.user.photoURL || ''
          });
        } else {
          // Update last login for existing users
          await this.updateLastLogin(userCredential.user.uid);
        }
        
        return userCredential;
      });
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Sign in with Twitter
   * @returns UserCredential object
   */
  static async signInWithTwitter(): Promise<UserCredential> {
    const operationContext = {
      action: 'signInWithTwitter',
      category: ErrorCategory.AUTHENTICATION
    };
    
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        throw new Error('Server-side authentication should be done through API routes');
      }
      
      // Client-side authentication
      return await retryAuthOperation(async () => {
        const provider = new TwitterAuthProvider();
        
        const userCredential = await signInWithPopup(getAuthInstance(), provider);
        
        // Check if this is a new user
        const additionalUserInfo = userCredential as unknown as { _tokenResponse: { isNewUser: boolean } };
        const isNewUser = additionalUserInfo._tokenResponse?.isNewUser;
        
        if (isNewUser) {
          // Create user profile for new users
          await this.createUserProfile(userCredential.user.uid, {
            displayName: userCredential.user.displayName || 'User',
            email: userCredential.user.email || '',
            photoURL: userCredential.user.photoURL || ''
          });
        } else {
          // Update last login for existing users
          await this.updateLastLogin(userCredential.user.uid);
        }
        
        return userCredential;
      });
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Sign in with Facebook
   * @returns UserCredential object
   */
  static async signInWithFacebook(): Promise<UserCredential> {
    const operationContext = {
      action: 'signInWithFacebook',
      category: ErrorCategory.AUTHENTICATION
    };
    
    try {
      // Check if we're on the server side
      if (typeof window === 'undefined') {
        throw new Error('Server-side authentication should be done through API routes');
      }
      
      // Client-side authentication
      return await retryAuthOperation(async () => {
        const provider = new FacebookAuthProvider();
        
        const userCredential = await signInWithPopup(getAuthInstance(), provider);
        
        // Check if this is a new user
        const additionalUserInfo = userCredential as unknown as { _tokenResponse: { isNewUser: boolean } };
        const isNewUser = additionalUserInfo._tokenResponse?.isNewUser;
        
        if (isNewUser) {
          // Create user profile for new users
          await this.createUserProfile(userCredential.user.uid, {
            displayName: userCredential.user.displayName || 'User',
            email: userCredential.user.email || '',
            photoURL: userCredential.user.photoURL || ''
          });
        } else {
          // Update last login for existing users
          await this.updateLastLogin(userCredential.user.uid);
        }
        
        return userCredential;
      });
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Send password reset email
   * @param email User email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    const operationContext = {
      action: 'sendPasswordReset',
      category: ErrorCategory.AUTHENTICATION,
      additionalData: {
        email
      }
    };
    
    try {
      await sendPasswordResetEmail(getAuthInstance(), email);
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    const operationContext = {
      action: 'signOut',
      category: ErrorCategory.AUTHENTICATION
    };
    
    try {
      await signOut(getAuthInstance());
    } catch (error) {
      // Log detailed error information
      logAuthError(error, operationContext);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
  
  /**
   * Get user profile from Firestore
   * @param userId User ID
   * @returns User profile or null if not found
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const operationContext = {
      action: 'getUserProfile',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId
      }
    };

    try {
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return userDoc.data() as UserProfile;
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
  
  /**
   * Create a new user profile in Firestore
   * @param userId User ID
   * @param userData Basic user data
   */
  static async createUserProfile(userId: string, userData: {
    displayName: string;
    email: string;
    photoURL?: string;
  }): Promise<void> {
    const operationContext = {
      action: 'createUserProfile',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId,
        email: userData.email
      }
    };

    try {
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      
      // Create user profile with default values
      const userProfile: UserProfile = {
        uid: userId,
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL || '',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        preferences: DEFAULT_USER_PREFERENCES,
        privacySettings: DEFAULT_PRIVACY_SETTINGS,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 100, // Starting coins
        quizzesTaken: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        isActive: true
      };
      
      await setDoc(userRef, userProfile);
      
      // Create user stats document
      const statsRef = doc(getFirestoreDb(), COLLECTIONS.USER_STATS, userId);
      await setDoc(statsRef, {
        uid: userId,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 100,
        lastUpdated: serverTimestamp()
      });
      
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
  
  /**
   * Update user's last login timestamp
   * @param userId User ID
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const operationContext = {
      action: 'updateLastLogin',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId
      }
    };

    try {
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      logAuthError(error, operationContext);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Update user profile
   * @param userId User ID
   * @param updates Profile updates
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<void> {
    const operationContext = {
      action: 'updateUserProfile',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId
      }
    };

    try {
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
  
  /**
   * Update user preferences
   * @param userId User ID
   * @param preferences Preference updates
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const operationContext = {
      action: 'updateUserPreferences',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId
      }
    };

    try {
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        'preferences': preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
  
  /**
   * Update privacy settings
   * @param userId User ID
   * @param settings Privacy setting updates
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    const operationContext = {
      action: 'updatePrivacySettings',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId
      }
    };

    try {
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        'privacySettings': settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
  
  /**
   * Add XP to user and handle level ups
   * @param userId User ID
   * @param xpAmount Amount of XP to add
   * @returns Updated level, xp, and whether user leveled up
   */
  static async addUserXP(
    userId: string,
    xpAmount: number
  ): Promise<{level: number, xp: number, xpToNextLevel: number, leveledUp: boolean}> {
    const operationContext = {
      action: 'addUserXP',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId,
        xpAmount
      }
    };

    try {
      // Get current stats
      const statsRef = doc(getFirestoreDb(), COLLECTIONS.USER_STATS, userId);
      const statsDoc = await getDoc(statsRef);
      
      if (!statsDoc.exists()) {
        throw new Error('User stats not found');
      }
      
      const stats = statsDoc.data();
      let currentLevel = stats.level || 1;
      let currentXP = stats.xp || 0;
      let xpToNextLevel = stats.xpToNextLevel || 100;
      
      // Add XP
      currentXP += xpAmount;
      
      // Check for level up
      let leveledUp = false;
      
      // XP required for next level increases with each level
      // Formula: 100 * (level ^ 1.5)
      while (currentXP >= xpToNextLevel) {
        currentLevel++;
        currentXP -= xpToNextLevel;
        xpToNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5));
        leveledUp = true;
      }
      
      // Update stats
      await updateDoc(statsRef, {
        level: currentLevel,
        xp: currentXP,
        xpToNextLevel: xpToNextLevel,
        lastUpdated: serverTimestamp()
      });
      
      // Update user profile
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        level: currentLevel,
        xp: currentXP
      });
      
      return {
        level: currentLevel,
        xp: currentXP,
        xpToNextLevel,
        leveledUp
      };
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
  
  /**
   * Add coins to user
   * @param userId User ID
   * @param coinAmount Amount of coins to add
   * @returns Updated coin balance
   */
  static async addUserCoins(
    userId: string,
    coinAmount: number
  ): Promise<number> {
    const operationContext = {
      action: 'addUserCoins',
      category: ErrorCategory.DATABASE,
      additionalData: {
        userId,
        coinAmount
      }
    };

    try {
      // Update stats
      const statsRef = doc(getFirestoreDb(), COLLECTIONS.USER_STATS, userId);
      await updateDoc(statsRef, {
        coins: increment(coinAmount),
        lastUpdated: serverTimestamp()
      });
      
      // Update user profile
      const userRef = doc(getFirestoreDb(), COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        coins: increment(coinAmount)
      });
      
      // Get updated coin balance
      const updatedStats = await getDoc(statsRef);
      return updatedStats.data()?.coins || 0;
    } catch (error) {
      logAuthError(error, operationContext);
      throw error;
    }
  }
} 