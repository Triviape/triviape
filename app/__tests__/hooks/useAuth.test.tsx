import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/app/hooks/useAuth';
import { onAuthStateChanged, User, NextOrObserver } from 'firebase/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { UserService } from '@/app/lib/services/userService';

// Mock the UserService methods
jest.mock('@/app/lib/services/userService', () => {
  return {
    UserService: {
      getUserProfile: jest.fn().mockResolvedValue({
        displayName: 'Test User',
        level: 1,
        xp: 0,
        coins: 100
      }),
      signInWithEmail: jest.fn().mockResolvedValue({ 
        user: { 
          uid: 'test-user-id',
          email: 'test@example.com',
          getIdToken: jest.fn().mockResolvedValue('test-token')
        } 
      }),
      signInWithGoogle: jest.fn().mockResolvedValue({ 
        user: { 
          uid: 'test-user-id',
          email: 'test@example.com',
          getIdToken: jest.fn().mockResolvedValue('test-token')
        } 
      }),
      registerWithEmail: jest.fn().mockResolvedValue({ 
        user: { 
          uid: 'test-user-id',
          email: 'test@example.com',
          getIdToken: jest.fn().mockResolvedValue('test-token')
        } 
      }),
      signOut: jest.fn().mockResolvedValue(undefined),
      updateUserProfile: jest.fn().mockResolvedValue(undefined),
      updateUserPreferences: jest.fn().mockResolvedValue(undefined),
      updateLastLogin: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Mock the Firebase auth state changed
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;

// Helper function to invoke callback safely regardless of whether it's a function or Observer
const invokeAuthCallback = (observer: NextOrObserver<User | null>, user: User | null) => {
  if (typeof observer === 'function') {
    observer(user);
  } else if (observer && typeof observer.next === 'function') {
    observer.next(user);
  }
};

// Setup React Query for testing
const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state and no user', () => {
    mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
      // Don't call the callback yet to simulate loading
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentUser).toBeNull();
  });

  it('should update state when user is authenticated', async () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com'
    };

    mockOnAuthStateChanged.mockImplementationOnce((auth, observer) => {
      invokeAuthCallback(observer, mockUser as unknown as User);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    // Wait for the hook to process the auth state change
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentUser).toEqual(mockUser);
  });

  it('should handle sign in with email', async () => {
    mockOnAuthStateChanged.mockImplementationOnce((auth, observer) => {
      invokeAuthCallback(observer, null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.signInWithEmail.mutateAsync({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    expect(UserService.signInWithEmail).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
  });

  it('should handle sign in with Google', async () => {
    mockOnAuthStateChanged.mockImplementationOnce((auth, observer) => {
      invokeAuthCallback(observer, null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.signInWithGoogle.mutateAsync();
    });

    expect(UserService.signInWithGoogle).toHaveBeenCalled();
  });

  it('should handle registration', async () => {
    mockOnAuthStateChanged.mockImplementationOnce((auth, observer) => {
      invokeAuthCallback(observer, null);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.registerWithEmail.mutateAsync({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      });
    });

    expect(UserService.registerWithEmail).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
      'Test User'
    );
  });

  it('should handle sign out', async () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com'
    };

    mockOnAuthStateChanged.mockImplementationOnce((auth, observer) => {
      invokeAuthCallback(observer, mockUser as unknown as User);
      return jest.fn();
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.signOut.mutateAsync();
    });

    expect(UserService.signOut).toHaveBeenCalled();
  });
}); 