'use client';

import { signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PrivacySettings, UserPreferences, UserProfile } from '@/app/types/user';

export interface NextAuthUser {
  id: string;
  uid: string;
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
  image?: string | null;
  photoURL?: string | null;
}

type MutationAction<TArgs extends unknown[] = [], TResult = void> = ((...args: TArgs) => Promise<TResult>) & {
  mutate: (...args: TArgs) => void;
  mutateAsync: (...args: TArgs) => Promise<TResult>;
  isPending: boolean;
};

export interface AuthState {
  currentUser: NextAuthUser | null;
  user: NextAuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  signOut: MutationAction<[], void>;
  updateProfile: MutationAction<[Partial<UserProfile>], UserProfile | null>;
  updatePreferences: MutationAction<[Partial<UserPreferences>, Partial<PrivacySettings>?], UserProfile | null>;
}

function createMutationAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  isPending: boolean
): MutationAction<TArgs, TResult> {
  const callable = ((...args: TArgs) => action(...args)) as MutationAction<TArgs, TResult>;
  callable.mutate = (...args: TArgs) => {
    void action(...args);
  };
  callable.mutateAsync = (...args: TArgs) => action(...args);
  callable.isPending = isPending;
  return callable;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const [updateProfilePending, setUpdateProfilePending] = useState(false);
  const [updatePreferencesPending, setUpdatePreferencesPending] = useState(false);

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
        if (!response.ok) {
          setProfile(null);
          return;
        }

        const payload = await response.json();
        const nextProfile = (payload?.data ?? payload?.profile ?? null) as UserProfile | null;
        setProfile(nextProfile);
        setProfileError(null);
      } catch (err) {
        setProfile(null);
        setProfileError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setProfileLoading(false);
      }
    };

    void fetchProfile();
  }, [session?.user?.id]);

  const currentUser = useMemo<NextAuthUser | null>(() => {
    if (!session?.user) {
      return null;
    }

    return {
      ...session.user,
      uid: session.user.id,
      displayName: session.user.displayName ?? session.user.name,
      photoURL: session.user.photoURL ?? session.user.image,
    };
  }, [session?.user]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    setSignOutPending(true);
    try {
      await nextAuthSignOut({ callbackUrl: '/' });
    } finally {
      setSignOutPending(false);
    }
  }, []);

  const handleUpdateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
    setUpdateProfilePending(true);
    try {
      setProfile((prev) => {
        if (!prev) {
          return prev;
        }
        return { ...prev, ...updates };
      });

      return profile ? { ...profile, ...updates } : null;
    } finally {
      setUpdateProfilePending(false);
    }
  }, [profile]);

  const handleUpdatePreferences = useCallback(
    async (
      preferences: Partial<UserPreferences>,
      privacySettings?: Partial<PrivacySettings>
    ): Promise<UserProfile | null> => {
      setUpdatePreferencesPending(true);
      try {
        setProfile((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            preferences: {
              ...prev.preferences,
              ...preferences,
              notifications: {
                ...prev.preferences.notifications,
                ...preferences.notifications,
              },
            },
            privacySettings: privacySettings
              ? {
                  ...prev.privacySettings,
                  ...privacySettings,
                }
              : prev.privacySettings,
          };
        });

        return profile;
      } finally {
        setUpdatePreferencesPending(false);
      }
    },
    [profile]
  );

  const isLoading = status === 'loading' || profileLoading;

  return {
    currentUser,
    user: currentUser,
    profile,
    loading: isLoading,
    isLoading,
    error: profileError,
    isAuthenticated: !!session,
    signOut: createMutationAction(handleSignOut, signOutPending),
    updateProfile: createMutationAction(handleUpdateProfile, updateProfilePending),
    updatePreferences: createMutationAction(handleUpdatePreferences, updatePreferencesPending),
  };
}
