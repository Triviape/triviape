'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/app/lib/firebase';

/**
 * Interface for auth state
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: FirebaseError | Error | null;
  isAuthenticated: boolean;
}

/**
 * Custom hook for accessing Firebase authentication
 * @returns Object containing authentication state and user information
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirebaseError | Error | null>(null);

  // Use useCallback to memoize the auth state change handler
  const handleAuthStateChanged = useCallback((user: User | null) => {
    setUser(user);
    setLoading(false);
  }, []);

  // Use useCallback to memoize the error handler
  const handleAuthError = useCallback((error: Error) => {
    setError(error);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Firebase auth state subscription
    const unsubscribe = onAuthStateChanged(
      auth,
      handleAuthStateChanged,
      handleAuthError
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [handleAuthStateChanged, handleAuthError]); // Properly include dependencies

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
  };
} 