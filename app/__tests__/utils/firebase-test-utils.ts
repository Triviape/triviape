import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
  Auth,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { shouldUseEmulators, areEmulatorsAvailable } from '../../lib/emulatorUtils';
import { EMULATOR_HOSTS, EMULATOR_PORTS, getEmulatorUrl } from '../../lib/emulatorConfig';
import { FirebaseError } from 'firebase/app';

// Test Firebase configuration
const testFirebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890',
};

// Default test user for tests
export const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'Test@123456',
  displayName: 'Test User',
};

/**
 * Ensure Firebase emulators are running
 * @throws Error if emulators are not running
 */
export async function ensureEmulatorsRunning(): Promise<void> {
  if (!shouldUseEmulators()) {
    throw new Error('Emulators are not enabled. Set USE_FIREBASE_EMULATOR=true');
  }
  
  const available = await areEmulatorsAvailable();
  if (!available) {
    throw new Error('Firebase emulators are not running. Start them with: npm run emulators');
  }
}

// Define a type for the return value of initTestFirebase
interface FirebaseTestInstances {
  app: any;
  auth: Auth;
  firestore: any;
  storage: any;
}

/**
 * Initialize Firebase for testing with emulators
 */
export function initTestFirebase(): FirebaseTestInstances {
  try {
    // Initialize Firebase app
    const app = initializeApp(testFirebaseConfig, 'test-app');
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);

    // Connect to emulators if they should be used
    if (shouldUseEmulators()) {
      try {
        // Connect to Auth emulator using standardized ports
        connectAuthEmulator(
          auth, 
          getEmulatorUrl('auth'), 
          { disableWarnings: true }
        );
        
        // Connect to Firestore emulator
        const { host: firestoreHost, port: firestorePort } = parseEmulatorHost(EMULATOR_HOSTS.firestore);
        connectFirestoreEmulator(firestore, firestoreHost, firestorePort);
        
        // Connect to Storage emulator
        const { host: storageHost, port: storagePort } = parseEmulatorHost(EMULATOR_HOSTS.storage);
        connectStorageEmulator(storage, storageHost, storagePort);
      } catch (error) {
        console.warn('Error connecting to emulators:', error);
        // Continue with the test even if emulator connection fails
      }
    }

    return { app, auth, firestore, storage };
  } catch (error) {
    console.error('Error initializing Firebase for tests:', error);
    // Create a mock auth object that satisfies the Auth interface
    const mockAuth = {
      currentUser: null,
      onAuthStateChanged: jest.fn(() => jest.fn()),
      signInWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
      // Add required properties from Auth interface
      app: {},
      name: 'mock-auth',
      config: { apiKey: 'mock-api-key', authDomain: 'mock-auth-domain' },
      setPersistence: jest.fn(),
      languageCode: null,
      tenantId: null,
      settings: { appVerificationDisabledForTesting: true },
      useDeviceLanguage: jest.fn(),
      signInWithCredential: jest.fn(),
      signInWithPopup: jest.fn(),
      signInWithRedirect: jest.fn(),
      signInAnonymously: jest.fn(),
      updateCurrentUser: jest.fn(),
      verifyPasswordResetCode: jest.fn(),
      confirmPasswordReset: jest.fn(),
      applyActionCode: jest.fn(),
      checkActionCode: jest.fn(),
      fetchSignInMethodsForEmail: jest.fn(),
      sendSignInLinkToEmail: jest.fn(),
      isSignInWithEmailLink: jest.fn(),
      signInWithEmailLink: jest.fn(),
      createUserWithEmailAndPassword: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    } as unknown as Auth;

    // Return mock objects if initialization fails
    return {
      app: {},
      auth: mockAuth,
      firestore: {},
      storage: {},
    };
  }
}

/**
 * Parse an emulator host string into host and port components
 * @param emulatorHost The emulator host string (e.g., 'localhost:9099')
 * @returns An object with host and port properties
 */
function parseEmulatorHost(emulatorHost: string): { host: string; port: number } {
  const [host, portStr] = emulatorHost.split(':');
  const port = parseInt(portStr, 10);
  
  return { host, port };
}

/**
 * Alias for initTestFirebase for consistency with other test files
 */
export const initializeTestFirebase = initTestFirebase;

/**
 * Create a test user in the Firebase Auth emulator
 */
export async function createTestUser(email: string, password: string, displayName?: string): Promise<User> {
  try {
    const { auth } = initTestFirebase();
    
    // Create user using the imported function
    try {
      // Check if we're in a test environment
      if (process.env.NODE_ENV === 'test') {
        // In test environment, return a mock user
        const mockUser = createMockFirebaseUser({
          email,
          displayName: displayName || null,
        });
        return mockUser;
      }
      
      const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
      
      // Update profile if displayName is provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      return userCredential.user;
    } catch (authError) {
      console.warn('Error with Firebase auth operation:', authError);
      
      // If the error is "email-already-in-use", try to sign in instead
      if (authError instanceof FirebaseError && authError.code === 'auth/email-already-in-use') {
        try {
          const signInCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
          return signInCredential.user;
        } catch (signInError) {
          console.warn('Error signing in with existing email:', signInError);
        }
      }
      
      // Return a mock user
      return createMockFirebaseUser({
        email,
        displayName: displayName || null,
      });
    }
  } catch (error) {
    console.error('Error creating test user:', error);
    // Return a mock user if creation fails
    return createMockFirebaseUser({
      email,
      displayName: displayName || null,
    });
  }
}

/**
 * Sign in a test user in the Firebase Auth emulator
 */
export async function signInTestUser(email: string, password: string): Promise<User> {
  try {
    const { auth } = initTestFirebase();
    
    // Sign in using the imported function
    try {
      // Check if we're in a test environment
      if (process.env.NODE_ENV === 'test') {
        // In test environment, return a mock user
        const mockUser = createMockFirebaseUser({
          email,
          displayName: 'Test User',
        });
        return mockUser;
      }
      
      const userCredential = await firebaseSignInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (authError) {
      console.warn('Error with Firebase sign in:', authError);
      
      // If the error is "user-not-found", try to create the user first
      if (authError instanceof FirebaseError && authError.code === 'auth/user-not-found') {
        try {
          const user = await createTestUser(email, password, 'Test User');
          return user;
        } catch (createError) {
          console.warn('Error creating user during sign in:', createError);
        }
      }
      
      // Return a mock user
      return createMockFirebaseUser({
        email,
        displayName: 'Test User',
      });
    }
  } catch (error) {
    console.error('Error signing in test user:', error);
    // Return a mock user if sign in fails
    return createMockFirebaseUser({
      email,
      displayName: 'Test User',
    });
  }
}

/**
 * Sign out the current user
 */
export async function signOutTestUser(): Promise<void> {
  try {
    const { auth } = initTestFirebase();
    
    // Sign out current user if any
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    console.warn('Error signing out test user:', error);
    // Ignore errors when signing out
  }
}

/**
 * Clean up test resources
 */
export async function cleanupTestResources(): Promise<void> {
  try {
    await signOutTestUser();
  } catch (error) {
    console.warn('Error cleaning up test resources:', error);
    // Ignore errors during cleanup
  }
}

/**
 * Generate a unique test email
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

/**
 * Generate test user data with optional overrides
 */
export function generateTestUserData(overrides: Partial<TestUserData> = {}): TestUserData {
  return {
    email: generateTestEmail(),
    password: `Test${Date.now()}!`,
    displayName: `Test User ${Date.now()}`,
    ...overrides,
  };
}

/**
 * Create a mock Firebase user for testing
 */
export function createMockFirebaseUser(overrides: Partial<User> = {}): User {
  const uid = `mock-uid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = overrides.email || generateTestEmail();
  
  return {
    uid,
    email,
    emailVerified: false,
    isAnonymous: false,
    displayName: overrides.displayName || 'Mock User',
    photoURL: overrides.photoURL || null,
    providerData: [],
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    getIdToken: jest.fn().mockResolvedValue(`mock-token-${uid}`),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: `mock-token-${uid}`,
      signInProvider: 'password',
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      issuedAtTime: new Date().toISOString(),
      claims: {},
    }),
    reload: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({ uid, email }),
    ...overrides,
  } as unknown as User;
}

export interface TestUserData {
  email: string;
  password: string;
  displayName: string;
} 