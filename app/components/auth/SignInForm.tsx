'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCSRFToken } from '@/app/hooks/useCSRFToken';
import { handleAuthError } from '@/app/lib/errors/enhancedErrorHandling';
import { EnhancedErrorHandler } from '@/app/components/errors/EnhancedErrorHandler';

interface SignInFormProps {
  onError?: (error: Error) => void;
  callbackUrl?: string;
}

export default function SignInForm({ onError, callbackUrl = '/dashboard' }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState<any>(null);
  const router = useRouter();
  const { token: csrfToken, getHeaders, isLoading: csrfLoading, error: csrfError } = useCSRFToken();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setEnhancedError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const attemptSignIn = async () => {
      console.log('Attempting to sign in with email:', email);
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('Sign in result:', result);

      if (result?.error) {
        throw new Error(result.error);
      }

      console.log('Sign in successful, redirecting to:', callbackUrl);
      router.push(callbackUrl);
    };

    try {
      await attemptSignIn();
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      // Use enhanced error handling
      const enhancedErr = await handleAuthError(err, attemptSignIn);
      setEnhancedError(enhancedErr);
      
      // Call legacy error handler for backwards compatibility
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* CSRF Protection */}
      {csrfToken && (
        <input type="hidden" name="csrf-token" value={csrfToken} />
      )}
      
      {/* Enhanced Error Display */}
      {enhancedError && (
        <EnhancedErrorHandler 
          error={enhancedError}
          onRetry={async () => {
            setEnhancedError(null);
            // The retry will be handled by the enhanced error system
          }}
          onDismiss={() => setEnhancedError(null)}
          className="mb-4"
        />
      )}
      
      {/* CSRF Error Display */}
      {csrfError && !enhancedError && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {csrfError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || csrfLoading || !csrfToken}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : csrfLoading ? 'Loading...' : 'Sign In'}
      </button>

      <div className="text-center mt-4">
        <a
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
        >
          Forgot your password?
        </a>
      </div>
    </form>
  );
} 