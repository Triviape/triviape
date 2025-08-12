import { UserProfile } from '@/app/types/user';
import { 
  ServiceErrorType, 
  createServiceError,
  handleNotFoundError,
  withErrorHandling
} from './errorHandler';
import { ProfileService } from './profileService';

// Game configuration
const GAME_CONFIG = {
  XP_PER_LEVEL: parseInt(process.env.XP_PER_LEVEL || '100'),
  MAX_XP_AMOUNT: parseInt(process.env.MAX_XP_AMOUNT || '10000'),
  MAX_COIN_AMOUNT: parseInt(process.env.MAX_COIN_AMOUNT || '10000')
};

/**
 * Optimized XP and level calculation utilities
 */
class ProgressionUtils {
  /**
   * Calculate level from XP using mathematical formula (O(1) instead of O(n))
   */
  static calculateLevel(xp: number): { level: number; xpToNextLevel: number } {
    const level = Math.floor(Math.sqrt(xp / GAME_CONFIG.XP_PER_LEVEL)) + 1;
    const xpToNextLevel = level * GAME_CONFIG.XP_PER_LEVEL;
    return { level, xpToNextLevel };
  }

  /**
   * Calculate if user leveled up and new progression data
   */
  static calculateProgression(currentXP: number, xpGain: number): {
    newXP: number;
    newLevel: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    levelsGained: number;
  } {
    const newXP = currentXP + xpGain;
    const currentLevelData = this.calculateLevel(currentXP);
    const newLevelData = this.calculateLevel(newXP);
    
    const leveledUp = newLevelData.level > currentLevelData.level;
    const levelsGained = newLevelData.level - currentLevelData.level;
    
    return {
      newXP,
      newLevel: newLevelData.level,
      xpToNextLevel: newLevelData.xpToNextLevel,
      leveledUp,
      levelsGained
    };
  }
}

/**
 * Progression Service - handles XP, levels, and coins
 */
export class ProgressionService {
  /**
   * Add XP to user with optimized calculation
   */
  static async addUserXP(
    userId: string,
    xpAmount: number
  ): Promise<{
    level: number;
    xp: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    levelsGained: number;
  }> {
    return withErrorHandling(async () => {
      // Validate XP amount
      if (xpAmount < 0) {
        throw createServiceError(
          'XP amount cannot be negative',
          ServiceErrorType.VALIDATION_ERROR
        );
      }
      if (xpAmount > GAME_CONFIG.MAX_XP_AMOUNT) {
        throw createServiceError(
          `XP amount cannot exceed ${GAME_CONFIG.MAX_XP_AMOUNT}`,
          ServiceErrorType.VALIDATION_ERROR
        );
      }

      const instance = new ProfileService();
      const user = await instance.read(userId);
      
      if (!user) {
        throw handleNotFoundError('User', userId);
      }

      // Use optimized progression calculation
      const progression = ProgressionUtils.calculateProgression(user.xp, xpAmount);

      await instance.update(userId, {
        xp: progression.newXP,
        level: progression.newLevel,
        xpToNextLevel: progression.xpToNextLevel
      });

      return {
        level: progression.newLevel,
        xp: progression.newXP,
        xpToNextLevel: progression.xpToNextLevel,
        leveledUp: progression.leveledUp,
        levelsGained: progression.levelsGained
      };
    }, 'addUserXP');
  }

  /**
   * Add coins to user
   */
  static async addUserCoins(
    userId: string,
    coinAmount: number
  ): Promise<number> {
    return withErrorHandling(async () => {
      // Validate coin amount
      if (coinAmount < 0) {
        throw createServiceError(
          'Coin amount cannot be negative',
          ServiceErrorType.VALIDATION_ERROR
        );
      }
      if (coinAmount > GAME_CONFIG.MAX_COIN_AMOUNT) {
        throw createServiceError(
          `Coin amount cannot exceed ${GAME_CONFIG.MAX_COIN_AMOUNT}`,
          ServiceErrorType.VALIDATION_ERROR
        );
      }

      const instance = new ProfileService();
      const user = await instance.read(userId);
      
      if (!user) {
        throw handleNotFoundError('User', userId);
      }

      const newCoins = user.coins + coinAmount;
      await instance.update(userId, { coins: newCoins });

      return newCoins;
    }, 'addUserCoins');
  }

  /**
   * Get user progression data
   */
  static async getUserProgression(userId: string): Promise<{
    level: number;
    xp: number;
    xpToNextLevel: number;
    coins: number;
  } | null> {
    return withErrorHandling(async () => {
      const user = await ProfileService.getUserProfile(userId);
      
      if (!user) {
        return null;
      }

      return {
        level: user.level,
        xp: user.xp,
        xpToNextLevel: user.xpToNextLevel,
        coins: user.coins
      };
    }, 'getUserProgression');
  }

  /**
   * Calculate level from XP (utility method)
   */
  static calculateLevelFromXP(xp: number): { level: number; xpToNextLevel: number } {
    return ProgressionUtils.calculateLevel(xp);
  }

  /**
   * Calculate progression from current XP and gain (utility method)
   */
  static calculateProgressionFromXP(currentXP: number, xpGain: number): {
    newXP: number;
    newLevel: number;
    xpToNextLevel: number;
    leveledUp: boolean;
    levelsGained: number;
  } {
    return ProgressionUtils.calculateProgression(currentXP, xpGain);
  }
} 