import {
  initTestFirebase,
  createTestUser,
  signInTestUser,
  signOutTestUser,
  generateTestEmail,
  createMockFirebaseUser
} from './firebase-test-utils';
import { User } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  
  return {
    ...originalModule,
    getAuth: jest.fn(() => ({
      currentUser: null,
      onAuthStateChanged: jest.fn(() => jest.fn()),
    })),
    connectAuthEmulator: jest.fn(),
    signInWithEmailAndPassword: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          emailVerified: false,
          getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
        },
      });
    }),
    createUserWithEmailAndPassword: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        user: {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: null,
          emailVerified: false,
          getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
        },
      });
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };
});

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    // Mock Firestore instance
    collection: jest.fn(),
    doc: jest.fn(),
  })),
  connectFirestoreEmulator: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({
    // Mock Storage instance
    ref: jest.fn(),
    uploadBytes: jest.fn(),
  })),
  connectStorageEmulator: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  FirebaseError: class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

// Mock emulator utils
jest.mock('../../lib/emulatorUtils', () => ({
  shouldUseEmulators: jest.fn(() => true),
  areEmulatorsAvailable: jest.fn(() => Promise.resolve(true)),
}));

describe('Firebase Test Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initTestFirebase', () => {
    it('should initialize Firebase for testing', () => {
      const { auth, firestore, storage } = initTestFirebase();
      
      expect(auth).toBeDefined();
      expect(firestore).toBeDefined();
      expect(storage).toBeDefined();
    });
  });

  describe('createTestUser', () => {
    it('should create a test user', async () => {
      const user = await createTestUser('test@example.com', 'password123', 'Test User');
      
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('signInTestUser', () => {
    it('should sign in a test user', async () => {
      const user = await signInTestUser('test@example.com', 'password123');
      
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('signOutTestUser', () => {
    it('should sign out the current user', async () => {
      await signOutTestUser();
      // Just verify it doesn't throw an error
    });
  });

  describe('generateTestEmail', () => {
    it('should generate a unique test email', () => {
      const email = generateTestEmail();
      
      expect(email).toContain('@example.com');
      expect(email).toContain('test-');
    });
  });

  describe('createMockFirebaseUser', () => {
    it('should create a mock Firebase user', () => {
      const user = createMockFirebaseUser({ displayName: 'Custom Name' });
      
      expect(user).toBeDefined();
      expect(user.displayName).toBe('Custom Name');
      expect(user.uid).toBeDefined();
      expect(user.email).toBeDefined();
    });
  });
}); 