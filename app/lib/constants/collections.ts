/**
 * Firestore collection names
 * Centralized collection name constants to prevent typos and enable easy refactoring
 */

export const COLLECTIONS = {
  // User-related collections
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  USER_PROFILE_SUMMARIES: 'user_profile_summaries',
  USER_STATS: 'user_stats',
  USER_DAILY_QUIZZES: 'user_daily_quizzes',
  
  // Quiz-related collections
  QUIZZES: 'Quizzes',
  QUESTIONS: 'Questions',
  CATEGORIES: 'Categories',
  QUIZ_ATTEMPTS: 'QuizAttempts',
  
  // Daily quiz collections
  DAILY_QUIZZES: 'daily_quizzes',
  
  // Leaderboard collections
  LEADERBOARDS: 'leaderboards',
  LEADERBOARD_ENTRIES: 'leaderboard_entries',
  
  // Achievement collections
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements',
  
  // Content collections
  CONTENT: 'content',
  ANNOUNCEMENTS: 'announcements',
  
  // Analytics collections
  ANALYTICS: 'analytics',
  USER_ACTIVITY: 'user_activity',
  
  // System collections
  SYSTEM_CONFIG: 'system_config',
  MAINTENANCE: 'maintenance'
} as const;

/**
 * Collection name type for type safety
 */
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/**
 * Helper function to get collection reference with type safety
 * @param collectionName The name of the collection
 * @returns The collection name string
 */
export function getCollectionName(collectionName: CollectionName): string {
  return COLLECTIONS[collectionName as keyof typeof COLLECTIONS];
} 
