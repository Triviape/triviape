// Add any custom setup for Jest tests
import '@testing-library/jest-dom';

// Mock Firebase
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

// Mock Next.js
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Suppress console.error during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('useLayoutEffect does nothing on the server')) {
    return;
  }
  originalConsoleError(...args);
}; 