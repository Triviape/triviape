'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

/**
 * User profile data from database
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * NextAuth user with extended properties
 */
export interface NextAuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * Interface for auth state - matches component expectations
 */
export interface AuthState {
  currentUser: NextAuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

/**
 * Custom hook for accessing authentication via NextAuth
 * Provides a consistent interface that matches component expectations
 * @returns Object containing authentication state and user information
 */
export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile from database when session exists
  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await fetch(`/api/user/profile?userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile || null);
          setProfileError(null);
        } else {
          // Profile doesn't exist yet - this is okay for new users
          setProfile(null);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setProfileError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    try {
      await nextAuthSignOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  return {
    currentUser: session?.user || null,
    profile,
    loading: status === 'loading' || profileLoading,
    error: profileError,
    isAuthenticated: !!session,
    signOut: handleSignOut,
  };
} 