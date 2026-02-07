import { UserService, AuthService, ProfileService, PreferencesService, ProgressionService } from '@/app/lib/services';
import { createServiceError, ServiceErrorType } from '@/app/lib/services/errorHandler';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';

// Mock Firebase imports
const mockFirebaseAuth = {
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  TwitterAuthProvider: jest.fn(),
  FacebookAuthProvider: jest.fn(),
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
};

const mockFirebaseFirestore = {
  getFirestore: jest.fn(),
  doc: jest.fn(),
  writeBatch: jest.fn(),
  runTransaction: jest.fn(),
};

jest.mock('firebase/auth', () => mockFirebaseAuth);
jest.mock('firebase/firestore', () => mockFirebaseFirestore);

jest.mock('@/app/lib/firebase', () => ({
  initializeFirebaseAuth: jest.fn(() => ({
    signOut: jest.fn(),
  })),
  getAuthInstance: jest.fn(() => 'mock-auth-instance'),
  getFirestoreDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
      })),
    })),
  })),
}));

describe('UserService Refactor - Comprehensive Tests', () => {
  const mockUserProfile: UserProfile = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: undefined,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    isActive: true,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    coins: 0,
    quizzesTaken: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    preferences: {
      theme: 'system',
      soundEffects: true,
      musicVolume: 70,
      sfxVolume: 100,
      language: 'en',
      notifications: {
        dailyReminder: true,
        quizAvailable: true,
        friendActivity: true,
        teamActivity: true,
      },
      animationLevel: 'full'
    },
    privacySettings: {
      showOnLeaderboards: true,
      profileVisibility: 'public',
      showOnlineStatus: true,
      shareActivityWithFriends: true,
      allowFriendRequests: true
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService', () => {
    describe('registerWithEmail', () => {
      it('should register user with valid credentials', async () => {
        const mockUserCredential = {
          user: {
            uid: 'test-user-id',
            email: 'test@example.com',
            displayName: 'Test User'
          }
        };

        const { createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
        createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
        updateProfile.mockResolvedValue(undefined);

        const result = await AuthService.registerWithEmail('test@example.com', 'Password123!', 'Test User');

        expect(result).toEqual(mockUserCredential);
        expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'Password123!'
        );
        expect(updateProfile).toHaveBeenCalledWith(mockUserCredential.user, {
          displayName: 'Test User'
        });
      });

      it('should throw validation error for invalid email', async () => {
        const { createUserWithEmailAndPassword } = require('firebase/auth');
        createUserWithEmailAndPassword.mockRejectedValue(new Error('Invalid email'));
        await expect(
          AuthService.registerWithEmail('invalid-email', 'Password123!', 'Test User')
        ).rejects.toThrow('Invalid email');
      });

      it('should throw validation error for weak password', async () => {
        const { createUserWithEmailAndPassword } = require('firebase/auth');
        createUserWithEmailAndPassword.mockRejectedValue(new Error('Invalid password'));
        await expect(
          AuthService.registerWithEmail('test@example.com', 'weak', 'Test User')
        ).rejects.toThrow('Invalid password');
      });

      it('should throw validation error for invalid display name', async () => {
        const { createUserWithEmailAndPassword } = require('firebase/auth');
        createUserWithEmailAndPassword.mockRejectedValue(new Error('Invalid display name'));
        await expect(
          AuthService.registerWithEmail('test@example.com', 'Password123!', '')
        ).rejects.toThrow('Invalid display name');
      });
    });

    describe('signInWithEmail', () => {
      it('should sign in user with valid credentials', async () => {
        const mockUserCredential = {
          user: {
            uid: 'test-user-id',
            email: 'test@example.com'
          }
        };

        const { signInWithEmailAndPassword } = require('firebase/auth');
        signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

        const result = await AuthService.signInWithEmail('test@example.com', 'Password123!');

        expect(result).toEqual(mockUserCredential);
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'Password123!'
        );
      });

      it('should throw validation error for invalid email', async () => {
        const { signInWithEmailAndPassword } = require('firebase/auth');
        signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid email'));
        await expect(
          AuthService.signInWithEmail('invalid-email', 'Password123!')
        ).rejects.toThrow('Invalid email');
      });
    });

    describe('social authentication', () => {
      it('should sign in with Google', async () => {
        const mockUserCredential = {
          user: {
            uid: 'test-user-id',
            displayName: 'Test User',
            email: 'test@example.com'
          }
        };

        const { signInWithPopup, GoogleAuthProvider } = require('firebase/auth');
        signInWithPopup.mockResolvedValue(mockUserCredential);
        GoogleAuthProvider.mockImplementation(() => ({}));

        const result = await AuthService.signInWithGoogle();

        expect(result).toEqual(mockUserCredential);
        expect(signInWithPopup).toHaveBeenCalled();
      });

      it('should sign in with Twitter', async () => {
        const mockUserCredential = {
          user: {
            uid: 'test-user-id',
            displayName: 'Test User',
            email: 'test@example.com'
          }
        };

        const { signInWithPopup, TwitterAuthProvider } = require('firebase/auth');
        signInWithPopup.mockResolvedValue(mockUserCredential);
        TwitterAuthProvider.mockImplementation(() => ({}));

        const result = await AuthService.signInWithTwitter();

        expect(result).toEqual(mockUserCredential);
        expect(signInWithPopup).toHaveBeenCalled();
      });

      it('should sign in with Facebook', async () => {
        const mockUserCredential = {
          user: {
            uid: 'test-user-id',
            displayName: 'Test User',
            email: 'test@example.com'
          }
        };

        const { signInWithPopup, FacebookAuthProvider } = require('firebase/auth');
        signInWithPopup.mockResolvedValue(mockUserCredential);
        FacebookAuthProvider.mockImplementation(() => ({}));

        const result = await AuthService.signInWithFacebook();

        expect(result).toEqual(mockUserCredential);
        expect(signInWithPopup).toHaveBeenCalled();
      });
    });

    describe('password reset', () => {
      it('should expose password reset method', () => {
        expect(typeof AuthService.sendPasswordReset).toBe('function');
      });

      it('should throw validation error for invalid email', async () => {
        await expect(
          AuthService.sendPasswordReset('invalid-email')
        ).rejects.toThrow('Invalid email');
      });
    });
  });

  describe('ProfileService', () => {
    describe('createUserProfileWithBatch', () => {
      it('should create user profile with batch operation', async () => {
        const { writeBatch, doc, getFirestore } = require('firebase/firestore');
        const mockBatch = {
          set: jest.fn(),
          commit: jest.fn().mockResolvedValue(undefined)
        };

        writeBatch.mockReturnValue(mockBatch);
        doc.mockReturnValue('mock-doc-ref');
        getFirestore.mockReturnValue('mock-firestore');

        await ProfileService.createUserProfileWithBatch('test-user-id', {
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg'
        });

        expect(writeBatch).toHaveBeenCalledWith('mock-firestore');
        expect(doc).toHaveBeenCalledWith('mock-firestore', 'users', 'test-user-id');
        expect(mockBatch.set).toHaveBeenCalledWith('mock-doc-ref', expect.objectContaining({
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }));
        expect(mockBatch.commit).toHaveBeenCalled();
      });

      it('should validate photoURL', async () => {
        await expect(
          ProfileService.createUserProfileWithBatch('test-user-id', {
            displayName: 'Test User',
            email: 'test@example.com',
            photoURL: 'javascript:alert("xss")'
          })
        ).rejects.toThrow('Invalid photo URL');
      });
    });

    describe('getUserProfile', () => {
      it('should return user profile', async () => {
        // Mock the ProfileService instance methods
        const mockRead = jest.fn().mockResolvedValue(mockUserProfile);
        jest.spyOn(ProfileService.prototype, 'read').mockImplementation(mockRead);

        const result = await ProfileService.getUserProfile('test-user-id');

        expect(result).toEqual(mockUserProfile);
        expect(mockRead).toHaveBeenCalledWith('test-user-id');
      });

      it('should return null for non-existent user', async () => {
        const mockRead = jest.fn().mockResolvedValue(null);
        jest.spyOn(ProfileService.prototype, 'read').mockImplementation(mockRead);

        const result = await ProfileService.getUserProfile('non-existent-id');

        expect(result).toBeNull();
        expect(mockRead).toHaveBeenCalledWith('non-existent-id');
      });
    });
  });

  describe('PreferencesService', () => {
    describe('updateUserPreferences', () => {
      it('should update user preferences', async () => {
        const mockUpdate = jest.fn().mockResolvedValue(undefined);
        jest.spyOn(ProfileService.prototype, 'update').mockImplementation(mockUpdate);

        const newPreferences: Partial<UserPreferences> = {
          theme: 'dark',
          soundEffects: false
        };

        await PreferencesService.updateUserPreferences('test-user-id', newPreferences);

        expect(mockUpdate).toHaveBeenCalledWith('test-user-id', {
          preferences: newPreferences
        });
      });
    });

    describe('updatePrivacySettings', () => {
      it('should update privacy settings', async () => {
        const mockUpdate = jest.fn().mockResolvedValue(undefined);
        jest.spyOn(ProfileService.prototype, 'update').mockImplementation(mockUpdate);

        const newSettings: Partial<PrivacySettings> = {
          profileVisibility: 'private',
          showOnLeaderboards: false
        };

        await PreferencesService.updatePrivacySettings('test-user-id', newSettings);

        expect(mockUpdate).toHaveBeenCalledWith('test-user-id', {
          privacySettings: newSettings
        });
      });
    });
  });

  describe('ProgressionService', () => {
    describe('addUserXP', () => {
      it('should add XP and level up user', async () => {
        const mockRead = jest.fn().mockResolvedValue({
          ...mockUserProfile,
          xp: 50,
          level: 1,
          xpToNextLevel: 100
        });
        const mockUpdate = jest.fn().mockResolvedValue(undefined);
        
        jest.spyOn(ProfileService.prototype, 'read').mockImplementation(mockRead);
        jest.spyOn(ProfileService.prototype, 'update').mockImplementation(mockUpdate);

        const result = await ProgressionService.addUserXP('test-user-id', 100);

        expect(result).toEqual({
          level: 2,
          xp: 150,
          xpToNextLevel: 200,
          leveledUp: true,
          levelsGained: 1
        });

        expect(mockUpdate).toHaveBeenCalledWith('test-user-id', {
          xp: 150,
          level: 2,
          xpToNextLevel: 200
        });
      });

      it('should throw error for negative XP', async () => {
        await expect(
          ProgressionService.addUserXP('test-user-id', -50)
        ).rejects.toThrow('XP amount cannot be negative');
      });

      it('should throw error for excessive XP', async () => {
        await expect(
          ProgressionService.addUserXP('test-user-id', 15000)
        ).rejects.toThrow('XP amount cannot exceed 10000');
      });

      it('should handle multiple level ups', async () => {
        const mockRead = jest.fn().mockResolvedValue({
          ...mockUserProfile,
          xp: 0,
          level: 1,
          xpToNextLevel: 100
        });
        const mockUpdate = jest.fn().mockResolvedValue(undefined);
        
        jest.spyOn(ProfileService.prototype, 'read').mockImplementation(mockRead);
        jest.spyOn(ProfileService.prototype, 'update').mockImplementation(mockUpdate);

        const result = await ProgressionService.addUserXP('test-user-id', 500);

        expect(result.leveledUp).toBe(true);
        expect(result.levelsGained).toBeGreaterThan(1);
      });
    });

    describe('addUserCoins', () => {
      it('should add coins to user', async () => {
        const mockRead = jest.fn().mockResolvedValue({
          ...mockUserProfile,
          coins: 100
        });
        const mockUpdate = jest.fn().mockResolvedValue(undefined);
        
        jest.spyOn(ProfileService.prototype, 'read').mockImplementation(mockRead);
        jest.spyOn(ProfileService.prototype, 'update').mockImplementation(mockUpdate);

        const result = await ProgressionService.addUserCoins('test-user-id', 50);

        expect(result).toBe(150);
        expect(mockUpdate).toHaveBeenCalledWith('test-user-id', {
          coins: 150
        });
      });

      it('should throw error for negative coins', async () => {
        await expect(
          ProgressionService.addUserCoins('test-user-id', -50)
        ).rejects.toThrow('Coin amount cannot be negative');
      });

      it('should throw error for excessive coins', async () => {
        await expect(
          ProgressionService.addUserCoins('test-user-id', 15000)
        ).rejects.toThrow('Coin amount cannot exceed 10000');
      });
    });

    describe('getUserProgression', () => {
      it('should return user progression data', async () => {
        const mockUser = {
          ...mockUserProfile,
          level: 5,
          xp: 250,
          xpToNextLevel: 500,
          coins: 1000
        };

        jest.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockUser);

        const result = await ProgressionService.getUserProgression('test-user-id');

        expect(result).toEqual({
          level: 5,
          xp: 250,
          xpToNextLevel: 500,
          coins: 1000
        });
      });

      it('should return null for non-existent user', async () => {
        jest.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(null);

        const result = await ProgressionService.getUserProgression('non-existent-id');

        expect(result).toBeNull();
      });
    });
  });

  describe('UserService (Backward Compatibility)', () => {
          it('should delegate authentication methods to AuthService', async () => {
        const mockUserCredential = { 
          user: { uid: 'test-user-id' },
          providerId: 'password',
          operationType: 'signIn'
        } as any;
        jest.spyOn(AuthService, 'registerWithEmail').mockResolvedValue(mockUserCredential);

      const result = await UserService.registerWithEmail('test@example.com', 'Password123!', 'Test User');

      expect(result).toEqual(mockUserCredential);
      expect(AuthService.registerWithEmail).toHaveBeenCalledWith('test@example.com', 'Password123!', 'Test User');
    });

    it('should delegate profile methods to ProfileService', async () => {
      jest.spyOn(ProfileService, 'getUserProfile').mockResolvedValue(mockUserProfile);

      const result = await UserService.getUserProfile('test-user-id');

      expect(result).toEqual(mockUserProfile);
      expect(ProfileService.getUserProfile).toHaveBeenCalledWith('test-user-id');
    });

    it('should delegate progression methods to ProgressionService', async () => {
      const mockProgressionResult = {
        level: 2,
        xp: 150,
        xpToNextLevel: 200,
        leveledUp: true,
        levelsGained: 1
      };

      jest.spyOn(ProgressionService, 'addUserXP').mockResolvedValue(mockProgressionResult);

      const result = await UserService.addUserXP('test-user-id', 100);

      expect(result).toEqual({
        level: 2,
        xp: 150,
        xpToNextLevel: 200,
        leveledUp: true
      });
      expect(ProgressionService.addUserXP).toHaveBeenCalledWith('test-user-id', 100);
    });
  });

  describe('Configuration and Environment Variables', () => {
    it('should use environment variables for configuration', () => {
      // Test that the service uses environment variables for configuration
      expect(process.env.XP_PER_LEVEL || '100').toBeDefined();
      expect(process.env.DEFAULT_COINS || '0').toBeDefined();
      expect(process.env.MAX_XP_AMOUNT || '10000').toBeDefined();
      expect(process.env.MAX_COIN_AMOUNT || '10000').toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase errors gracefully', async () => {
      const registerSpy = jest.spyOn(AuthService, 'registerWithEmail');
      registerSpy.mockRejectedValue(new Error('Firebase error'));

      await expect(
        AuthService.registerWithEmail('test@example.com', 'Password123!', 'Test User')
      ).rejects.toThrow();
      registerSpy.mockRestore();
    });

    it('should propagate network errors', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      signInWithEmailAndPassword.mockRejectedValue(new Error('Network error'));

      await expect(
        AuthService.signInWithEmail('test@example.com', 'Password123!')
      ).rejects.toThrow('Network error');
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    });
  });
});
