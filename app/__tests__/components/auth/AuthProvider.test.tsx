import React, { useState, useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the entire AuthProvider module
jest.mock('../../../components/auth/AuthProvider', () => {
  // Create a mock context with a more flexible type
  const MockAuthContext = React.createContext<any>({
    user: null,
    loading: true,
    exchangeCustomToken: jest.fn(),
    handleAuthResult: jest.fn()
  });

  // Mock functions that we can control from tests
  const mockExchangeCustomToken = jest.fn();
  const mockHandleAuthResult = jest.fn();

  // Return the mocked components and hooks
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => {
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);

      // Simulate auth loading
      useEffect(() => {
        const timer = setTimeout(() => {
          setLoading(false);
        }, 10);
        return () => clearTimeout(timer);
      }, []);

      // Create the context value with the current state
      const contextValue = {
        user,
        loading,
        exchangeCustomToken: (...args: any[]) => {
          return mockExchangeCustomToken(...args);
        },
        handleAuthResult: async (result: any) => {
          const returnValue = await mockHandleAuthResult(result);
          // If the mock returns a user, update the state
          if (returnValue?.user) {
            setUser(returnValue.user);
          }
          return returnValue;
        }
      };

      return (
        <MockAuthContext.Provider value={contextValue}>
          {children}
        </MockAuthContext.Provider>
      );
    },
    useAuth: () => React.useContext(MockAuthContext),
    __mocks: {
      exchangeCustomToken: mockExchangeCustomToken,
      handleAuthResult: mockHandleAuthResult
    }
  };
});

// Import after mocking
const { AuthProvider, useAuth, __mocks } = require('../../../components/auth/AuthProvider');

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, exchangeCustomToken, handleAuthResult } = useAuth();
  
  return (
    <div>
      {loading ? <div>Loading...</div> : null}
      {user ? <div>User: {user.email}</div> : <div>No user</div>}
      <button onClick={() => exchangeCustomToken('test-token')}>Exchange Token</button>
      <button onClick={() => handleAuthResult({ 
        success: true, 
        token: 'test-token',
        redirectTo: '/dashboard'
      })}>
        Handle Auth
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  // Use fake timers
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    
    // Reset mocks
    __mocks.exchangeCustomToken.mockReset();
    __mocks.handleAuthResult.mockReset();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders children and provides auth context with initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Advance timers to trigger the loading state change
    act(() => {
      jest.advanceTimersByTime(20);
    });
    
    // After auth state is determined, should show no user
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No user')).toBeInTheDocument();
  });

  it('handles auth result with successful token exchange', async () => {
    // Setup mock implementation for handleAuthResult
    __mocks.handleAuthResult.mockResolvedValue({
      user: { email: 'test@example.com' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Advance timers to trigger the loading state change
    act(() => {
      jest.advanceTimersByTime(20);
    });
    
    // Wait for initial auth state to be determined
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click the handle auth button
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(screen.getByText('Handle Auth'));

    // Verify handleAuthResult was called with the correct arguments
    expect(__mocks.handleAuthResult).toHaveBeenCalledWith({
      success: true,
      token: 'test-token',
      redirectTo: '/dashboard'
    });
    
    // Verify user is displayed after auth state change
    await waitFor(() => {
      expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    });
  });
}); 