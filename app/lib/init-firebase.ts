/**
 * Firebase Initialization
 * 
 * This file is imported in the app entry point to ensure Firebase is initialized
 * before any components try to use it.
 */

import { 
  initializeFirebaseApp,
  initializeFirebaseAuth,
  initializeFirestore,
  initializeFirebaseStorage,
  initializeFirebaseFunctions
} from '@/app/lib/firebase';

// Initialize Firebase services
const app = initializeFirebaseApp();
const auth = initializeFirebaseAuth();
const db = initializeFirestore();
const storage = initializeFirebaseStorage();
const functions = initializeFirebaseFunctions();

console.log('Firebase services initialized');

// Export initialized services
export { app, auth, db, storage, functions };

/**
 * This function can be called to ensure Firebase is initialized
 * It's a no-op if Firebase is already initialized
 */
export function initializeFirebase(): void {
  // Services are already initialized when this module is imported
  // This function exists as a convenience for explicit initialization if needed
}

// Export a default function for dynamic imports
export default initializeFirebase; 