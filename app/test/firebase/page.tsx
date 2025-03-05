'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { getApp, getFirestoreDb, getAuthInstance } from '@/app/lib/firebase';
import { getDoc, doc, collection, getDocs, limit, query } from 'firebase/firestore';

export default function FirebaseTestPage() {
  const [firebaseStatus, setFirebaseStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [firestoreStatus, setFirestoreStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currentUser, isLoading } = useAuth();

  // Test Firebase initialization
  useEffect(() => {
    try {
      // Check if Firebase app is initialized
      const firebaseApp = getApp();
      if (firebaseApp) {
        setFirebaseStatus('success');
      } else {
        setFirebaseStatus('error');
        setErrorMessage('Firebase app not initialized');
      }
    } catch (error) {
      setFirebaseStatus('error');
      setErrorMessage(`Firebase initialization error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // Test Firestore
  useEffect(() => {
    const testFirestore = async () => {
      try {
        // Use the safe Firestore access function
        const firestore = getFirestoreDb();
        const testQuery = query(collection(firestore, 'test_collection'), limit(1));
        await getDocs(testQuery);
        setFirestoreStatus('success');
      } catch (error) {
        console.error('Firestore test error:', error);
        setFirestoreStatus('error');
        setErrorMessage(`Firestore error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    if (firebaseStatus === 'success') {
      testFirestore();
    }
  }, [firebaseStatus]);

  // Test Auth
  useEffect(() => {
    const testAuth = async () => {
      try {
        // Use the safe Auth access function
        const authInstance = getAuthInstance();
        if (authInstance) {
          setAuthStatus('success');
        } else {
          setAuthStatus('error');
          setErrorMessage('Auth not initialized');
        }
      } catch (error) {
        console.error('Auth test error:', error);
        setAuthStatus('error');
        setErrorMessage(`Auth error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    if (firebaseStatus === 'success') {
      testAuth();
    }
  }, [firebaseStatus]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Firebase Integration Test</h1>
      
      <div className="grid gap-6">
        <TestCard 
          title="Firebase Core" 
          status={firebaseStatus} 
          details="Tests if Firebase is properly initialized"
        />
        
        <TestCard 
          title="Firestore" 
          status={firestoreStatus} 
          details="Tests connection to Firestore database"
        />
        
        <TestCard 
          title="Authentication" 
          status={authStatus} 
          details="Tests if Firebase Auth is properly initialized"
        />
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Authentication Status</h2>
          <div className="p-4 bg-gray-100 rounded-lg">
            {isLoading ? (
              <p>Loading authentication status...</p>
            ) : currentUser ? (
              <div>
                <p className="text-green-600 font-medium">✅ Authenticated</p>
                <p>User ID: {currentUser.uid}</p>
                <p>Email: {currentUser.email}</p>
              </div>
            ) : (
              <p className="text-yellow-600">Not authenticated</p>
            )}
          </div>
        </div>
        
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-red-700">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TestCard({ 
  title, 
  status, 
  details 
}: { 
  title: string; 
  status: 'loading' | 'success' | 'error'; 
  details: string;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-2">
          <StatusIndicator status={status} />
          <span className="ml-2 font-medium">
            {status === 'loading' ? 'Testing...' : 
             status === 'success' ? 'Success' : 'Failed'}
          </span>
        </div>
        <p className="text-gray-600 text-sm">{details}</p>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: 'loading' | 'success' | 'error' }) {
  if (status === 'loading') {
    return <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>;
  } else if (status === 'success') {
    return <div className="w-4 h-4 rounded-full bg-green-500"></div>;
  } else {
    return <div className="w-4 h-4 rounded-full bg-red-500"></div>;
  }
} 