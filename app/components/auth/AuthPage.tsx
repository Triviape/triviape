'use client';

import { useState } from 'react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { useSearchParams } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {mode === 'signin' ? (
            <>
              Or{' '}
              <button
                onClick={() => setMode('signup')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                create a new account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {mode === 'signin' ? (
            <SignInForm
              callbackUrl={callbackUrl}
              onError={(error) => {
                console.error('Sign in error:', error);
              }}
            />
          ) : (
            <SignUpForm
              onSuccess={() => {
                setMode('signin');
              }}
              onError={(error) => {
                console.error('Sign up error:', error);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
} 