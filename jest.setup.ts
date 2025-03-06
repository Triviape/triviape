import '@testing-library/jest-dom';
import { setupTestEnvironment, teardownTestEnvironment } from './app/__tests__/utils/test-setup';

// Set a longer timeout for tests that need to interact with emulators
jest.setTimeout(30000);

// Mock fetch API
global.fetch = jest.fn() as jest.Mock;

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args: any[]) => {
  // Filter out expected errors during tests
  const errorMessage = args.join(' ');
  if (
    errorMessage.includes('Warning: ReactDOM.render is no longer supported') ||
    errorMessage.includes('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  // Filter out expected warnings during tests
  const warnMessage = args.join(' ');
  if (
    warnMessage.includes('Warning: ReactDOM.render is no longer supported') ||
    warnMessage.includes('Warning: useLayoutEffect does nothing on the server')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Reduce console noise during tests
console.log = (...args: any[]) => {
  // Filter out verbose logs during tests
  const logMessage = args.join(' ');
  if (
    logMessage.includes('Firebase') ||
    logMessage.includes('Emulator')
  ) {
    return;
  }
  originalConsoleLog(...args);
};

// Set up global beforeAll and afterAll hooks
beforeAll(async () => {
  // Only set up emulators for integration tests
  const isIntegrationTest = process.env.TEST_TYPE === 'integration';
  
  if (isIntegrationTest) {
    await setupTestEnvironment({
      startEmulators: true,
      cleanupBeforeTests: true
    });
  } else {
    // For unit tests, just set the environment variables
    // NODE_ENV is read-only, so we don't modify it
    process.env.USE_FIREBASE_EMULATOR = 'true';
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
  }
});

afterAll(async () => {
  // Clean up resources after tests
  const isIntegrationTest = process.env.TEST_TYPE === 'integration';
  
  if (isIntegrationTest) {
    await teardownTestEnvironment();
  }
  
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Add any custom setup for Jest tests
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn().mockReturnValue({
      name: 'testApp',
    }),
    getApps: jest.fn().mockReturnValue([]),
    FirebaseError: class FirebaseError extends Error {
      code: string;
      customData?: Record<string, any>;

      constructor(code: string, message: string, customData?: Record<string, any>) {
        super(message);
        this.code = code;
        this.customData = customData;
        this.name = 'FirebaseError';
        Object.setPrototypeOf(this, FirebaseError.prototype);
      }
    }
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

// Mock Next.js
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
})); 