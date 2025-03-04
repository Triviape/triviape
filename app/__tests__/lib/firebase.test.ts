import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  connectAuthEmulator 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Import the actual module to test
import firebaseService, {
  app,
  auth,
  db,
  storage,
  analytics,
  performance,
  functions
} from '@/app/lib/firebase';

// Mock the environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-domain.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'test-measurement-id';

// We need to mock window for tests
Object.defineProperty(global, 'window', {
  value: {
    // Add any window properties needed
  },
});

// Force the mocks to be called
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn().mockReturnValue({
      name: 'testApp',
    }),
    getApps: jest.fn().mockReturnValue([]),
  };
});

jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn().mockReturnValue({
      currentUser: null,
    }),
    initializeAuth: jest.fn().mockReturnValue({
      currentUser: null,
    }),
    indexedDBLocalPersistence: 'indexedDBLocalPersistence',
    connectAuthEmulator: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn().mockReturnValue({}),
    initializeFirestore: jest.fn().mockReturnValue({}),
    connectFirestoreEmulator: jest.fn(),
    enableMultiTabIndexedDbPersistence: jest.fn().mockResolvedValue({}),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    limit: jest.fn(),
    CACHE_SIZE_UNLIMITED: 'CACHE_SIZE_UNLIMITED',
  };
});

jest.mock('firebase/storage', () => {
  return {
    getStorage: jest.fn().mockReturnValue({}),
    connectStorageEmulator: jest.fn(),
  };
});

jest.mock('firebase/analytics', () => {
  return {
    getAnalytics: jest.fn().mockReturnValue({}),
    isSupported: jest.fn().mockResolvedValue(true),
  };
});

jest.mock('firebase/performance', () => {
  return {
    getPerformance: jest.fn().mockReturnValue({}),
  };
});

jest.mock('firebase/functions', () => {
  return {
    getFunctions: jest.fn().mockReturnValue({}),
    connectFunctionsEmulator: jest.fn(),
  };
});

describe('Firebase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a singleton instance', () => {
    expect(firebaseService).toBeDefined();
  });

  it('should export Firebase instances', () => {
    expect(app).toBeDefined();
    expect(auth).toBeDefined();
    expect(db).toBeDefined();
    expect(storage).toBeDefined();
    expect(functions).toBeDefined();
  });
  
  it('should provide methods to access Firebase services', () => {
    expect(typeof firebaseService.getApp).toBe('function');
    expect(typeof firebaseService.getAuth).toBe('function');
    expect(typeof firebaseService.getFirestore).toBe('function');
    expect(typeof firebaseService.getStorage).toBe('function');
    expect(typeof firebaseService.getFunctions).toBe('function');
    expect(typeof firebaseService.getAnalytics).toBe('function');
    expect(typeof firebaseService.getPerformance).toBe('function');
  });
}); 