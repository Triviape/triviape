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
  UserCredential
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
import { auth, db } from '@/lib/firebase';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';

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
  shareActivityWithFriends: true,
  allowFriendRequests: true,
  showOnlineStatus: true
};

/**
 * Service for user-related operations
 */
export class UserService {
  /**
   * Register a new user with email and password
   * @param email User's email
   * @param password User's password
   * @param displayName User's display name
   * @returns UserCredential object
   */
  static async registerWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<UserCredential> {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName
        });
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        // Create user profile document
        await this.createUserProfile(userCredential.user.uid, {
          displayName,
          email
        });
      }
      
      return userCredential;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param email User's email
   * @param password User's password
   * @returns UserCredential object
   */
  static async signInWithEmail(
    email: string,
    password: string
  ): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      if (userCredential.user) {
        await this.updateLastLogin(userCredential.user.uid);
      }
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * @returns UserCredential object
   */
  static async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;
      
      if (isNewUser && userCredential.user) {
        // Create user profile document for new users
        await this.createUserProfile(userCredential.user.uid, {
          displayName: userCredential.user.displayName || 'User',
          email: userCredential.user.email || ''
        });
      } else if (userCredential.user) {
        // Update last login time for existing users
        await this.updateLastLogin(userCredential.user.uid);
      }
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * Sign in with Twitter
   * @returns UserCredential object
   */
  static async signInWithTwitter(): Promise<UserCredential> {
    try {
      const provider = new TwitterAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;
      
      if (isNewUser && userCredential.user) {
        // Create user profile document for new users
        await this.createUserProfile(userCredential.user.uid, {
          displayName: userCredential.user.displayName || 'User',
          email: userCredential.user.email || ''
        });
      } else if (userCredential.user) {
        // Update last login time for existing users
        await this.updateLastLogin(userCredential.user.uid);
      }
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in with Twitter:', error);
      throw error;
    }
  }

  /**
   * Sign in with Facebook
   * @returns UserCredential object
   */
  static async signInWithFacebook(): Promise<UserCredential> {
    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;
      
      if (isNewUser && userCredential.user) {
        // Create user profile document for new users
        await this.createUserProfile(userCredential.user.uid, {
          displayName: userCredential.user.displayName || 'User',
          email: userCredential.user.email || ''
        });
      } else if (userCredential.user) {
        // Update last login time for existing users
        await this.updateLastLogin(userCredential.user.uid);
      }
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in with Facebook:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email User's email
   */
  static async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user ID
   * @param userId User ID
   * @returns User profile or null if not found
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      
      if (!userDoc.exists()) {
        return null;
      }
      
      const userData = userDoc.data();
      return {
        ...userData,
        uid: userDoc.id,
        createdAt: userData.createdAt?.toMillis() || 0,
        lastLoginAt: userData.lastLoginAt?.toMillis() || 0
      } as UserProfile;
    } catch (error) {
      console.error(`Error fetching user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user profile
   * @param userId User ID
   * @param userData Basic user data
   */
  static async createUserProfile(userId: string, userData: {
    displayName: string;
    email: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      
      // Prepare the user profile data
      const now = serverTimestamp();
      const userProfile = {
        displayName: userData.displayName,
        email: userData.email,
        photoURL: userData.photoURL || null,
        createdAt: now,
        lastLoginAt: now,
        isActive: true,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        coins: 50, // Starting coins
        quizzesTaken: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        preferences: DEFAULT_USER_PREFERENCES,
        privacySettings: DEFAULT_PRIVACY_SETTINGS
      };
      
      // Create the user document
      await setDoc(userRef, userProfile);
      
      // Initialize user stats
      await setDoc(doc(db, COLLECTIONS.USER_STATS, userId), {
        userId,
        averageScore: 0,
        highestScore: 0,
        totalPlayTime: 0,
        longestStreak: 0,
        currentStreak: 0,
        achievements: [],
        categoryStats: [],
        dailyActivity: []
      });
      
      // Initialize user inventory
      await setDoc(doc(db, COLLECTIONS.USER_INVENTORY, userId), {
        userId,
        items: [],
        powerUps: []
      });
    } catch (error) {
      console.error(`Error creating user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param userId User ID
   */
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating last login for ${userId}:`, error);
      // Don't throw as this is a non-critical operation
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
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        // Prevent updating critical fields
        uid: undefined,
        email: undefined,
        createdAt: undefined,
        isActive: undefined
      });
    } catch (error) {
      console.error(`Error updating user profile for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param userId User ID
   * @param preferences Updated preferences
   */
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        'preferences': preferences
      });
    } catch (error) {
      console.error(`Error updating preferences for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user privacy settings
   * @param userId User ID
   * @param settings Updated privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<PrivacySettings>
  ): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        'privacySettings': settings
      });
    } catch (error) {
      console.error(`Error updating privacy settings for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add XP to user
   * @param userId User ID
   * @param xpAmount Amount of XP to add
   * @returns Updated user level and XP
   */
  static async addUserXP(
    userId: string,
    xpAmount: number
  ): Promise<{level: number, xp: number, xpToNextLevel: number, leveledUp: boolean}> {
    try {
      // Get current user profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error(`User ${userId} not found`);
      }
      
      // Calculate new XP and level
      let newXP = userProfile.xp + xpAmount;
      let newLevel = userProfile.level;
      let xpToNextLevel = userProfile.xpToNextLevel;
      let leveledUp = false;
      
      // Check if user leveled up
      while (newXP >= xpToNextLevel) {
        newXP -= xpToNextLevel;
        newLevel++;
        leveledUp = true;
        
        // Calculate XP needed for next level (increases with each level)
        xpToNextLevel = Math.floor(100 * Math.pow(1.5, newLevel - 1));
      }
      
      // Update user profile
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        level: newLevel,
        xp: newXP,
        xpToNextLevel
      });
      
      return {
        level: newLevel,
        xp: newXP,
        xpToNextLevel,
        leveledUp
      };
    } catch (error) {
      console.error(`Error adding XP for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add coins to user
   * @param userId User ID
   * @param coinAmount Amount of coins to add
   * @returns New coin balance
   */
  static async addUserCoins(
    userId: string,
    coinAmount: number
  ): Promise<number> {
    try {
      // Update user coins
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        coins: increment(coinAmount)
      });
      
      // Get updated user profile to return new balance
      const updatedProfile = await this.getUserProfile(userId);
      return updatedProfile?.coins || 0;
    } catch (error) {
      console.error(`Error adding coins for ${userId}:`, error);
      throw error;
    }
  }
} 