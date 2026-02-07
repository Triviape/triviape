import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore as getFirebaseFirestore, 
  type Firestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getStorage as getFirebaseStorage, 
  type FirebaseStorage,
  connectStorageEmulator
} from 'firebase/storage';
import { 
  getFunctions as getFirebaseFunctions, 
  type Functions,
  connectFunctionsEmulator
} from 'firebase/functions';
import {
  getDatabase,
  connectDatabaseEmulator,
  type Database
} from 'firebase/database';
import {
  getAnalytics,
  isSupported,
  type Analytics
} from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

type Performance = ReturnType<typeof getPerformance>;

/**
 * Firebase configuration object
 * Values are loaded from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we should use Firebase emulators
const shouldUseEmulators = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
};

// Initialize Firebase only once
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firestoreDb: Firestore | undefined;
let firebaseStorage: FirebaseStorage | undefined;
let firebaseFunctions: Functions | undefined;
let firebaseRealtimeDb: Database | undefined;
let firebaseAnalytics: Analytics | null = null;
let analyticsSupported = false;

/**
 * Initialize Firebase app instance
 * @returns Initialized Firebase app
 */
export function initializeFirebaseApp(): FirebaseApp {
  if (!firebaseApp && getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  }
  return firebaseApp || getApps()[0];
}

/**
 * Get Firebase Auth instance
 * @returns Firebase Auth instance
 */
export function initializeFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(initializeFirebaseApp());
    if (shouldUseEmulators()) {
      try {
        connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
        console.log('Connected to Auth emulator');
      } catch (error) {
        console.warn('Could not connect to Auth emulator:', error);
      }
    }
  }
  return firebaseAuth;
}

/**
 * Get Firebase Firestore instance
 * @returns Firebase Firestore instance
 */
export function initializeFirestore(): Firestore {
  if (!firestoreDb) {
    firestoreDb = getFirebaseFirestore(initializeFirebaseApp());
    if (shouldUseEmulators()) {
        try {
            connectFirestoreEmulator(firestoreDb, 'localhost', 8080);
            console.log('Connected to Firestore emulator');
        } catch (error) {
            console.warn('Could not connect to Firestore emulator:', error);
        }
    }
  }
  return firestoreDb;
}

/**
 * Get Firebase Storage instance
 * @returns Firebase Storage instance
 */
export function initializeFirebaseStorage(): FirebaseStorage {
  if (!firebaseStorage) {
    firebaseStorage = getFirebaseStorage(initializeFirebaseApp());
    if (shouldUseEmulators()) {
        try {
            connectStorageEmulator(firebaseStorage, 'localhost', 9199);
            console.log('Connected to Storage emulator');
        } catch (error) {
            console.warn('Could not connect to Storage emulator:', error);
        }
    }
  }
  return firebaseStorage;
}

/**
 * Get Firebase Functions instance
 * @returns Firebase Functions instance
 */
export function initializeFirebaseFunctions(): Functions {
  if (!firebaseFunctions) {
    firebaseFunctions = getFirebaseFunctions(initializeFirebaseApp());
    if (shouldUseEmulators()) {
        try {
            connectFunctionsEmulator(firebaseFunctions, 'localhost', 5001);
            console.log('Connected to Functions emulator');
        } catch (error) {
            console.warn('Could not connect to Functions emulator:', error);
        }
    }
  }
  return firebaseFunctions;
}

/**
 * Get Firebase Realtime Database instance
 * @returns Firebase Realtime Database instance
 */
export function initializeRealtimeDatabase(): Database {
  if (!firebaseRealtimeDb) {
    firebaseRealtimeDb = getDatabase(initializeFirebaseApp());
    
    // Connect to emulator if in development
    if (shouldUseEmulators()) {
      try {
        connectDatabaseEmulator(firebaseRealtimeDb, 'localhost', 9000);
        console.log('Connected to Realtime Database emulator');
      } catch (error) {
        console.warn('Could not connect to Realtime Database emulator:', error);
      }
    }
  }
  return firebaseRealtimeDb;
}

/**
 * Get Firebase Analytics instance (client-side only)
 * @returns Firebase Analytics instance or null if not supported
 */
export const initializeFirebaseAnalytics = async (): Promise<Analytics | null> => {
  // Only run in browser environment
  if (typeof window === 'undefined') return null;
  
  // Skip analytics in emulator mode
  if (shouldUseEmulators()) return null;
  
  // If already initialized, return the instance
  if (firebaseAnalytics) return firebaseAnalytics;
  
  try {
    // Check if analytics is supported
    analyticsSupported = await isSupported();
    
    if (analyticsSupported) {
      const app = initializeFirebaseApp();
      firebaseAnalytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
      return firebaseAnalytics;
    } else {
      console.log('Firebase Analytics is not supported in this environment');
      return null;
    }
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
    return null;
  }
};

/**
 * Initialize Firebase Performance Monitoring (client-side only)
 * @returns Firebase Performance instance or null if not supported
 */
export const initializePerformance = (): Performance | null => {
  // Only run in browser environment
  if (typeof window === 'undefined') return null;
  
  // Skip performance monitoring in emulator mode
  if (shouldUseEmulators()) return null;
  
  try {
    const app = initializeFirebaseApp();
    const performance = getPerformance(app);
    console.log('Firebase Performance initialized successfully');
    return performance;
  } catch (error) {
    console.error('Error initializing Firebase Performance:', error);
    return null;
  }
};

// Initialize Firebase on the client side
if (typeof window !== 'undefined') {
  initializeFirebaseApp();
}

// Export initialized instances
export const app = initializeFirebaseApp();
export const auth = initializeFirebaseAuth();
export const db = initializeFirestore();
export const storage = initializeFirebaseStorage();
export const functions = initializeFirebaseFunctions();
export const realtimeDb = initializeRealtimeDatabase();
export const analytics = firebaseAnalytics;
export const performance = initializePerformance();

// Re-export Firebase auth methods for convenience
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
};

// Re-export Firebase helper functions
export const getAuthInstance = () => auth;
export const getFirestoreDb = () => db;
export const getRealtimeDb = () => realtimeDb;
export const getPerformanceInstance = () => initializePerformance();
export const getStorageInstance = () => storage;
export const getFunctionsInstance = () => functions;
export const getApp = () => app;

export default {
  app,
  auth,
  db,
  storage,
  functions,
  realtimeDb,
  analytics,
  performance,
  getApp,
  getAuth: getAuthInstance,
  getFirestore: getFirestoreDb,
  getStorage: getStorageInstance,
  getFunctions: getFunctionsInstance,
  getAnalytics: initializeFirebaseAnalytics,
  getPerformance: getPerformanceInstance,
};
