'use client';

import { useState, useEffect } from 'react';
import { getAuthInstance, getFirestoreDb, getStorageInstance, getFunctionsInstance } from '@/app/lib/firebase';
import { checkFirebaseAuthConnectivity } from '@/app/lib/authErrorHandler';
import { UserService } from '@/app/lib/services/userService';

// Define NetworkInformation interface for TypeScript
interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  [key: string]: any;
}

// Extend Navigator interface to include connection property
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

export default function FirebaseDiagnosticsPage() {
  const [diagnosticResults, setDiagnosticResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('Test123!');
  const [testResult, setTestResult] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInformation | null>(null);

  useEffect(() => {
    async function runDiagnostics() {
      setIsLoading(true);
      try {
        // Collect diagnostic information
        const results: Record<string, any> = {};
        
        // Check Firebase Auth connectivity
        results.authConnectivity = await checkFirebaseAuthConnectivity();
        
        // Check Firebase services initialization
        results.servicesInitialized = {
          auth: !!getAuthInstance(),
          firestore: !!getFirestoreDb(),
          storage: !!getStorageInstance(),
          functions: !!getFunctionsInstance(),
        };
        
        // Check environment variables (without exposing sensitive values)
        results.environmentVariables = {
          apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          measurementId: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
        };
        
        // Check network connectivity
        results.networkConnectivity = {
          online: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        };
        
        // Get network information if available
        if (typeof navigator !== 'undefined' && navigator.connection) {
          setNetworkInfo(navigator.connection);
        }
        
        setDiagnosticResults(results);
      } catch (error) {
        console.error('Error running diagnostics:', error);
        setDiagnosticResults({ error: String(error) });
      } finally {
        setIsLoading(false);
      }
    }
    
    runDiagnostics();
  }, []);
  
  const runAuthTest = async (type: 'signIn' | 'signUp') => {
    setTestResult(null);
    try {
      setIsLoading(true);
      
      // Record start time for performance measurement
      const startTime = performance.now();
      
      let result;
      if (type === 'signIn') {
        result = await UserService.signInWithEmail(testEmail, testPassword);
      } else {
        result = await UserService.registerWithEmail(testEmail, testPassword, 'Test User');
      }
      
      // Calculate operation duration
      const duration = performance.now() - startTime;
      
      setTestResult({
        success: true,
        operation: type,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          emailVerified: result.user.emailVerified,
        },
        performanceMs: Math.round(duration),
      });
      
      // Sign out after successful test
      await UserService.signOut();
    } catch (error: any) {
      console.error(`Error during ${type}:`, error);
      
      setTestResult({
        success: false,
        operation: type,
        errorCode: error.code,
        errorMessage: error.message,
        stack: error.stack,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const testFirebaseEndpoints = async () => {
    setIsLoading(true);
    try {
      const results: Record<string, any> = {};
      
      // Test Firebase Auth endpoints
      const authEndpoints = [
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp',
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
        'https://securetoken.googleapis.com/v1/token',
      ];
      
      for (const endpoint of authEndpoints) {
        try {
          const startTime = performance.now();
          const response = await fetch(endpoint, {
            method: 'HEAD',
            mode: 'no-cors' as RequestMode,
          });
          const duration = performance.now() - startTime;
          
          results[endpoint] = {
            reachable: true,
            latencyMs: Math.round(duration),
          };
        } catch (error) {
          results[endpoint] = {
            reachable: false,
            error: String(error),
          };
        }
      }
      
      setTestResult({
        ...testResult,
        endpointTests: results,
      });
    } catch (error) {
      console.error('Error testing endpoints:', error);
      setTestResult({
        ...testResult,
        endpointTests: { error: String(error) },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Firebase Authentication Diagnostics</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Diagnostic Results */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
              {JSON.stringify(diagnosticResults, null, 2)}
            </pre>
          </div>
          
          {/* Network Information */}
          {networkInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Network Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Connection Type:</p>
                  <p>{networkInfo.effectiveType || 'Unknown'}</p>
                </div>
                <div>
                  <p className="font-medium">Downlink:</p>
                  <p>{networkInfo.downlink ? `${networkInfo.downlink} Mbps` : 'Unknown'}</p>
                </div>
                <div>
                  <p className="font-medium">Round Trip Time:</p>
                  <p>{networkInfo.rtt ? `${networkInfo.rtt} ms` : 'Unknown'}</p>
                </div>
                <div>
                  <p className="font-medium">Data Saver:</p>
                  <p>{networkInfo.saveData ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Test Authentication */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Password</label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => runAuthTest('signIn')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Test Sign In
                </button>
                <button
                  onClick={() => runAuthTest('signUp')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Test Sign Up
                </button>
                <button
                  onClick={testFirebaseEndpoints}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  Test Endpoints
                </button>
              </div>
            </div>
          </div>
          
          {/* Test Results */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Troubleshooting Tips */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Check if your device has a stable internet connection</li>
              <li>Verify that your Firebase project is properly configured</li>
              <li>Ensure that Authentication is enabled in your Firebase console</li>
              <li>Check if your Firebase API key is correct and not restricted</li>
              <li>Verify that your auth domain is properly set and authorized</li>
              <li>Check for any browser extensions that might be blocking requests</li>
              <li>Try using a different network or disabling VPN if you're using one</li>
              <li>Clear browser cache and cookies</li>
              <li>Check if Firebase services are experiencing any outages</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 