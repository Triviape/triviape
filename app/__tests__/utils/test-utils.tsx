import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../app/components/auth/AuthProvider';
import { ResponsiveUIProvider } from '../../../app/contexts/responsive-ui-context';
import { User } from 'firebase/auth';

/**
 * Create a new QueryClient for testing
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Using gcTime instead of cacheTime for React Query v5
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    withAuth?: boolean;
    withResponsiveUI?: boolean;
    withReactQuery?: boolean;
  }
) {
  const {
    withAuth = true,
    withResponsiveUI = true,
    withReactQuery = true,
    ...renderOptions
  } = options || {};

  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = children;

    if (withAuth) {
      wrappedChildren = <AuthProvider>{wrappedChildren}</AuthProvider>;
    }

    if (withResponsiveUI) {
      wrappedChildren = <ResponsiveUIProvider>{wrappedChildren}</ResponsiveUIProvider>;
    }

    if (withReactQuery) {
      wrappedChildren = (
        <QueryClientProvider client={queryClient}>{wrappedChildren}</QueryClientProvider>
      );
    }

    return <>{wrappedChildren}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock device info for testing responsive UI
 */
export const mockDeviceInfo = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  browserName: 'jest',
  supportsTouch: false,
  supportsWebGL: true,
  devicePerformance: 'high',
  screenSize: 'large'
};

/**
 * Mock Firebase Auth user for testing
 */
export const mockFirebaseUser: User = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2023-01-01T00:00:00Z',
    lastSignInTime: '2023-01-02T00:00:00Z',
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
};

/**
 * Mock user profile for testing
 */
export const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  createdAt: new Date('2023-01-01').toISOString(),
  updatedAt: new Date('2023-01-02').toISOString(),
};

/**
 * Wait for auth state to change
 */
export const waitForAuthStateChange = () => new Promise((resolve) => setTimeout(resolve, 100)); 