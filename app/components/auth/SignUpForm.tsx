'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from '@/app/lib/validation/authSchemas';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface SignUpFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  callbackUrl?: string;
}

export default function SignUpForm({ onSuccess, onError, callbackUrl = '/auth?tab=signin' }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          acceptTerms: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      onSuccess?.();
      router.push(callbackUrl);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setServerError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
        <Input
          type="text"
          id="displayName"
          placeholder="Your display name"
          className="bg-background border-input"
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

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

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  );
}
