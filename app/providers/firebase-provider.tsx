'use client';

import { useEffect, useState, ReactNode } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

interface FirebaseProviderProps {
  children: ReactNode;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const shouldUseEmulators = () => process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

/**
 * Firebase Provider
 * 
 * This component initializes Firebase when the app starts
 * and provides Firebase services to all child components.
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Only initialize if no Firebase apps exist
        if (getApps().length === 0) {
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const firestore = getFirestore(app);
          const storage = getStorage(app);
          const functions = getFunctions(app);

          // Connect to emulators in development
          if (shouldUseEmulators()) {
            connectAuthEmulator(auth, 'http://localhost:9099');
            connectFirestoreEmulator(firestore, 'localhost', 8080);
            connectStorageEmulator(storage, 'localhost', 9199);
            connectFunctionsEmulator(functions, 'localhost', 5001);
          }
        }
      } catch (err) {
        console.error('Error initializing Firebase:', err);
        setError(err instanceof Error ? err : new Error('Unknown error initializing Firebase'));
      }
    };

    initFirebase();
  }, []);

  // If there was an error initializing Firebase, show an error message
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">Firebase Initialization Error</h2>
          <p className="text-gray-700">{error.message}</p>
          <p className="text-sm text-gray-500">
            Please check your Firebase configuration and try again.
          </p>
        </div>
      </div>
    );
  }

  // During server-side rendering, we just render the children
  // Firebase will be initialized on the client
  return <>{children}</>;
}

export default FirebaseProvider; 