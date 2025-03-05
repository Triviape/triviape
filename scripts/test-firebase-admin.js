#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

// Set environment for emulators
process.env.USE_FIREBASE_EMULATOR = 'true';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:11001';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:11002';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:11003';

// Import required modules
const admin = require('firebase-admin');
const http = require('http');

/**
 * Check if a specific emulator is available by attempting to connect to it
 * @param {string} host The host address (e.g., 'localhost')
 * @param {number} port The port number
 * @returns {Promise<boolean>} Promise that resolves to true if the emulator is available, false otherwise
 */
async function isEmulatorAvailable(host, port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: host,
        port: port,
        method: 'HEAD',
        timeout: 1000, // 1 second timeout
      },
      (res) => {
        // Any response means the emulator is running
        resolve(true);
      }
    );

    req.on('error', () => {
      // If request fails, the emulator is probably not running
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Check if all required emulators are available
 * @returns {Promise<boolean>} Promise that resolves to true if all emulators are available, false otherwise
 */
async function areEmulatorsAvailable() {
  try {
    // Get emulator hosts from environment variables
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:11001';
    const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:11002';
    const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:11003';
    
    // Parse hosts
    const authParts = authEmulatorHost.split(':');
    const firestoreParts = firestoreEmulatorHost.split(':');
    const storageParts = storageEmulatorHost.split(':');
    
    const auth = { host: authParts[0], port: parseInt(authParts[1], 10) };
    const firestore = { host: firestoreParts[0], port: parseInt(firestoreParts[1], 10) };
    const storage = { host: storageParts[0], port: parseInt(storageParts[1], 10) };
    
    // Check if all emulators are available
    const [authAvailable, firestoreAvailable, storageAvailable] = await Promise.all([
      isEmulatorAvailable(auth.host, auth.port),
      isEmulatorAvailable(firestore.host, firestore.port),
      isEmulatorAvailable(storage.host, storage.port)
    ]);
    
    return authAvailable && firestoreAvailable && storageAvailable;
  } catch (error) {
    console.error('Error checking emulator availability:', error);
    return false;
  }
}

// Initialize Firebase Admin with minimal config for emulators
async function initializeAndTest() {
  try {
    // Check if emulators are available
    const emulatorsAvailable = await areEmulatorsAvailable();
    
    if (!emulatorsAvailable) {
      console.error('❌ Firebase emulators are not running!');
      console.error('Please start the emulators with: npm run emulators');
      process.exit(1);
    }
    
    console.log('✅ Firebase emulators are running');
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
      });
      
      console.log('Firebase Admin initialized for emulators');
      
      // Configure Firestore emulator
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        admin.firestore().settings({
          host: process.env.FIRESTORE_EMULATOR_HOST,
          ssl: false
        });
        console.log(`Connected to Firestore emulator at: ${process.env.FIRESTORE_EMULATOR_HOST}`);
      }
    }
    
    // Run the tests
    await testFirebaseAdmin();
  } catch (error) {
    console.error('Error in initialization or testing:', error);
    process.exit(1);
  }
}

// Test Firebase Admin functionality
async function testFirebaseAdmin() {
  try {
    // Test Firestore
    console.log('Testing Firestore...');
    const db = admin.firestore();
    const testDoc = await db.collection('test').doc('test-doc').set({
      message: 'Hello from Firebase Admin',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Successfully wrote to Firestore');
    
    // Test Auth
    console.log('Testing Auth...');
    try {
      // Try to create a test user (may fail if user already exists)
      const userRecord = await admin.auth().createUser({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      });
      console.log('✅ Successfully created test user:', userRecord.uid);
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        console.log('✅ Test user already exists (this is fine)');
      } else {
        throw authError;
      }
    }
    
    console.log('All Firebase Admin tests passed!');
  } catch (error) {
    console.error('Error testing Firebase Admin:', error);
    process.exit(1);
  }
}

// Run the initialization and tests
initializeAndTest(); 