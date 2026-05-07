'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '@/app/lib/validation/authSchemas';
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
  const [enhancedError, setEnhancedError] = useState<Awaited<ReturnType<typeof handleAuthError>> | null>(null);
  const router = useRouter();
  const { token: csrfToken, isLoading: csrfLoading, error: csrfError } = useCSRFToken();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setEnhancedError(null);

    const attemptSignIn = async () => {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push(callbackUrl);
    };

    try {
      await attemptSignIn();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      const enhancedErr = await handleAuthError(error, attemptSignIn);
      setEnhancedError(enhancedErr);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {csrfToken && (
        <input type="hidden" name="csrf-token" value={csrfToken} />
      )}

      {enhancedError && (
        <EnhancedErrorHandler
          error={enhancedError}
          onRetry={async () => { setEnhancedError(null); }}
          onDismiss={() => setEnhancedError(null)}
          className="mb-4"
        />
      )}

      {csrfError && !enhancedError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
          {csrfError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <Input
          type="email"
          id="email"
          placeholder="you@example.com"
          className="bg-background border-input"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">Password</Label>
        <Input
          type="password"
          id="password"
          placeholder="••••••••"
          className="bg-background border-input"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
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
