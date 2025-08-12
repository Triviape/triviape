'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';
import { User } from '@/app/types';

interface SignUpFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      // Create the user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', user.uid);

      // Update the user's display name
      await updateProfile(user, { displayName });
      console.log('Display name updated:', displayName);

      // Create the user document in Firestore
      const userDoc: Partial<User> = {
        uid: user.uid,
        email: user.email!,
        displayName,
        createdAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any,
        isAnonymous: false,
        emailVerified: user.emailVerified,
        role: 'user',
        preferences: {
          darkMode: false,
          emailNotifications: true,
          pushNotifications: true,
        }
      };

      console.log('Creating user document in Firestore...');
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log('User document created successfully');

      // Initialize user stats
      console.log('Initializing user stats...');
      await setDoc(doc(db, 'user_stats', user.uid), {
        userId: user.uid,
        totalQuizzesTaken: 0,
        totalQuestionsAnswered: 0,
        correctAnswers: 0,
        totalPoints: 0,
        quizzesCreated: 0,
        lastActive: serverTimestamp(),
        streak: {
          current: 0,
          longest: 0,
          lastQuizDate: serverTimestamp()
        },
        categories: {}
      });
      console.log('User stats initialized successfully');

      onSuccess?.();
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'An error occurred during sign up');
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
          Display Name
        </label>
        <input
          type="text"
          name="displayName"
          id="displayName"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Your display name"
        />
      </div>

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
          minLength={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
} 