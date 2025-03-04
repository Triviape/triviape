import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  initializeAuth, 
  indexedDBLocalPersistence,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage,
  connectStorageEmulator 
} from 'firebase/storage';
import {
  getAnalytics,
  Analytics,
  isSupported
} from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';

/**
 * Firebase configuration
 * These values should be replaced with your Firebase project configuration
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

/**
 * Class to manage Firebase services with initialization optimization
 */
class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp | null = null;
  private authInstance: Auth | null = null;
  private firestoreInstance: Firestore | null = null;
  private storageInstance: FirebaseStorage | null = null;
  private analyticsInstance: Analytics | null = null;
  private performanceInstance: any | null = null;
  private functionsInstance: Functions | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase services
   */
  public initialize(): void {
    if (this.isInitialized) return;

    try {
      // Initialize Firebase app
      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }

      // Initialize Firestore with performance optimizations
      this.firestoreInstance = initializeFirestore(this.app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      });

      // Enable offline persistence for Firestore
      if (typeof window !== 'undefined') {
        enableMultiTabIndexedDbPersistence(this.firestoreInstance).catch(err => {
          console.error('Failed to enable offline persistence:', err);
        });
      }

      // Initialize Auth with persistence
      if (typeof window !== 'undefined') {
        this.authInstance = initializeAuth(this.app, {
          persistence: indexedDBLocalPersistence
        });
      } else {
        this.authInstance = getAuth(this.app);
      }

      // Initialize Storage
      this.storageInstance = getStorage(this.app);

      // Initialize Functions
      this.functionsInstance = getFunctions(this.app);

      // Initialize Analytics and Performance in client-side only
      if (typeof window !== 'undefined') {
        isSupported().then(supported => {
          if (supported && this.app) {
            this.analyticsInstance = getAnalytics(this.app);
          }
        });
        if (this.app) {
          this.performanceInstance = getPerformance(this.app);
        }
      }

      // Connect to emulators if in development mode
      if (process.env.NODE_ENV === 'development') {
        this.connectToEmulators();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  /**
   * Connect to local emulators for development
   */
  private connectToEmulators(): void {
    if (this.authInstance) {
      connectAuthEmulator(this.authInstance, 'http://localhost:9099');
    }
    
    if (this.firestoreInstance) {
      connectFirestoreEmulator(this.firestoreInstance, 'localhost', 8080);
    }
    
    if (this.storageInstance) {
      connectStorageEmulator(this.storageInstance, 'localhost', 9199);
    }
    
    if (this.functionsInstance) {
      connectFunctionsEmulator(this.functionsInstance, 'localhost', 5001);
    }
  }

  /**
   * Get the Firebase app instance
   */
  public getApp(): FirebaseApp {
    if (!this.app) {
      this.initialize();
    }
    return this.app!;
  }

  /**
   * Get the Auth instance
   */
  public getAuth(): Auth {
    if (!this.authInstance) {
      this.initialize();
    }
    return this.authInstance!;
  }

  /**
   * Get the Firestore instance
   */
  public getFirestore(): Firestore {
    if (!this.firestoreInstance) {
      this.initialize();
    }
    return this.firestoreInstance!;
  }

  /**
   * Get the Storage instance
   */
  public getStorage(): FirebaseStorage {
    if (!this.storageInstance) {
      this.initialize();
    }
    return this.storageInstance!;
  }

  /**
   * Get the Analytics instance (may be null if not supported)
   */
  public getAnalytics(): Analytics | null {
    return this.analyticsInstance;
  }

  /**
   * Get the Performance instance
   */
  public getPerformance(): any | null {
    return this.performanceInstance;
  }

  /**
   * Get the Functions instance
   */
  public getFunctions(): Functions {
    if (!this.functionsInstance) {
      this.initialize();
    }
    return this.functionsInstance!;
  }
}

// Create and initialize the Firebase service
const firebaseService = FirebaseService.getInstance();
firebaseService.initialize();

// Export the service and individual instances for convenience
export const app = firebaseService.getApp();
export const auth = firebaseService.getAuth();
export const db = firebaseService.getFirestore();
export const storage = firebaseService.getStorage();
export const analytics = firebaseService.getAnalytics();
export const performance = firebaseService.getPerformance();
export const functions = firebaseService.getFunctions();

// Export the service itself for advanced usage
export default firebaseService; 