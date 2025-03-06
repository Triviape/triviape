import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth as getFirebaseAuth, 
  Auth, 
  initializeAuth, 
  indexedDBLocalPersistence,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore as getFirebaseFirestore, 
  Firestore,
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { 
  getStorage as getFirebaseStorage, 
  FirebaseStorage,
  connectStorageEmulator 
} from 'firebase/storage';
import {
  getAnalytics,
  Analytics,
  isSupported
} from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getFunctions as getFirebaseFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { shouldUseEmulators } from './emulatorUtils';
import { isClient } from './utils';
import { EMULATOR_HOSTS, getEmulatorUrl } from './emulatorConfig';

/**
 * Firebase configuration
 * These values should be replaced with your Firebase project configuration
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project-id.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project-id.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF1234'
};

// Prevent multiple initializations in development with React strict mode
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;
let performanceInstance: any | null = null;
let functionsInstance: Functions | null = null;
let isInitialized = false;

// For emulator mode, we can use a simplified configuration
const emulatorModeConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project-id.firebaseapp.com',
  projectId: 'demo-project-id',
  storageBucket: 'demo-project-id.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890'
};

/**
 * Initialize Firebase services
 */
function initializeFirebaseServices(): void {
  if (isInitialized) {
    return;
  }
  
  try {
    // Initialize Firebase app if it hasn't been initialized already
    if (!app) {
      if (getApps().length === 0) {
        // Use emulator config if in emulator mode
        const configToUse = shouldUseEmulators() ? emulatorModeConfig : firebaseConfig;
        app = initializeApp(configToUse);
        console.log('Firebase app initialized', shouldUseEmulators() ? '(emulator mode)' : '');
      } else {
        app = getApps()[0];
      }
    }
    
    // Initialize Auth with persistence
    if (!authInstance) {
      try {
        if (typeof window !== 'undefined' && typeof indexedDBLocalPersistence !== 'undefined') {
          // Use initializeAuth with persistence for client-side
          authInstance = initializeAuth(app, {
            persistence: indexedDBLocalPersistence
          });
        } else {
          // Fallback to standard auth initialization
          authInstance = getFirebaseAuth(app);
        }
        console.log('Firebase Auth initialized');
      } catch (authError) {
        console.error('Error initializing Auth with persistence, falling back to standard Auth:', authError);
        authInstance = getFirebaseAuth(app);
      }
    }
    
    // Initialize Firestore with settings
    if (!firestoreInstance) {
      try {
        // Use initializeFirestore with settings for better performance
        firestoreInstance = initializeFirestore(app, {
          // Only use the newer cache API for persistence
          localCache: typeof window !== 'undefined' 
            ? persistentLocalCache({ 
                tabManager: persistentMultipleTabManager(),
                // Set cache size to unlimited within the cache config
                cacheSizeBytes: CACHE_SIZE_UNLIMITED 
              }) 
            : undefined
        });
        
        console.log('Firestore initialized with custom settings');
      } catch (firestoreError) {
        console.error('Error initializing Firestore with settings, falling back to standard Firestore:', firestoreError);
        firestoreInstance = getFirebaseFirestore(app);
      }
    }
    
    // Initialize Storage
    if (!storageInstance) {
      storageInstance = getFirebaseStorage(app);
      console.log('Firebase Storage initialized');
    }
    
    // Initialize Functions
    if (!functionsInstance) {
      functionsInstance = getFirebaseFunctions(app);
      console.log('Firebase Functions initialized');
    }
    
    // Initialize Analytics only in browser environment and not in emulator mode
    if (!analyticsInstance && typeof window !== 'undefined' && !shouldUseEmulators()) {
      // Check if analytics is likely to be blocked by ad blockers or privacy extensions
      const isLikelyBlocked = 
        (navigator.doNotTrack === '1') || 
        localStorage.getItem('analytics-opt-out') === 'true';
      
      if (isLikelyBlocked) {
        console.log('Analytics likely blocked by browser settings or extensions - skipping initialization');
      } else {
        isSupported()
          .then((supported) => {
            if (supported && app) {
              try {
                analyticsInstance = getAnalytics(app);
                console.log('Firebase Analytics initialized');
              } catch (analyticsError) {
                console.warn('Firebase Analytics initialization failed, possibly blocked by an extension:', analyticsError);
              }
            } else {
              console.log('Firebase Analytics is not supported in this environment');
            }
          })
          .catch((error) => {
            console.warn('Error checking Analytics support, possibly blocked by an extension:', error);
          });
      }
    }
    
    // Initialize Performance only in browser environment and not in emulator mode
    if (!performanceInstance && typeof window !== 'undefined' && app && !shouldUseEmulators()) {
      try {
        performanceInstance = getPerformance(app);
        console.log('Firebase Performance initialized');
      } catch (perfError) {
        console.warn('Firebase Performance initialization failed:', perfError);
      }
    }
    
    // Connect to emulators if in development
    if (shouldUseEmulators()) {
      connectToEmulators();
    }
    
    isInitialized = true;
    console.log('All Firebase services initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase services:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error({
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }
}

/**
 * Connect to local emulators for development
 */
function connectToEmulators(): void {
  console.log('Attempting to connect to Firebase emulators...');
  
  // Read emulator hosts from environment variables or use defaults from shared config
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || EMULATOR_HOSTS.auth;
  const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST || EMULATOR_HOSTS.firestore;
  const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || EMULATOR_HOSTS.storage;
  const functionsEmulatorHost = process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST || EMULATOR_HOSTS.functions;
  
  if (authInstance) {
    try {
      console.log(`🔥 Connecting to Auth emulator at: ${authEmulatorHost}`);
      const [host, portStr] = authEmulatorHost.split(':');
      const port = parseInt(portStr, 10);
      connectAuthEmulator(authInstance, `http://${host}:${port}`, { disableWarnings: false });
      console.log('✅ Connected to Auth emulator successfully');
    } catch (error) {
      // Emulator might already be connected
      console.warn('Auth emulator connection issue:', error);
    }
  } else {
    console.warn('Auth instance not available, skipping emulator connection');
  }
  
  if (firestoreInstance) {
    try {
      // Check if we can safely connect to the emulator
      // We'll wrap this in a try-catch to handle any errors
      console.log(`🔥 Connecting to Firestore emulator at: ${firestoreEmulatorHost}`);
      const [host, portStr] = firestoreEmulatorHost.split(':');
      const port = parseInt(portStr, 10);
      
      try {
        connectFirestoreEmulator(firestoreInstance, host, port);
        console.log('✅ Connected to Firestore emulator successfully');
      } catch (connectionError) {
        // If we get an error about Firestore already being started, that's okay
        // It means we're already connected or the settings are frozen
        console.warn('Firestore emulator connection issue:', connectionError);
        // Don't rethrow, just log it
      }
    } catch (error) {
      // Catch any other errors in the outer try block
      console.warn('Firestore emulator setup issue:', error);
    }
  } else {
    console.warn('Firestore instance not available, skipping emulator connection');
  }
  
  if (storageInstance) {
    try {
      console.log(`🔥 Connecting to Storage emulator at: ${storageEmulatorHost}`);
      const [host, portStr] = storageEmulatorHost.split(':');
      const port = parseInt(portStr, 10);
      connectStorageEmulator(storageInstance, host, port);
      console.log('✅ Connected to Storage emulator successfully');
    } catch (error) {
      // Emulator might already be connected
      console.warn('Storage emulator connection issue:', error);
    }
  } else {
    console.warn('Storage instance not available, skipping emulator connection');
  }
  
  if (functionsInstance) {
    try {
      console.log(`🔥 Connecting to Functions emulator at: ${functionsEmulatorHost}`);
      const [host, portStr] = functionsEmulatorHost.split(':');
      const port = parseInt(portStr, 10);
      connectFunctionsEmulator(functionsInstance, host, port);
      console.log('✅ Connected to Functions emulator successfully');
    } catch (error) {
      // Emulator might already be connected
      console.warn('Functions emulator connection issue:', error);
    }
  } else {
    console.warn('Functions instance not available, skipping emulator connection');
  }
  
  console.log('🔥 Firebase emulator connections complete');
}

// Initialize Firebase only on the client side
if (isClient()) {
  initializeFirebaseServices();
}

/**
 * Get the Firebase Auth instance
 */
export function getAuth(): Auth {
  if (!authInstance) {
    initializeFirebaseServices();
  }
  return authInstance!;
}

/**
 * Get the Firebase Auth instance (alias for getAuth for backward compatibility)
 */
export function getAuthInstance(): Auth {
  return getAuth();
}

/**
 * Get the Firestore instance
 */
export function getFirestore(): Firestore {
  if (!firestoreInstance) {
    initializeFirebaseServices();
  }
  return firestoreInstance!;
}

/**
 * Get the Firestore instance (alias for getFirestore for backward compatibility)
 */
export function getFirestoreDb(): Firestore {
  return getFirestore();
}

/**
 * Get the Firebase Storage instance
 */
export function getStorage(): FirebaseStorage {
  if (!storageInstance) {
    initializeFirebaseServices();
  }
  return storageInstance!;
}

/**
 * Get the Firebase Storage instance (alias for getStorage for backward compatibility)
 */
export function getStorageInstance(): FirebaseStorage {
  return getStorage();
}

/**
 * Get the Firebase Functions instance
 */
export function getFunctions(): Functions {
  if (!functionsInstance) {
    initializeFirebaseServices();
  }
  return functionsInstance!;
}

/**
 * Get the Firebase Functions instance (alias for getFunctions for backward compatibility)
 */
export function getFunctionsInstance(): Functions {
  return getFunctions();
}

/**
 * Get the Firebase Analytics instance
 * May return null if analytics is not supported in the current environment
 */
export function getAnalyticsInstance(): Analytics | null {
  return analyticsInstance;
}

/**
 * Get the Firebase Performance instance
 * May return null if performance monitoring is not supported in the current environment
 */
export function getPerformanceInstance(): any | null {
  return performanceInstance;
}

/**
 * Check if Firebase has been initialized
 */
export function isFirebaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Manually initialize Firebase
 * This is useful for server-side rendering or when you need to ensure Firebase is initialized
 */
export function initializeFirebase(): void {
  initializeFirebaseServices();
}

/**
 * Get the Firebase app instance
 * @returns The Firebase app instance
 */
export function getApp(): FirebaseApp {
  if (!app) {
    initializeFirebaseServices();
  }
  
  if (!app) {
    throw new Error('Firebase app not initialized');
  }
  
  return app;
}

// Create a service object with all the Firebase service getter methods
const firebaseService = {
  getApp,
  getAuth,
  getFirestore,
  getStorage,
  getFunctions,
  getAnalytics: getAnalyticsInstance,
  getPerformance: getPerformanceInstance,
  isInitialized: isFirebaseInitialized,
  initialize: initializeFirebase
};

// Export the Firebase instances for direct access
export const auth = authInstance;
export const db = firestoreInstance;
export const storage = storageInstance;
export const analytics = analyticsInstance;
export const performance = performanceInstance;
export const functions = functionsInstance;

// Export the Firebase app instance
export { app };

// Export the service as default
export default firebaseService;