#!/usr/bin/env node

/**
 * Script to add sample user data to Firestore
 * 
 * This script reads user data from sample-users.json and adds it to Firestore
 * Run with: node scripts/db/add-sample-users.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
}

// Get the absolute path to the service account key file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          path.resolve(process.cwd(), 'service-account-key.json');

// Check if we're using emulators
const useEmulators = process.env.USE_FIREBASE_EMULATOR === 'true' || 
                    process.env.FIRESTORE_EMULATOR_HOST !== undefined;

// Initialize Firebase Admin
let app;
try {
  if (useEmulators) {
    // For emulators, we can initialize with minimal config
    app = admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
    });
    
    // Connect to Firestore emulator if host is defined
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      admin.firestore().settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
      });
      
      console.log(`Connected to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
    
    // Connect to Auth emulator if host is defined
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
      console.log(`Connected to Auth emulator at ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    }
  } else {
    // Check if service account file exists
    if (fs.existsSync(serviceAccountPath)) {
      // Initialize with service account
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
    } else {
      // Try to use application default credentials
      app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
      });
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Get Firestore instance
const db = admin.firestore();

// Read user data from JSON file
const userDataPath = path.resolve(__dirname, 'sample-users.json');
let userData;

try {
  const rawData = fs.readFileSync(userDataPath, 'utf8');
  userData = JSON.parse(rawData);
} catch (error) {
  console.error(`Error reading user data from ${userDataPath}:`, error);
  process.exit(1);
}

// Function to add users to Firestore
async function addUsers() {
  const { users } = userData;
  const batch = db.batch();
  
  console.log(`Adding ${Object.keys(users).length} users to Firestore...`);
  
  for (const [id, user] of Object.entries(users)) {
    const docRef = db.collection('Users').doc(id);
    batch.set(docRef, user);
    console.log(`Added user: ${user.displayName} (${id})`);
  }
  
  try {
    await batch.commit();
    console.log('Successfully added all users to Firestore!');
  } catch (error) {
    console.error('Error adding users to Firestore:', error);
  }
}

// Function to add user stats to Firestore
async function addUserStats() {
  const { userStats } = userData;
  const batch = db.batch();
  
  console.log(`Adding ${Object.keys(userStats).length} user stats to Firestore...`);
  
  for (const [id, stats] of Object.entries(userStats)) {
    const docRef = db.collection('UserStats').doc(id);
    batch.set(docRef, stats);
    console.log(`Added stats for user: ${id}`);
  }
  
  try {
    await batch.commit();
    console.log('Successfully added all user stats to Firestore!');
  } catch (error) {
    console.error('Error adding user stats to Firestore:', error);
  }
}

// Function to add quiz attempts to Firestore
async function addQuizAttempts() {
  const { quizAttempts } = userData;
  const batch = db.batch();
  
  console.log(`Adding ${Object.keys(quizAttempts).length} quiz attempts to Firestore...`);
  
  for (const [id, attempt] of Object.entries(quizAttempts)) {
    const docRef = db.collection('QuizAttempts').doc(id);
    batch.set(docRef, attempt);
    console.log(`Added quiz attempt: ${id}`);
  }
  
  try {
    await batch.commit();
    console.log('Successfully added all quiz attempts to Firestore!');
  } catch (error) {
    console.error('Error adding quiz attempts to Firestore:', error);
  }
}

// Function to create Firebase Authentication users
async function createAuthUsers() {
  const { users } = userData;
  
  console.log(`Creating ${Object.keys(users).length} authentication users...`);
  
  // Only create auth users if using emulators
  if (!useEmulators) {
    console.log('Skipping auth user creation in production mode');
    return;
  }
  
  // Check if Auth emulator is configured
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log('Auth emulator host not configured, skipping auth user creation');
    return;
  }
  
  const auth = admin.auth();
  
  for (const [id, user] of Object.entries(users)) {
    try {
      // Check if user already exists
      try {
        await auth.getUser(id);
        console.log(`Auth user ${user.email} already exists, skipping creation`);
        continue;
      } catch (error) {
        // User doesn't exist, proceed with creation
        if (error.code !== 'auth/user-not-found') {
          console.error(`Error checking if user ${user.email} exists:`, error);
          continue;
        }
      }
      
      // Create the user
      await auth.createUser({
        uid: id,
        email: user.email,
        password: 'password123', // Simple password for test users
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: true,
      });
      
      console.log(`Created auth user: ${user.email} (${id})`);
    } catch (error) {
      console.error(`Error creating auth user ${user.email}:`, error);
    }
  }
  
  console.log('Finished creating authentication users');
}

// Main function to run all operations
async function main() {
  try {
    // Try to create auth users, but continue even if it fails
    try {
      await createAuthUsers();
    } catch (error) {
      console.error('Error creating auth users, continuing with other operations:', error);
    }
    
    await addUsers();
    await addUserStats();
    await addQuizAttempts();
    
    console.log('All sample user data has been successfully added to Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 