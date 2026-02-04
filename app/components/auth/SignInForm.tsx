'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCSRFToken } from '@/app/hooks/useCSRFToken';
import { handleAuthError } from '@/app/lib/errors/enhancedErrorHandling';
import { EnhancedErrorHandler } from '@/app/components/errors/EnhancedErrorHandler';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface SignInFormProps {
  onError?: (error: Error) => void;
  callbackUrl?: string;
}

export default function SignInForm({ onError, callbackUrl = '/dashboard' }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState<any>(null);
  const router = useRouter();
  const { token: csrfToken, isLoading: csrfLoading, error: csrfError } = useCSRFToken();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setEnhancedError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const attemptSignIn = async () => {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

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
          }}
          onDismiss={() => setEnhancedError(null)}
          className="mb-4"
        />
      )}
      
      {/* CSRF Error Display */}
      {csrfError && !enhancedError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
          {csrfError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          Email
        </Label>
        <Input
          type="email"
          name="email"
          id="email"
          required
          placeholder="you@example.com"
          className="bg-background border-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Password
        </Label>
        <Input
          type="password"
          name="password"
          id="password"
          required
          placeholder="••••••••"
          className="bg-background border-input"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || csrfLoading || !csrfToken}
        className="w-full"
      >
        {isLoading ? 'Signing in...' : csrfLoading ? 'Loading...' : 'Sign In'}
      </Button>

      <div className="text-center mt-4">
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary hover:text-primary/90 focus:outline-none focus:underline"
        >
          Forgot your password?
        </Link>
      </div>
    </form>
  );
} 
