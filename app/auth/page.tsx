"use client";

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAuthInstance } from '@/app/lib/firebase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [firebaseStatus, setFirebaseStatus] = useState<'initializing' | 'initialized' | 'error'>('initializing');
  
  const { signInWithEmail, registerWithEmail, currentUser } = useAuth();
  const router = useRouter();
  
  // Check network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check Firebase initialization
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        const auth = getAuthInstance();
        setFirebaseStatus('initialized');
        console.log('Firebase Auth initialized successfully:', auth);
      } catch (error) {
        console.error('Firebase Auth initialization error:', error);
        setFirebaseStatus('error');
      }
    };
    
    checkFirebase();
  }, []);
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (networkStatus === 'offline') {
      setError('You are currently offline. Please check your internet connection.');
      return;
    }
    
    try {
      console.log('Attempting authentication operation...');
      if (isLogin) {
        console.log('Signing in with email:', email);
        signInWithEmail.mutate({ email, password }, {
          onError: (error) => {
            console.error('Sign in error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during sign in');
          }
        });
      } else {
        console.log('Registering with email:', email, 'and display name:', displayName);
        registerWithEmail.mutate({ email, password, displayName }, {
          onError: (error) => {
            console.error('Registration error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during registration');
          }
        });
      }
    } catch (error) {
      console.error('Unexpected error during auth operation:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };
  
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background"
    >
      <div className="py-8 flex flex-col items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Fill out the form to create a new account'}
            </p>
          </div>
          
          {/* Debug information */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <p>Network: <span className={networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}>{networkStatus}</span></p>
            <p>Firebase: <span className={
              firebaseStatus === 'initialized' ? 'text-green-600' : 
              firebaseStatus === 'initializing' ? 'text-yellow-600' : 'text-red-600'
            }>{firebaseStatus}</span></p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div suppressHydrationWarning={true}>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            
            {!isLogin && (
              <div suppressHydrationWarning={true}>
                <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                  Display Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div suppressHydrationWarning={true}>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={signInWithEmail.isPending || registerWithEmail.isPending || networkStatus === 'offline' || firebaseStatus !== 'initialized'}
            >
              {signInWithEmail.isPending || registerWithEmail.isPending
                ? 'Processing...' 
                : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
} 