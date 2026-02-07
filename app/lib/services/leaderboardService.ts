import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getCountFromServer,
  addDoc, 
  doc, 
  getDoc,
  startAfter,
  documentId,
  DocumentSnapshot,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { ref, onValue, off, push, set, get } from 'firebase/database';
import { db, realtimeDb } from '@/app/lib/firebase';
import { 
  DailyQuizLeaderboardEntry,
  UserRanking,
  LeaderboardEntryParams,
  EnhancedLeaderboardEntry, 
  LeaderboardPeriod, 
  LeaderboardType, 
  LeaderboardFilters,
  PaginatedLeaderboard,
  LeaderboardSubscription,
  LeaderboardUpdate,
  GlobalLeaderboardStats
} from '@/app/types/leaderboard';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { getTodayDateString } from './dailyQuizService';
import { socialPerformanceMonitor } from './socialPerformanceMonitor';

const LEADERBOARD_PAGE_SIZE = 25;
const CACHE_TTL = 60000; // 1 minute
const CACHE_CLEANUP_INTERVAL = 30000; // 30 seconds

type CacheEntry = {
  data: any;
  expiresAt: number;
};

/**
 * Helper functions for date calculations
 */
function getWeekDateString(): string {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  return startOfWeek.toISOString().split('T')[0];
}

function getMonthDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getDateString(period: LeaderboardPeriod): string {
  switch (period) {
    case 'daily':
      return getTodayDateString();
    case 'weekly':
      return getWeekDateString();
    case 'monthly':
      return getMonthDateString();
    case 'all-time':
      return 'all-time';
    default:
      return getTodayDateString();
  }
}

/**
 * Unified Leaderboard Service
 * Combines basic daily quiz leaderboard functionality with enhanced multi-period support
 */
export class LeaderboardService {
  private static instance: LeaderboardService;
  private subscriptions = new Map<string, Unsubscribe>();
  private cache = new Map<string, CacheEntry>();
  private cacheCleanupInterval: ReturnType<typeof setInterval> | null = null;

  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  // ==================== BASIC DAILY QUIZ FUNCTIONALITY ====================

  /**
   * Adds a user's score to the daily quiz leaderboard
   * @param userId User ID
   * @param params Parameters for the leaderboard entry
   * @returns The created leaderboard entry
   */
  async addToDailyLeaderboard(
    userId: string,
    params: LeaderboardEntryParams
  ): Promise<DailyQuizLeaderboardEntry> {
    const endMeasurement = socialPerformanceMonitor.startMeasurement('add-daily-leaderboard');
    
    try {
      // Get user data to include name and avatar
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const userData = userDoc.data();
      const dateCompleted = params.dateCompleted || getTodayDateString();
      
      // Create leaderboard entry
      const leaderboardEntry: Omit<DailyQuizLeaderboardEntry, 'rank'> = {
        userId,
        displayName: userData.displayName || 'Anonymous User',
        avatarUrl: userData.photoURL || undefined,
        score: params.score,
        completionTime: params.completionTime,
        dateCompleted,
        quizId: params.quizId
      };
      
      // Add to leaderboard collection
      const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARDS);
      const docRef = await addDoc(leaderboardRef, leaderboardEntry);
      
      const result = {
        ...leaderboardEntry,
        id: docRef.id
      } as DailyQuizLeaderboardEntry;

      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      console.error('Error adding to daily leaderboard:', error);
      throw new Error('Failed to add score to leaderboard');
    }
  }

  /**
   * Retrieves the leaderboard for a specific quiz
   * @param quizId Quiz ID
   * @param dateString Optional specific date for daily quizzes
   * @param maxEntries Maximum number of entries to return (default 100)
   * @returns Array of leaderboard entries sorted by score (desc) and completion time (asc)
   */
  async getDailyLeaderboardEntries(
    quizId: string,
    dateString?: string,
    maxEntries = 100
  ): Promise<DailyQuizLeaderboardEntry[]> {
    try {
      const leaderboardRef = collection(db, COLLECTIONS.LEADERBOARDS);
      
      // Create query based on parameters
      let leaderboardQuery = query(
        leaderboardRef,
        where('quizId', '==', quizId),
        orderBy('score', 'desc'),
        orderBy('completionTime', 'asc'),
        limit(maxEntries)
      );
      
      // Add date filter if provided
      if (dateString) {
        leaderboardQuery = query(
          leaderboardQuery,
          where('dateCompleted', '==', dateString)
        );
      }
      
      const snapshot = await getDocs(leaderboardQuery);
      
      if (snapshot.empty) {
        return [];
      }
      
      // Map and assign ranks
      let currentRank = 1;
      let previousScore = -1;
      let previousTime = -1;
      
      return snapshot.docs.map((doc, index) => {
        const data = doc.data() as DailyQuizLeaderboardEntry;
        
        // Determine rank (tied scores get the same rank)
        if (data.score !== previousScore || data.completionTime !== previousTime) {
          currentRank = index + 1;
        }
        
        previousScore = data.score;
        previousTime = data.completionTime;
        
        return {
          ...data,
          id: doc.id,
          rank: currentRank
        };
      });
    } catch (error) {
      console.error('Error getting daily leaderboard entries:', error);
      return [];
    }
  }

  /**
   * Calculates a user's ranking for a specific quiz
   * @param userId User ID
   * @param quizId Quiz ID
   * @param dateString Optional specific date for daily quizzes
   * @returns User ranking information
   */
  async calculateUserRanking(
    userId: string,
    quizId: string,
    dateString?: string
  ): Promise<UserRanking> {
    try {
      const leaderboardEntries = await this.getDailyLeaderboardEntries(quizId, dateString);
      
      // Find user's entry
      const userEntry = leaderboardEntries.find(entry => entry.userId === userId);
      
      if (!userEntry) {
        return {
          userId,
          quizId,
          rank: null,
          score: null,
          totalEntries: leaderboardEntries.length,
          isInTopTen: false
        };
      }
      
      return {
        userId,
        quizId,
        rank: userEntry.rank || null,
        score: userEntry.score,
        totalEntries: leaderboardEntries.length,
        isInTopTen: (userEntry.rank || 0) <= 10
      };
    } catch (error) {
      console.error('Error calculating user ranking:', error);
      return {
        userId,
        quizId,
        rank: null,
        score: null,
        totalEntries: 0,
        isInTopTen: false
      };
    }
  }

  // ==================== ENHANCED MULTI-PERIOD FUNCTIONALITY ====================

  /**
   * Get leaderboard entries with pagination support for enhanced functionality
   */
  async getLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    filters: LeaderboardFilters = {},
    pageSize = LEADERBOARD_PAGE_SIZE,
    cursor?: string
  ): Promise<PaginatedLeaderboard> {
    return socialPerformanceMonitor.measureAsync(
      'leaderboard-load',
      'leaderboard',
      async () => {
        try {
          const cacheKey = this.getCacheKey(type, period, filters, cursor);
          const cached = this.getFromCache(cacheKey);
          
          if (cached) {
            return cached;
          }

          const leaderboardRef = collection(db, this.getCollectionName(type, period));
          let leaderboardQuery = query(
            leaderboardRef,
            where('period', '==', period),
            orderBy('score', 'desc'),
            orderBy('completionTime', 'asc'),
            limit(pageSize + 1) // +1 to check if there's more
          );

          // Apply filters
          if (filters.categoryId) {
            leaderboardQuery = query(leaderboardQuery, where('categoryId', '==', filters.categoryId));
          }

          // Handle pagination
          if (cursor) {
            const cursorDoc = await getDoc(doc(db, this.getCollectionName(type, period), cursor));
            if (cursorDoc.exists()) {
              leaderboardQuery = query(leaderboardQuery, startAfter(cursorDoc));
            }
          }

          const snapshot = await getDocs(leaderboardQuery);
          const docs = snapshot.docs;
          const hasMore = docs.length > pageSize;
          
          if (hasMore) {
            docs.pop(); // Remove the extra document used for pagination
          }

          const entries = await this.processLeaderboardEntries(docs, filters.userId);
          const result: PaginatedLeaderboard = {
            entries,
            hasMore,
            nextCursor: hasMore ? docs[docs.length - 1].id : undefined,
            totalCount: await this.getTotalCount(type, period, filters),
            currentUserRank: filters.userId ? await this.getUserRank(filters.userId, type, period, filters) : undefined
          };

          this.setCache(cacheKey, result);
          return result;
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
          throw new Error('Failed to fetch leaderboard');
        }
      },
      { type, period, pageSize, hasCursor: !!cursor }
    );
  }

  /**
   * Subscribe to real-time leaderboard updates
   */
  subscribeToLeaderboard(
    type: LeaderboardType,
    period: LeaderboardPeriod,
    filters: LeaderboardFilters,
    callback: (update: LeaderboardUpdate) => void
  ): LeaderboardSubscription {
    const subscriptionKey = this.getSubscriptionKey(type, period, filters);
    
    // Use Firebase Realtime Database for live updates
    const realtimeRef = ref(realtimeDb, `leaderboards/${type}/${period}`);
    
    const unsubscribe = onValue(realtimeRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Process real-time update
        this.processRealtimeUpdate(data, callback);
      }
    });

    this.subscriptions.set(subscriptionKey, unsubscribe);

    return {
      unsubscribe: () => {
        const sub = this.subscriptions.get(subscriptionKey);
        if (sub) {
          sub();
          this.subscriptions.delete(subscriptionKey);
        }
      },
      isConnected: true
    };
  }

  /**
   * Add entry to enhanced leaderboard with real-time update
   */
  async addToEnhancedLeaderboard(
    userId: string,
    params: LeaderboardEntryParams,
    period: LeaderboardPeriod = 'daily'
  ): Promise<EnhancedLeaderboardEntry> {
    const endMeasurement = socialPerformanceMonitor.startMeasurement('add-enhanced-leaderboard');
    
    try {
      // Get user data
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const userData = userDoc.data();
      const dateCompleted = params.dateCompleted || getDateString(period);
      
      const entry: Omit<EnhancedLeaderboardEntry, 'rank'> = {
        id: '',
        userId,
        displayName: userData.displayName || 'Anonymous User',
        avatarUrl: userData.photoURL || undefined,
        score: params.score,
        completionTime: params.completionTime,
        period,
        quizId: params.quizId,
        dateCompleted,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore
      const leaderboardRef = collection(db, this.getCollectionName('global', period));
      const docRef = await addDoc(leaderboardRef, entry);

      // Add to Realtime Database for live updates
      const realtimeRef = ref(realtimeDb, `leaderboards/global/${period}/${docRef.id}`);
      await set(realtimeRef, {
        ...entry,
        id: docRef.id,
        timestamp: Date.now()
      });

      const finalEntry = { ...entry, id: docRef.id, rank: await this.calculateRank(entry, period) };
      
      // Clear relevant caches
      this.clearCacheForPeriod(period);
      
      endMeasurement();
      return finalEntry;
    } catch (error) {
      endMeasurement();
      console.error('Error adding to enhanced leaderboard:', error);
      throw new Error('Failed to add score to leaderboard');
    }
  }

  /**
   * Get global leaderboard statistics
   */
  async getGlobalStats(period: LeaderboardPeriod): Promise<GlobalLeaderboardStats> {
    try {
      const cacheKey = `stats_${period}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      const leaderboardRef = collection(db, this.getCollectionName('global', period));
      const snapshot = await getDocs(query(leaderboardRef, where('period', '==', period)));
      
      const entries = snapshot.docs.map(doc => doc.data());
      const scores = entries.map(entry => entry.score);
      
      const stats: GlobalLeaderboardStats = {
        totalPlayers: entries.length,
        averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        topScore: scores.length > 0 ? Math.max(...scores) : 0,
        lastUpdated: new Date().toISOString()
      };

      this.setCache(cacheKey, stats, CACHE_TTL * 5); // Cache stats for 5 minutes
      return stats;
    } catch (error) {
      console.error('Error fetching global stats:', error);
      throw new Error('Failed to fetch global statistics');
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private getCollectionName(type: LeaderboardType, period: LeaderboardPeriod): string {
    return `leaderboards_${type}_${period}`;
  }

  private getCacheKey(type: LeaderboardType, period: LeaderboardPeriod, filters: LeaderboardFilters, cursor?: string): string {
    return `${type}_${period}_${JSON.stringify(filters)}_${cursor || 'first'}`;
  }

  private getSubscriptionKey(type: LeaderboardType, period: LeaderboardPeriod, filters: LeaderboardFilters): string {
    return `sub_${type}_${period}_${JSON.stringify(filters)}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any, ttl = CACHE_TTL): void {
    this.ensureCacheCleanupInterval();
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }

  private ensureCacheCleanupInterval(): void {
    if (this.cacheCleanupInterval) {
      return;
    }

    this.cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      this.cache.forEach((value, key) => {
        if (now >= value.expiresAt) {
          this.cache.delete(key);
        }
      });
    }, CACHE_CLEANUP_INTERVAL);
  }

  private clearCacheForPeriod(period: LeaderboardPeriod): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (key.includes(period)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private async processLeaderboardEntries(
    docs: any[], 
    currentUserId?: string
  ): Promise<EnhancedLeaderboardEntry[]> {
    return docs.map((doc, index) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        rank: index + 1,
        isCurrentUser: currentUserId === data.userId,
        isFriend: false // TODO: Implement friend checking
      };
    });
  }

  private async getTotalCount(
    type: LeaderboardType, 
    period: LeaderboardPeriod, 
    filters: LeaderboardFilters
  ): Promise<number> {
    // This is a simplified implementation
    // In production, you'd want to maintain aggregate counts
    const leaderboardRef = collection(db, this.getCollectionName(type, period));
    let countQuery = query(leaderboardRef, where('period', '==', period));
    
    if (filters.categoryId) {
      countQuery = query(countQuery, where('categoryId', '==', filters.categoryId));
    }

    const snapshot = await getDocs(countQuery);
    return snapshot.size;
  }

  private async getUserRank(
    userId: string, 
    type: LeaderboardType, 
    period: LeaderboardPeriod, 
    filters: LeaderboardFilters
  ): Promise<number | undefined> {
    const leaderboardRef = collection(db, this.getCollectionName(type, period));
    let userEntryQuery = query(
      leaderboardRef,
      where('period', '==', period),
      where('userId', '==', userId),
      orderBy('score', 'desc'),
      orderBy('completionTime', 'asc'),
      limit(1)
    );

    if (filters.categoryId) {
      userEntryQuery = query(userEntryQuery, where('categoryId', '==', filters.categoryId));
    }

    const userEntrySnapshot = await getDocs(userEntryQuery);
    if (userEntrySnapshot.empty) {
      return undefined;
    }

    const userEntryDoc = userEntrySnapshot.docs[0];
    const userEntryData = userEntryDoc.data() as EnhancedLeaderboardEntry;

    let higherScoreQuery = query(
      leaderboardRef,
      where('period', '==', period),
      where('score', '>', userEntryData.score)
    );

    let fasterTieBreakerQuery = query(
      leaderboardRef,
      where('period', '==', period),
      where('score', '==', userEntryData.score),
      where('completionTime', '<', userEntryData.completionTime)
    );

    let sameScoreAndTimeEarlierDocQuery = query(
      leaderboardRef,
      where('period', '==', period),
      where('score', '==', userEntryData.score),
      where('completionTime', '==', userEntryData.completionTime),
      where(documentId(), '<', userEntryDoc.id)
    );

    if (filters.categoryId) {
      higherScoreQuery = query(higherScoreQuery, where('categoryId', '==', filters.categoryId));
      fasterTieBreakerQuery = query(fasterTieBreakerQuery, where('categoryId', '==', filters.categoryId));
      sameScoreAndTimeEarlierDocQuery = query(
        sameScoreAndTimeEarlierDocQuery,
        where('categoryId', '==', filters.categoryId)
      );
    }

    const [higherScoreCount, fasterTieBreakerCount, sameScoreAndTimeEarlierDocCount] = await Promise.all([
      getCountFromServer(higherScoreQuery),
      getCountFromServer(fasterTieBreakerQuery),
      getCountFromServer(sameScoreAndTimeEarlierDocQuery)
    ]);

    return (
      higherScoreCount.data().count +
      fasterTieBreakerCount.data().count +
      sameScoreAndTimeEarlierDocCount.data().count +
      1
    );
  }

  private async calculateRank(entry: Omit<EnhancedLeaderboardEntry, 'rank'>, period: LeaderboardPeriod): Promise<number> {
    const leaderboardRef = collection(db, this.getCollectionName('global', period));
    const higherScoresQuery = query(
      leaderboardRef,
      where('period', '==', period),
      where('score', '>', entry.score)
    );
    
    const snapshot = await getDocs(higherScoresQuery);
    return snapshot.size + 1;
  }

  private processRealtimeUpdate(data: any, callback: (update: LeaderboardUpdate) => void): void {
    // Process real-time data and trigger callback
    // This is a simplified implementation
    const update: LeaderboardUpdate = {
      type: 'entry_updated',
      entry: data as EnhancedLeaderboardEntry
    };
    callback(update);
  }

  /**
   * Clean up all subscriptions
   */
  public cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const leaderboardService = LeaderboardService.getInstance();

// ==================== LEGACY COMPATIBILITY EXPORTS ====================

/**
 * Legacy compatibility functions for existing code
 * These maintain the old API while using the new unified service
 */

export async function addToLeaderboard(
  userId: string,
  params: LeaderboardEntryParams
): Promise<DailyQuizLeaderboardEntry> {
  return leaderboardService.addToDailyLeaderboard(userId, params);
}

export async function getLeaderboardEntries(
  quizId: string,
  dateString?: string,
  maxEntries = 100
): Promise<DailyQuizLeaderboardEntry[]> {
  return leaderboardService.getDailyLeaderboardEntries(quizId, dateString, maxEntries);
}

export async function calculateUserRanking(
  userId: string,
  quizId: string,
  dateString?: string
): Promise<UserRanking> {
  return leaderboardService.calculateUserRanking(userId, quizId, dateString);
}
