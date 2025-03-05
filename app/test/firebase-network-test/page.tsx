'use client';

import { useState, useEffect } from 'react';
import { FirebaseError } from 'firebase/app';
import { getAuthInstance } from '@/app/lib/firebase';
import { retryAuthOperation } from '@/app/lib/authErrorHandler';

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

export default function FirebaseNetworkTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInformation | null>(null);
  const [testInProgress, setTestInProgress] = useState(false);

  useEffect(() => {
    // Get network information if available
    if (typeof navigator !== 'undefined' && navigator.connection) {
      setNetworkInfo(navigator.connection);
      
      // Listen for network changes
      const handleNetworkChange = () => {
        setNetworkInfo({...navigator.connection!});
      };
      
      // Safe access to navigator.connection with optional chaining
      navigator.connection?.addEventListener('change', handleNetworkChange);
      
      return () => {
        // Safe access to navigator.connection with optional chaining
        navigator.connection?.removeEventListener('change', handleNetworkChange);
      };
    }
  }, []);
  
  // Test Firebase Auth endpoints with different fetch configurations
  const testFirebaseEndpoints = async () => {
    setIsLoading(true);
    setTestInProgress(true);
    
    try {
      const results: any[] = [];
      
      // Firebase Auth endpoints to test
      const endpoints = [
        'https://identitytoolkit.googleapis.com/v1/accounts:signUp',
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
        'https://securetoken.googleapis.com/v1/token',
        'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo',
      ];
      
      // Different fetch configurations to test with proper TypeScript types
      const fetchConfigs = [
        { 
          name: 'Standard fetch',
          config: { 
            method: 'HEAD',
            mode: 'no-cors' as RequestMode,
          }
        },
        { 
          name: 'With credentials',
          config: { 
            method: 'HEAD',
            mode: 'no-cors' as RequestMode,
            credentials: 'include' as RequestCredentials,
          }
        },
        { 
          name: 'With timeout (2s)',
          config: { 
            method: 'HEAD',
            mode: 'no-cors' as RequestMode,
            signal: AbortSignal.timeout(2000),
          }
        },
      ];
      
      // Test each endpoint with each configuration
      for (const endpoint of endpoints) {
        for (const { name, config } of fetchConfigs) {
          try {
            const startTime = performance.now();
            const response = await fetch(endpoint, config);
            const duration = performance.now() - startTime;
            
            results.push({
              endpoint,
              config: name,
              success: true,
              status: response.status,
              statusText: response.statusText,
              latencyMs: Math.round(duration),
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            results.push({
              endpoint,
              config: name,
              success: false,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
      
      // Test with retry mechanism
      try {
        const startTime = performance.now();
        await retryAuthOperation(async () => {
          const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp', {
            method: 'HEAD',
            mode: 'no-cors' as RequestMode,
          });
          return response;
        }, 2);
        const duration = performance.now() - startTime;
        
        results.push({
          endpoint: 'https://identitytoolkit.googleapis.com/v1/accounts:signUp',
          config: 'With retry mechanism',
          success: true,
          latencyMs: Math.round(duration),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          endpoint: 'https://identitytoolkit.googleapis.com/v1/accounts:signUp',
          config: 'With retry mechanism',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error testing endpoints:', error);
    } finally {
      setIsLoading(false);
      setTestInProgress(false);
    }
  };
  
  // Test Firebase Auth initialization
  const testFirebaseAuth = async () => {
    setIsLoading(true);
    setTestInProgress(true);
    
    try {
      const results: any[] = [];
      
      // Test 1: Check if Auth is initialized
      try {
        const startTime = performance.now();
        const auth = getAuthInstance();
        const duration = performance.now() - startTime;
        
        results.push({
          test: 'Auth initialization',
          success: !!auth,
          latencyMs: Math.round(duration),
          details: auth ? 'Auth instance retrieved successfully' : 'Failed to get Auth instance',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          test: 'Auth initialization',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
      
      // Test 2: Check current user (cached)
      try {
        const auth = getAuthInstance();
        if (auth) {
          const startTime = performance.now();
          const currentUser = auth.currentUser;
          const duration = performance.now() - startTime;
          
          results.push({
            test: 'Get current user',
            success: true,
            latencyMs: Math.round(duration),
            details: currentUser ? 'User is signed in' : 'No user is signed in',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        results.push({
          test: 'Get current user',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error testing Firebase Auth:', error);
    } finally {
      setIsLoading(false);
      setTestInProgress(false);
    }
  };
  
  // Test network connectivity
  const testNetworkConnectivity = async () => {
    setIsLoading(true);
    setTestInProgress(true);
    
    try {
      const results: any[] = [];
      
      // Test common websites for connectivity
      const websites = [
        'https://www.google.com',
        'https://www.cloudflare.com',
        'https://www.firebase.google.com',
        'https://www.github.com',
      ];
      
      for (const site of websites) {
        try {
          const startTime = performance.now();
          const response = await fetch(site, {
            method: 'HEAD',
            mode: 'no-cors' as RequestMode,
            cache: 'no-store',
          });
          const duration = performance.now() - startTime;
          
          results.push({
            site,
            success: true,
            latencyMs: Math.round(duration),
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          results.push({
            site,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
        }
      }
      
      // Test DNS resolution using a special service
      try {
        const startTime = performance.now();
        const response = await fetch('https://cloudflare-dns.com/dns-query?name=firebase.google.com&type=A', {
          headers: {
            'Accept': 'application/dns-json',
          },
        });
        const data = await response.json();
        const duration = performance.now() - startTime;
        
        results.push({
          test: 'DNS resolution',
          success: true,
          latencyMs: Math.round(duration),
          details: data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          test: 'DNS resolution',
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });
      }
      
      setTestResults(results);
    } catch (error) {
      console.error('Error testing network connectivity:', error);
    } finally {
      setIsLoading(false);
      setTestInProgress(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Firebase Network Connectivity Tests</h1>
      
      {/* Network Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Network Information</h2>
        {networkInfo ? (
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
            <div>
              <p className="font-medium">Online Status:</p>
              <p>{navigator.onLine ? 'Online' : 'Offline'}</p>
            </div>
          </div>
        ) : (
          <p>Network information not available in this browser.</p>
        )}
      </div>
      
      {/* Test Controls */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Network Tests</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={testFirebaseEndpoints}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Firebase Endpoints
          </button>
          <button
            onClick={testFirebaseAuth}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Firebase Auth
          </button>
          <button
            onClick={testNetworkConnectivity}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test General Connectivity
          </button>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {testInProgress && (
        <div className="flex items-center justify-center my-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Running tests...</span>
        </div>
      )}
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              >
                <h3 className="font-medium">
                  {result.test || result.endpoint || result.site || 'Test'} 
                  {result.config && ` (${result.config})`}
                </h3>
                <div className="mt-2 text-sm">
                  {result.success ? (
                    <div>
                      <p className="text-green-700">Success</p>
                      {result.latencyMs && <p>Latency: {result.latencyMs}ms</p>}
                      {result.details && <p>Details: {typeof result.details === 'object' ? JSON.stringify(result.details) : result.details}</p>}
                    </div>
                  ) : (
                    <p className="text-red-700">Error: {result.error}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Troubleshooting Tips */}
      <div className="bg-blue-50 p-4 rounded-lg mt-6">
        <h2 className="text-xl font-semibold mb-4">Network Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>If Firebase endpoints fail but general connectivity works, there might be a Firebase service issue</li>
          <li>If all tests fail, check your internet connection or try a different network</li>
          <li>Slow response times (high latency) can cause timeout errors</li>
          <li>Try disabling any VPN, proxy, or firewall that might be blocking requests</li>
          <li>Some corporate or school networks block Firebase services</li>
          <li>Check if your browser extensions are blocking requests</li>
          <li>Try using a different browser to isolate browser-specific issues</li>
          <li>Clear your browser cache and cookies</li>
          <li>If on mobile, try switching between Wi-Fi and cellular data</li>
        </ul>
      </div>
    </div>
  );
} 