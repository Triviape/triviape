import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '@/app/auth/page';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ResponsiveUIProvider, useResponsiveUI } from '@/app/contexts/responsive-ui-context';

// Mock the hooks
jest.mock('@/app/hooks/useAuth');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/app/contexts/responsive-ui-context', () => {
  const originalModule = jest.requireActual('@/app/contexts/responsive-ui-context');
  return {
    ...originalModule,
    useResponsiveUI: jest.fn(),
    ResponsiveUIProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock device info
const mockDeviceInfo = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  browserName: 'jest',
  supportsTouch: false,
  supportsWebGL: true,
  devicePerformance: 'high',
  screenSize: 'large'
};

describe('AuthPage', () => {
  const mockSignInMutate = jest.fn();
  const mockRegisterMutate = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: null,
      signInWithEmail: {
        mutate: mockSignInMutate,
        isPending: false,
        isError: false,
        error: null
      },
      registerWithEmail: {
        mutate: mockRegisterMutate,
        isPending: false,
        isError: false,
        error: null
      }
    });
    
    // Mock useRouter hook
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });

    // Mock useResponsiveUI hook
    (useResponsiveUI as jest.Mock).mockReturnValue({
      deviceInfo: mockDeviceInfo,
      isTouch: false,
      uiScale: 'regular',
      animationLevel: 'full',
      setAnimationLevel: jest.fn(),
      setUIScale: jest.fn()
    });
  });
  
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ResponsiveUIProvider>
        {ui}
      </ResponsiveUIProvider>
    );
  };
  
  it('renders the sign in form by default', () => {
    renderWithProviders(<AuthPage />);
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Display Name')).not.toBeInTheDocument();
    expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument();
  });
  
  it('switches to sign up form when clicking the link', async () => {
    renderWithProviders(<AuthPage />);
    
    // Click the link to switch to sign up
    await userEvent.click(screen.getByText("Don't have an account? Sign up"));
    
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByText("Already have an account? Sign in")).toBeInTheDocument();
  });
  
  it('calls signInWithEmail.mutate when submitting the sign in form', async () => {
    renderWithProviders(<AuthPage />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    expect(mockSignInMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      expect.any(Object)
    );
  });
  
  it('calls registerWithEmail.mutate when submitting the sign up form', async () => {
    renderWithProviders(<AuthPage />);
    
    // Switch to sign up form
    await userEvent.click(screen.getByText("Don't have an account? Sign up"));
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test User');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    
    expect(mockRegisterMutate).toHaveBeenCalledWith(
      { 
        email: 'test@example.com', 
        password: 'password123',
        displayName: 'Test User'
      },
      expect.any(Object)
    );
  });
  
  it('shows loading state when authentication is in progress', () => {
    // Mock pending state
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: null,
      signInWithEmail: {
        mutate: mockSignInMutate,
        isPending: true,
        isError: false,
        error: null
      },
      registerWithEmail: {
        mutate: mockRegisterMutate,
        isPending: false,
        isError: false,
        error: null
      }
    });
    
    renderWithProviders(<AuthPage />);
    
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
  });
  
  it('redirects to home page if user is already logged in', () => {
    // Mock logged in user
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: 'test-user-id' },
      signInWithEmail: {
        mutate: mockSignInMutate,
        isPending: false,
        isError: false,
        error: null
      },
      registerWithEmail: {
        mutate: mockRegisterMutate,
        isPending: false,
        isError: false,
        error: null
      }
    });
    
    renderWithProviders(<AuthPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });
}); 