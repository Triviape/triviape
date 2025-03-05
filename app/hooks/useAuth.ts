'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthInstance } from '@/app/lib/firebase';
import { 
  registerWithEmailPassword, 
  signInWithEmail, 
  signInWithGoogle, 
  logoutUser 
} from '@/app/lib/services/user/authService';
import { 
  getUserProfile, 
  updateUserProfile, 
  updateUserPreferences 
} from '@/app/lib/services/user/profileService';
import { UserProfile, UserPreferences } from '@/app/types/user';
import { onAuthStateChanged, User } from 'firebase/auth';

// Query keys for React Query
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  profileId: (id: string) => [...userKeys.profile(), id] as const,
  preferences: (id: string) => [...userKeys.profileId(id), 'preferences'] as const,
  privacy: (id: string) => [...userKeys.profileId(id), 'privacy'] as const,
};

/**
 * Custom hook for authentication state and user profile
 * Uses React Query for efficient caching and state management
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      const auth = getAuthInstance();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
    }
  }, []);

  // Fetch user profile data with React Query
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: userKeys.profileId(currentUser?.uid || 'guest'),
    queryFn: async () => {
      if (!currentUser) return null;
      return await getUserProfile(currentUser.uid);
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sign in with email
  const signInWithEmailMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return await signInWithEmail(email, password);
    },
    onSuccess: () => {
      // Invalidate user queries to refetch data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Sign in with Google
  const signInWithGoogleMutation = useMutation({
    mutationFn: async () => {
      return await signInWithGoogle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Register with email
  const registerWithEmailMutation = useMutation({
    mutationFn: async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      return await registerWithEmailPassword(email, password, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Sign out
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await logoutUser();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!currentUser) throw new Error('No user logged in');
      return await updateUserProfile(currentUser, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: userKeys.profileId(currentUser?.uid || '') 
      });
    },
  });

  // Update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!currentUser) throw new Error('No user logged in');
      return await updateUserPreferences(currentUser.uid, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: userKeys.preferences(currentUser?.uid || '') 
      });
    },
  });

  return {
    currentUser,
    profile,
    isLoading: loading || isProfileLoading,
    signInWithEmail: signInWithEmailMutation,
    signInWithGoogle: signInWithGoogleMutation,
    registerWithEmail: registerWithEmailMutation,
    signOut: signOutMutation,
    updateProfile: updateProfileMutation,
    updatePreferences: updatePreferencesMutation,
  };
} 