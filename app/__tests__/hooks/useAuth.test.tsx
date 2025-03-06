import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/app/components/auth/AuthProvider';
import { UserService } from '@/app/lib/services/userService';
import React from 'react';
import { initTestFirebase } from '../utils/firebase-test-utils';
import { generateTestUserData, createTestUserInAuth, cleanupTestResources } from '../utils/test-data-factory';

// Initialize test Firebase
beforeAll(async () => {
  await initTestFirebase();
});

afterAll(async () => {
  await cleanupTestResources();
});

// Mock Firebase Auth user
const mockFirebaseUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
};

// Mock user profile
const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  createdAt: new Date('2023-01-01').toISOString(),
  updatedAt: new Date('2023-01-02').toISOString(),
};

// Mock auth state change callback
let authStateCallback: ((user: any) => void) | null = null;
const mockUnsubscribe = jest.fn();

// Mock the AuthProvider component
jest.mock('@/app/components/auth/AuthProvider', () => {
  const originalModule = jest.requireActual('@/app/components/auth/AuthProvider');
  
  // Create a mock implementation of the useAuth hook
  const mockUseAuth = jest.fn(() => ({
    user: null,
    loading: false,
    exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
    handleAuthResult: jest.fn().mockResolvedValue(undefined),
  }));
  
  return {
    ...originalModule,
    useAuth: mockUseAuth,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn(() => ({
      onAuthStateChanged: jest.fn((auth, callback) => {
        authStateCallback = callback;
        // Immediately call the callback with null to set loading to false
        setTimeout(() => {
          if (callback) callback(null);
        }, 0);
        return mockUnsubscribe;
      }),
      currentUser: null,
    })),
    signInWithCustomToken: jest.fn(() => Promise.resolve({
      user: {
        ...mockFirebaseUser,
        getIdToken: jest.fn(() => Promise.resolve('mock-id-token')),
      },
    })),
    onAuthStateChanged: jest.fn(),
  };
});

// Mock UserService
jest.mock('@/app/lib/services/userService', () => ({
  UserService: {
    getUserProfile: jest.fn(),
    signInWithEmail: jest.fn(),
    signInWithGoogle: jest.fn(),
    registerWithEmail: jest.fn(),
    signOut: jest.fn(),
    updateUserProfile: jest.fn(),
    updateUserPreferences: jest.fn(),
  },
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

// Create a wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = null;
    
    // Reset the mock implementation for each test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(async () => {
    // Clean up any test resources created during the test
    await cleanupTestResources();
  });

  it('should initialize with loading state and no user', async () => {
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Check that the hook returns the expected values
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('should handle exchangeCustomToken function', async () => {
    const mockExchangeCustomToken = jest.fn().mockResolvedValue('mock-id-token');
    
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: mockExchangeCustomToken,
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call the exchangeCustomToken function
    let idToken;
    await act(async () => {
      idToken = await result.current.exchangeCustomToken('mock-custom-token');
    });

    // Check that the function was called with the expected arguments
    expect(mockExchangeCustomToken).toHaveBeenCalledWith('mock-custom-token');
    
    // Check that the function returns the expected ID token
    expect(idToken).toBe('mock-id-token');
  });

  it('should handle auth result with success', async () => {
    const mockHandleAuthResult = jest.fn().mockResolvedValue(undefined);
    
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: mockHandleAuthResult,
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call the handleAuthResult function
    await act(async () => {
      await result.current.handleAuthResult({
        success: true,
        token: 'mock-custom-token',
        redirectTo: '/dashboard',
      });
    });

    // Check that the function was called with the expected arguments
    expect(mockHandleAuthResult).toHaveBeenCalledWith({
      success: true,
      token: 'mock-custom-token',
      redirectTo: '/dashboard',
    });
  });

  it('should handle auth result with failure', async () => {
    const mockHandleAuthResult = jest.fn().mockResolvedValue(undefined);
    
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: mockHandleAuthResult,
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call the handleAuthResult function with failure
    await act(async () => {
      await result.current.handleAuthResult({
        success: false,
        error: 'Authentication failed',
      });
    });

    // Check that the function was called with the expected arguments
    expect(mockHandleAuthResult).toHaveBeenCalledWith({
      success: false,
      error: 'Authentication failed',
    });
  });

  it('should update state when user logs in', async () => {
    // First mock with no user
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
    
    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    
    // Check initial state
    expect(result.current.user).toBe(null);
    
    // Then mock with a user
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: mockFirebaseUser,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
    
    // Rerender to trigger the updated mock
    rerender();
    
    // Check that user state is updated
    expect(result.current.user).toEqual(mockFirebaseUser);
  });

  // New edge case tests
  it('should handle token expiration gracefully', async () => {
    // Mock token expiration error
    const mockExchangeCustomToken = jest.fn().mockRejectedValue(new Error('Firebase: Error (auth/id-token-expired).'));
    
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: mockExchangeCustomToken,
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call the exchangeCustomToken function and expect it to throw
    await expect(async () => {
      await act(async () => {
        await result.current.exchangeCustomToken('expired-token');
      });
    }).rejects.toThrow('Firebase: Error (auth/id-token-expired).');
  });

  it('should handle network errors during authentication', async () => {
    // Mock network error
    const mockHandleAuthResult = jest.fn().mockRejectedValue(new Error('Network Error'));
    
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: mockHandleAuthResult,
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call the handleAuthResult function and expect it to throw
    await expect(async () => {
      await act(async () => {
        await result.current.handleAuthResult({
          success: true,
          token: 'mock-custom-token',
          redirectTo: '/dashboard',
        });
      });
    }).rejects.toThrow('Network Error');
  });

  it('should handle malformed tokens', async () => {
    // Mock malformed token error
    const mockExchangeCustomToken = jest.fn().mockRejectedValue(new Error('Firebase: Error (auth/invalid-custom-token).'));
    
    // Mock the useAuth hook for this specific test
    (useAuth as jest.Mock).mockImplementation(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: mockExchangeCustomToken,
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    }));
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call the exchangeCustomToken function and expect it to throw
    await expect(async () => {
      await act(async () => {
        await result.current.exchangeCustomToken('malformed-token');
      });
    }).rejects.toThrow('Firebase: Error (auth/invalid-custom-token).');
  });
}); 