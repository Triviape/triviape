'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ConsolidatedAuthService } from '@/app/lib/services/auth/consolidatedAuthService';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseError } from 'firebase/app';
import { Alert, AlertTitle, AlertDescription } from '@/app/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export default function AuthTestPage() {
  const { 
    currentUser: user, 
    isLoading: loading
  } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginErrorCode, setLoginErrorCode] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [emulatorStatus, setEmulatorStatus] = useState<'checking' | 'enabled' | 'disabled' | 'error'>('checking');

  // Check Firebase connection
  useEffect(() => {
    const checkFirebase = async () => {
      try {
        // If we can access the auth state, Firebase is connected
        if (loading === false) {
          setFirebaseStatus('connected');
        }
      } catch (error) {
        console.error('Firebase connection error:', error);
        setFirebaseStatus('error');
      }
    };

    checkFirebase();
  }, [loading]);

  // Check if emulators are enabled
  useEffect(() => {
    const checkEmulators = async () => {
      try {
        // Check if the USE_FIREBASE_EMULATOR environment variable is set
        const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
        
        if (useEmulator) {
          setEmulatorStatus('enabled');
        } else {
          setEmulatorStatus('disabled');
        }
      } catch (error) {
        console.error('Error checking emulator status:', error);
        setEmulatorStatus('error');
      }
    };

    checkEmulators();
  }, []);

  const handleLogout = async () => {
    try {
      await ConsolidatedAuthService.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getAuthErrorMessage(error);
        setLoginError(errorMessage);
        setLoginErrorCode(error.code);
      } else {
        setLoginError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    }
  };

  const handleSampleUserLogin = async (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword('password123');
    
    try {
      await ConsolidatedAuthService.signInWithEmail(sampleEmail, 'password123');
      console.log('Sample user login successful');
      setLoginError(null);
      setLoginErrorCode(null);
    } catch (error) {
      console.error('Sample user login error:', error);
      
      if (error instanceof FirebaseError) {
        const errorMessage = getAuthErrorMessage(error);
        setLoginError(errorMessage);
        setLoginErrorCode(error.code);
        
        // Add helpful diagnostic information for common errors
        if (error.code === 'auth/user-not-found') {
          setLoginError(`${errorMessage} Please run "npm run firebase:create-sample-users" to create sample users in the Auth emulator.`);
        } else if (error.code === 'auth/network-request-failed') {
          setLoginError(`${errorMessage} Please check if the Auth emulator is running at localhost:9099.`);
        } else if (error.code === 'auth/wrong-password') {
          setLoginError(`${errorMessage} The password for sample users should be "password123".`);
        }
      } else {
        setLoginError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    }
  };

  const renderErrorMessage = () => {
    if (!loginError) return null;
    
    return (
      <Alert variant="destructive" className="mt-4">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>{loginErrorCode || 'Authentication Error'}</AlertTitle>
        <AlertDescription>
          {loginError}
          
          {loginErrorCode === 'auth/user-not-found' && (
            <div className="mt-2 text-sm">
              <strong>Troubleshooting:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Run <code>npm run firebase:create-sample-users</code> to create the sample users</li>
                <li>Ensure the Auth emulator is running at localhost:9099</li>
                <li>Check that emulators are properly configured in your environment</li>
              </ul>
            </div>
          )}
          
          {loginErrorCode === 'auth/network-request-failed' && (
            <div className="mt-2 text-sm">
              <strong>Troubleshooting:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Check if emulators are running with <code>npm run emulators</code></li>
                <li>Ensure the NEXT_PUBLIC_USE_FIREBASE_EMULATOR environment variable is set to &apos;true&apos;</li>
                <li>Restart your development server</li>
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Status</CardTitle>
            <CardDescription>Check if Firebase is properly connected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Firebase Connection:</span>
                {firebaseStatus === 'checking' && <span className="text-yellow-500">Checking...</span>}
                {firebaseStatus === 'connected' && <span className="text-green-500 flex items-center">Connected</span>}
                {firebaseStatus === 'error' && <span className="text-red-500 flex items-center">Error</span>}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Emulator Status:</span>
                {emulatorStatus === 'checking' && <span className="text-yellow-500">Checking...</span>}
                {emulatorStatus === 'enabled' && <span className="text-green-500 flex items-center">Enabled</span>}
                {emulatorStatus === 'disabled' && <span className="text-yellow-500 flex items-center">Disabled</span>}
                {emulatorStatus === 'error' && <span className="text-red-500 flex items-center">Error</span>}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Auth State:</span>
                {loading ? (
                  <span className="text-yellow-500">Loading...</span>
                ) : loginError ? (
                  <span className="text-red-500 flex items-center">Error: Authentication failed</span>
                ) : user ? (
                  <span className="text-green-500 flex items-center">Authenticated</span>
                ) : (
                  <span className="text-yellow-500 flex items-center">Not authenticated</span>
                )}
              </div>
            </div>
            
            {renderErrorMessage()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Current User</CardTitle>
            <CardDescription>Information about the currently authenticated user</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading user data...</div>
            ) : user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{user.displayName || 'Anonymous User'}</h3>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div><span className="font-semibold">User ID:</span> {user.uid}</div>
                  <div><span className="font-semibold">Email Verified:</span> {user.emailVerified ? 'Yes' : 'No'}</div>
                  <div><span className="font-semibold">Created:</span> {user.metadata?.creationTime}</div>
                  <div><span className="font-semibold">Last Sign In:</span> {user.metadata?.lastSignInTime}</div>
                </div>
                
                <Button onClick={handleLogout} variant="destructive">Sign Out</Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="mb-4">No user is currently signed in.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {!user && (
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Sample Users</CardTitle>
              <CardDescription>Sign in with a sample user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => handleSampleUserLogin('alex@example.com')}
                className="w-full"
                variant="outline"
              >
                Alex Johnson (alex@example.com)
              </Button>
              
              <Button 
                onClick={() => handleSampleUserLogin('samantha@example.com')}
                className="w-full"
                variant="outline"
              >
                Samantha Lee (samantha@example.com)
              </Button>
              
              <Button 
                onClick={() => handleSampleUserLogin('miguel@example.com')}
                className="w-full"
                variant="outline"
              >
                Miguel Rodriguez (miguel@example.com)
              </Button>
              
              {/* Custom error message has been replaced with renderErrorMessage() */}
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              All sample users have the password: password123
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 