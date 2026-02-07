import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '@/app/auth/page';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/app/hooks/useCSRFToken', () => ({
  useCSRFToken: jest.fn(() => ({
    token: 'csrf-token',
    isLoading: false,
    error: null,
  })),
}));

describe('AuthPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userId: 'u1' }),
    }) as jest.Mock;
  });

  it('renders sign in form by default', () => {
    render(<AuthPage />);
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('switches to sign up form', async () => {
    render(<AuthPage />);
    await userEvent.click(screen.getByRole('button', { name: /create a new account/i }));
    expect(screen.getByRole('heading', { name: /create a new account/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('submits sign in form with next-auth', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });
    render(<AuthPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    }));
  });
});
