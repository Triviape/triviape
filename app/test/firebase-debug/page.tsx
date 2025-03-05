"use client";

import React, { useState, useEffect } from 'react';
import { getAuthInstance, getFirestoreDb } from '@/app/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

export default function FirebaseDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{[key: string]: {success: boolean, message: string}}>({
    auth: { success: false, message: 'Not tested' },
    firestore: { success: false, message: 'Not tested' },
    network: { success: false, message: 'Not tested' },
    testAuth: { success: false, message: 'Not tested' },
    proxy: { success: false, message: 'Not tested' }
  });

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const updateTestResult = (test: string, success: boolean, message: string) => {
    setTestResults(prev => ({
      ...prev,
      [test]: { success, message }
    }));
  };

  // Test network connectivity
  const testNetwork = async () => {
    addLog('Testing network connectivity...');
    try {
      const response = await fetch('https://www.google.com');
      if (response.ok) {
        addLog('Network test successful');
        updateTestResult('network', true, 'Connected');
      } else {
        addLog(`Network test failed with status: ${response.status}`);
        updateTestResult('network', false, `Failed with status: ${response.status}`);
      }
    } catch (error) {
      addLog(`Network test error: ${error instanceof Error ? error.message : String(error)}`);
      updateTestResult('network', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test Firebase Auth initialization
  const testAuth = async () => {
    addLog('Testing Firebase Auth initialization...');
    try {
      const auth = getAuthInstance();
      addLog(`Auth initialized: ${!!auth}`);
      updateTestResult('auth', true, 'Initialized');
    } catch (error) {
      addLog(`Auth initialization error: ${error instanceof Error ? error.message : String(error)}`);
      updateTestResult('auth', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test Firestore initialization
  const testFirestore = async () => {
    addLog('Testing Firestore initialization...');
    try {
      const db = getFirestoreDb();
      addLog(`Firestore initialized: ${!!db}`);
      
      // Try to read from Firestore
      try {
        const querySnapshot = await getDocs(collection(db, 'test-collection'));
        addLog(`Firestore read successful, documents: ${querySnapshot.size}`);
        updateTestResult('firestore', true, 'Connected');
      } catch (readError) {
        addLog(`Firestore read error: ${readError instanceof Error ? readError.message : String(readError)}`);
        // Still mark as success if it's just a permission error
        if (readError instanceof Error && readError.message.includes('permission-denied')) {
          updateTestResult('firestore', true, 'Initialized (permission denied)');
        } else {
          updateTestResult('firestore', false, `Read error: ${readError instanceof Error ? readError.message : String(readError)}`);
        }
      }
    } catch (error) {
      addLog(`Firestore initialization error: ${error instanceof Error ? error.message : String(error)}`);
      updateTestResult('firestore', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Test Firebase Auth operation
  const testAuthOperation = async () => {
    addLog('Testing Firebase Auth operation...');
    try {
      const auth = getAuthInstance();
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'Test123!';
      
      addLog(`Attempting to create test user: ${testEmail}`);
      try {
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        addLog('Test user created successfully');
        updateTestResult('testAuth', true, 'Success');
      } catch (authError) {
        addLog(`Auth operation error: ${authError instanceof Error ? authError.message : String(authError)}`);
        updateTestResult('testAuth', false, `Error: ${authError instanceof Error ? authError.message : String(authError)}`);
      }
    } catch (error) {
      addLog(`Auth test setup error: ${error instanceof Error ? error.message : String(error)}`);
      updateTestResult('testAuth', false, `Setup error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Add a new test for the Firebase proxy
  const testFirebaseProxy = async () => {
    addLog('Testing Firebase proxy...');
    try {
      // First check if the proxy is running
      const proxyCheckResponse = await fetch('/api/firebase-proxy');
      if (!proxyCheckResponse.ok) {
        addLog(`Proxy check failed with status: ${proxyCheckResponse.status}`);
        updateTestResult('proxy', false, `Failed with status: ${proxyCheckResponse.status}`);
        return;
      }
      
      addLog('Proxy is running, testing Firebase connection through proxy...');
      
      // Test Firebase Auth API through the proxy
      const proxyResponse = await fetch('/api/firebase-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: `proxy-test-${Date.now()}@example.com`,
            password: 'Test123!',
            returnSecureToken: true,
          },
        }),
      });
      
      const proxyData = await proxyResponse.json();
      
      if (proxyResponse.ok && proxyData.status === 200) {
        addLog('Firebase proxy test successful');
        updateTestResult('proxy', true, 'Connected');
      } else {
        addLog(`Firebase proxy test failed: ${JSON.stringify(proxyData)}`);
        updateTestResult('proxy', false, `Failed: ${proxyData.status} - ${proxyData.statusText}`);
      }
    } catch (error) {
      addLog(`Firebase proxy test error: ${error instanceof Error ? error.message : String(error)}`);
      updateTestResult('proxy', false, `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLogs([]);
    addLog('Starting all tests...');
    await testNetwork();
    await testAuth();
    await testFirestore();
    await testFirebaseProxy();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
          <div className="flex flex-col space-y-2">
            <Button onClick={runAllTests}>Run All Tests</Button>
            <Button onClick={testNetwork}>Test Network</Button>
            <Button onClick={testAuth}>Test Auth Initialization</Button>
            <Button onClick={testFirestore}>Test Firestore</Button>
            <Button onClick={testAuthOperation}>Test Auth Operation</Button>
            <Button onClick={testFirebaseProxy}>Test Firebase Proxy</Button>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-2">Test Results</h2>
          <div className="space-y-2">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{test}:</span>
                <span className="ml-2">{result.message}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <div className="bg-gray-100 p-2 rounded h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Run tests to see output.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
} 