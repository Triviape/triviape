'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    try {
      console.log('Creating new user with email:', email);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          acceptTerms: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('User created successfully:', data.userId);

      onSuccess?.();
      router.push(callbackUrl);
    } catch (err: any) {
      console.error('Sign up error:', err);
      const errorMessage = err.message || 'An error occurred during sign up';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-foreground">
          Display Name
        </Label>
        <Input
          type="text"
          name="displayName"
          id="displayName"
          required
          placeholder="Your display name"
          className="bg-background border-input"
        />
      </div>

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
          minLength={6}
          placeholder="••••••••"
          className="bg-background border-input"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  );
} 
