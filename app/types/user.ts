/**
 * User profile information
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  
  // User customization
  characterSettings?: CharacterSettings;
  
  // Account information
  createdAt: number;
  lastLoginAt: number;
  isActive: boolean;
  
  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Currency
  coins: number;
  
  // Stats
  quizzesTaken: number;
  questionsAnswered: number;
  correctAnswers: number;
  
  // Preferences
  preferences: UserPreferences;
  
  // Privacy settings
  privacySettings: PrivacySettings;
}

/**
 * User preferences for app experience
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  soundEffects: boolean;
  musicVolume: number; // 0-100
  sfxVolume: number; // 0-100
  language: string; // ISO language code
  notifications: {
    dailyReminder: boolean;
    quizAvailable: boolean;
    friendActivity: boolean;
    teamActivity: boolean;
  };
  animationLevel: 'full' | 'reduced' | 'minimal';
}

/**
 * User privacy settings
 */
export interface PrivacySettings {
  showOnLeaderboards: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
  shareActivityWithFriends: boolean;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
}

/**
 * Character customization settings
 */
export interface CharacterSettings {
  skinColor: string;
  eyeColor: string;
  hairColor: string;
  hairStyle: string;
  facialFeatures: {
    eyes: string;
    nose: string;
    mouth: string;
  };
  outfit: {
    top: string;
    bottom: string;
    shoes: string;
    accessory?: string;
    hat?: string;
  };
  unlockedItems: string[]; // IDs of unlocked customization items
}

/**
 * User statistics for analytics and profile
 */
export interface UserStats {
  userId: string;
  
  // Quiz performance
  bestCategory?: string;
  worstCategory?: string;
  averageScore: number;
  highestScore: number;
  fastestQuizCompletion?: number; // Time in seconds
  
  // Time-based stats
  totalPlayTime: number; // Total time in seconds
  longestStreak: number; // Days
  currentStreak: number; // Days
  
  // Achievement progress
  achievements: {
    achievementId: string;
    progress: number;
    completed: boolean;
    completedAt?: number;
  }[];
  
  // Category performance
  categoryStats: {
    categoryId: string;
    questionsAnswered: number;
    correctAnswers: number;
    averageScore: number;
  }[];
  
  // Daily activity
  dailyActivity: {
    date: string; // ISO date string
    quizzesTaken: number;
    questionsAnswered: number;
    xpEarned: number;
    playTime: number; // Time in seconds
  }[];
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  
  // Requirements
  requiredValue: number; // Target value to complete
  currentValue?: number; // User's current progress
  
  // Rewards
  xpReward: number;
  coinReward: number;
  
  // Achievement metadata
  category: 'quiz' | 'social' | 'login' | 'challenge' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  isHidden: boolean; // Whether this achievement is a surprise
}

/**
 * Represents a user's inventory items
 */
export interface UserInventory {
  userId: string;
  items: {
    itemId: string;
    quantity: number;
    acquired: number; // Timestamp when acquired
    lastUsed?: number; // Timestamp when last used
  }[];
  powerUps: {
    powerUpId: string;
    quantity: number;
    acquired: number;
  }[];
} 