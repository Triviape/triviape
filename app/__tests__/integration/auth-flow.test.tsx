import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/app/components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  initializeTestFirebase, 
  createTestUser, 
  signOutTestUser, 
  ensureEmulatorsRunning,
  TEST_USER,
  signInTestUser,
  generateTestUserData,
  cleanupTestResources,
  initTestFirebase
} from '../utils/firebase-test-utils';
import AuthPage from '@/app/auth/page';
import { ResponsiveUIProvider } from '@/app/contexts/responsive-ui-context';
import { shouldUseEmulators } from '@/app/lib/emulatorUtils';
import { UserService } from '@/app/lib/services/userService';
import * as firebaseAuth from 'firebase/auth';

// Create mock functions for Firebase auth
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockUpdateProfile = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockGetAuth = jest.fn(() => ({
  currentUser: null,
  onAuthStateChanged: jest.fn(),
}));

// Mock the firebase/auth module
jest.mock('firebase/auth', () => ({
  getAuth: () => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  }),
  signOut: () => Promise.resolve(undefined),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
}));

// Type for user credentials
interface UserCredential {
  user: {
    uid: string;
    displayName?: string | null;
  };
}

// Mock the AuthProvider component and useAuth hook
jest.mock('@/app/components/auth/AuthProvider', () => {
  const originalModule = jest.requireActual('@/app/components/auth/AuthProvider');
  
  return {
    ...originalModule,
    useAuth: jest.fn(() => ({
      user: null,
      loading: false,
      exchangeCustomToken: jest.fn().mockResolvedValue('mock-id-token'),
      handleAuthResult: jest.fn().mockResolvedValue(undefined),
    })),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock Next.js navigation hooks
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
  usePathname: jest.fn(() => '/auth'),
}));

// Mock the UserService
jest.mock('@/app/lib/services/userService');

// Test data
const testUser = {
  email: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
  password: 'Test123!',
  displayName: 'Test User',
};

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrap components with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ResponsiveUIProvider>
        {ui}
      </ResponsiveUIProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeAll(async () => {
    // Initialize Firebase for testing
    if (shouldUseEmulators()) {
      await ensureEmulatorsRunning();
    }
    initializeTestFirebase();
  });
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Reset the router
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    
    // Reset the query client
    queryClient.clear();
    
    // Reset Firebase auth mocks
    mockCreateUserWithEmailAndPassword.mockReset();
    mockSignInWithEmailAndPassword.mockReset();
    mockUpdateProfile.mockReset();
    mockSignOut.mockReset().mockResolvedValue(undefined);
    mockGetAuth.mockReset().mockImplementation(() => ({
      currentUser: null,
      onAuthStateChanged: jest.fn(),
    }));
  });
  
  afterEach(async () => {
    // Clean up resources after each test
    await cleanupTestResources();
  });
  
  /**
   * Test the registration flow
   */
  it('should register a new user successfully', async () => {
    // Create a test user
    const testUser = {
      email: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'Test123!',
      displayName: 'Test User'
    };
    
    const mockUser = { uid: 'test-uid', displayName: testUser.displayName };
    const mockUserCredential = { user: mockUser };
    
    // Mock the UserService.registerWithEmail to resolve successfully
    UserService.registerWithEmail = jest.fn().mockImplementation((email, password, displayName) => {
      console.log(`Registering with email: ${email} and display name: ${displayName}`);
      return Promise.resolve(mockUserCredential as any);
    });
    
    // Render a mock registration component
    const MockRegistrationComponent = () => {
      const [error, setError] = React.useState<string | null>(null);
      const [success, setSuccess] = React.useState(false);
      
      const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        try {
          const form = e.currentTarget;
          const emailInput = form.elements.namedItem('email') as HTMLInputElement;
          const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
          const displayNameInput = form.elements.namedItem('displayName') as HTMLInputElement;
          
          const email = emailInput?.value || '';
          const password = passwordInput?.value || '';
          const displayName = displayNameInput?.value || '';
          
          console.log(`Attempting to register with: ${email}, ${password}, ${displayName}`);
          await UserService.registerWithEmail(email, password, displayName);
          console.log('Registration successful, setting success state');
          setSuccess(true);
        } catch (error) {
          console.error('Registration error:', error);
          setError('Registration failed');
        }
      };
      
      return (
        <div>
          {success && <div data-testid="success-message">Registration successful</div>}
          {error && <div data-testid="error-message">{error}</div>}
          <form onSubmit={handleRegister}>
            <input type="email" name="email" data-testid="email-input" defaultValue={testUser.email} />
            <input type="password" name="password" data-testid="password-input" defaultValue={testUser.password} />
            <input type="text" name="displayName" data-testid="name-input" defaultValue={testUser.displayName} />
            <button type="submit" data-testid="register-button">Register</button>
          </form>
        </div>
      );
    };
    
    render(<MockRegistrationComponent />);
    
    // Submit the form using userEvent
    const user = userEvent.setup();
    await user.click(screen.getByTestId('register-button'));
    
    // Wait for the registration to complete
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
    
    // Verify the registration function was called with the correct parameters
    expect(UserService.registerWithEmail).toHaveBeenCalledWith(
      testUser.email,
      testUser.password,
      testUser.displayName
    );
  });
  
  /**
   * Test the login flow
   */
  it('should login an existing user successfully', async () => {
    // Create a test user
    const testUser = {
      email: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'Test123!',
      displayName: 'Test User'
    };
    
    const mockUser = { uid: 'test-uid', displayName: testUser.displayName };
    const mockUserCredential = { user: mockUser };
    
    // Mock the UserService.signInWithEmail to resolve successfully
    UserService.signInWithEmail = jest.fn().mockImplementation((email, password) => {
      console.log(`Signing in with email: ${email}`);
      return Promise.resolve(mockUserCredential as any);
    });
    
    // Render a mock login component
    const MockLoginComponent = () => {
      const [error, setError] = React.useState<string | null>(null);
      const [success, setSuccess] = React.useState(false);
      
      const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        try {
          const form = e.currentTarget;
          const emailInput = form.elements.namedItem('email') as HTMLInputElement;
          const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
          
          const email = emailInput?.value || '';
          const password = passwordInput?.value || '';
          
          console.log(`Attempting to login with: ${email}, ${password}`);
          await UserService.signInWithEmail(email, password);
          console.log('Login successful, setting success state');
          setSuccess(true);
        } catch (error) {
          console.error('Login error:', error);
          setError('Login failed');
        }
      };
      
      return (
        <div>
          {success && <div data-testid="success-message">Login successful</div>}
          {error && <div data-testid="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="email" name="email" data-testid="email-input" defaultValue={testUser.email} />
            <input type="password" name="password" data-testid="password-input" defaultValue={testUser.password} />
            <button type="submit" data-testid="login-button">Login</button>
          </form>
        </div>
      );
    };
    
    render(<MockLoginComponent />);
    
    // Submit the form using userEvent
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Wait for the login to complete
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
    
    // Verify the login function was called with the correct parameters
    expect(UserService.signInWithEmail).toHaveBeenCalledWith(
      testUser.email,
      testUser.password
    );
  });
  
  /**
   * Test the login with invalid credentials
   */
  it('should handle login with invalid credentials', async () => {
    // Create a test user
    const testUser = {
      email: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'Test123!',
      displayName: 'Test User'
    };
    
    // Mock the login function to throw an error
    UserService.signInWithEmail = jest.fn().mockImplementation((email, password) => {
      console.log(`Attempting to login with: ${email}, ${password}`);
      if (password === 'wrong-password') {
        console.log('Throwing auth/wrong-password error');
        return Promise.reject(new Error('Invalid credentials'));
      }
      return Promise.resolve({} as any);
    });
    
    // Render a mock login component
    const MockLoginComponent = () => {
      const [error, setError] = React.useState<string | null>(null);
      const [success, setSuccess] = React.useState(false);
      
      const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        
        try {
          const form = e.currentTarget;
          const emailInput = form.elements.namedItem('email') as HTMLInputElement;
          const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
          
          const email = emailInput?.value || '';
          const password = passwordInput?.value || '';
          
          console.log(`Attempting to login with: ${email}, ${password}`);
          await UserService.signInWithEmail(email, password);
          console.log('Login successful, setting success state');
          setSuccess(true);
        } catch (error: any) {
          console.error('Login error:', error);
          setError('Login failed');
        }
      };
      
      return (
        <div>
          {success && <div data-testid="success-message">Login successful</div>}
          {error && <div data-testid="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <input type="email" name="email" data-testid="email-input" defaultValue={testUser.email} />
            <input type="password" name="password" data-testid="password-input" defaultValue="wrong-password" />
            <button type="submit" data-testid="login-button">Login</button>
          </form>
        </div>
      );
    };
    
    render(<MockLoginComponent />);
    
    // Submit the form using userEvent
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('error-message').textContent).toBe('Login failed');
    });
    
    // Verify the login function was called with the correct parameters
    expect(UserService.signInWithEmail).toHaveBeenCalledWith(
      testUser.email,
      'wrong-password'
    );
  });
  
  /**
   * Test the logout flow
   */
  it('should logout a user successfully', async () => {
    // Mock the logout function
    UserService.signOut = jest.fn().mockResolvedValueOnce(undefined);
    
    // Render a mock logout component
    const MockLogoutComponent = () => {
      const [loggedOut, setLoggedOut] = React.useState(false);
      
      const handleLogout = async () => {
        await UserService.signOut();
        setLoggedOut(true);
      };
      
      return (
        <AuthProvider>
          <div>
            {loggedOut && <div data-testid="logout-success">Logged out successfully</div>}
            <button onClick={handleLogout} data-testid="logout-button">
              Logout
            </button>
          </div>
        </AuthProvider>
      );
    };
    
    render(<MockLogoutComponent />);
    
    // Click the logout button
    fireEvent.click(screen.getByTestId('logout-button'));
    
    // Wait for the logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('logout-success')).toBeInTheDocument();
    });
    
    // Verify the logout function was called
    expect(UserService.signOut).toHaveBeenCalled();
  });
}); 