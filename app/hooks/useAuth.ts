'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@/app/lib/firebase';
import { UserService } from '@/app/lib/services/userService';
import { UserProfile, UserPreferences, PrivacySettings } from '@/app/types/user';
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user profile data with React Query
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: userKeys.profileId(currentUser?.uid || 'guest'),
    queryFn: async () => {
      if (!currentUser) return null;
      return await UserService.getUserProfile(currentUser.uid);
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sign in with email
  const signInWithEmail = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return await UserService.signInWithEmail(email, password);
    },
    onSuccess: () => {
      // Invalidate user queries to refetch data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Sign in with Google
  const signInWithGoogle = useMutation({
    mutationFn: async () => {
      return await UserService.signInWithGoogle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Register with email
  const registerWithEmail = useMutation({
    mutationFn: async ({
      email,
      password,
      displayName,
    }: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      return await UserService.registerWithEmail(email, password, displayName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Sign out
  const signOut = useMutation({
    mutationFn: async () => {
      return await UserService.signOut();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });

  // Update user profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!currentUser) throw new Error('No user logged in');
      return await UserService.updateUserProfile(currentUser.uid, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: userKeys.profileId(currentUser?.uid || '') 
      });
    },
  });

  // Update user preferences
  const updatePreferences = useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!currentUser) throw new Error('No user logged in');
      return await UserService.updateUserPreferences(currentUser.uid, preferences);
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
    signInWithEmail,
    signInWithGoogle,
    registerWithEmail,
    signOut,
    updateProfile,
    updatePreferences,
  };
} 