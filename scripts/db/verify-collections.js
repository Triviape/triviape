/**
 * Script to verify and fix Firestore collections
 * 
 * This script checks if the collections exist with the correct capitalization
 * and creates them if they don't exist.
 * 
 * Run with: node scripts/db/verify-collections.js
 */

// Import Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get the absolute path to the service account key file
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          path.resolve(process.cwd(), 'triviape-cbc23-firebase-adminsdk-3otvm-770baa5b21.json');

// Check if we're using emulators
const useEmulators = process.env.USE_FIREBASE_EMULATORS === 'true' || 
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
      const [host, portStr] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
      const port = parseInt(portStr, 10);
      
      admin.firestore().settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false,
      });
      
      console.log(`Connected to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
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

// Define the collections we want to verify
const COLLECTIONS = {
  QUIZZES: 'Quizzes',
  QUESTIONS: 'Questions',
  CATEGORIES: 'Categories',
  QUIZ_ATTEMPTS: 'QuizAttempts',
  USERS: 'Users'
};

// Function to verify if a collection exists
async function verifyCollection(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).limit(1).get();
    if (snapshot.empty) {
      console.log(`Collection '${collectionName}' exists but is empty.`);
      return false;
    } else {
      console.log(`Collection '${collectionName}' exists and has data.`);
      return true;
    }
  } catch (error) {
    console.error(`Error verifying collection '${collectionName}':`, error);
    return false;
  }
}

// Function to create a sample document in a collection if it doesn't exist
async function createSampleDocument(collectionName) {
  try {
    const docRef = db.collection(collectionName).doc('sample');
    await docRef.set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      description: `Sample document for ${collectionName} collection`,
      isActive: true
    });
    console.log(`Created sample document in '${collectionName}' collection.`);
    return true;
  } catch (error) {
    console.error(`Error creating sample document in '${collectionName}':`, error);
    return false;
  }
}

// Function to check security rules
async function checkSecurityRules() {
  console.log('\nChecking security rules...');
  console.log('Note: Security rules cannot be directly checked from the Admin SDK.');
  console.log('Please verify your firestore.rules file contains the following:');
  console.log(`
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read all documents
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow users to read and write their own data
    match /Users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read quizzes, questions, and categories
    match /Quizzes/{quizId} {
      allow read: if request.auth != null;
    }
    
    match /Questions/{questionId} {
      allow read: if request.auth != null;
    }
    
    match /Categories/{categoryId} {
      allow read: if request.auth != null;
    }
    
    // Allow users to create and read their own quiz attempts
    match /QuizAttempts/{attemptId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
  `);
}

// Main function to verify all collections
async function verifyAllCollections() {
  console.log('Verifying Firestore collections...');
  
  for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
    console.log(`\nChecking collection: ${collectionName}`);
    const exists = await verifyCollection(collectionName);
    
    if (!exists) {
      console.log(`Creating sample document in '${collectionName}' collection...`);
      await createSampleDocument(collectionName);
    }
  }
  
  // Check security rules
  await checkSecurityRules();
  
  console.log('\nVerification complete!');
  console.log('\nNext steps:');
  console.log('1. Run the add-quiz.js script to populate your collections with sample data');
  console.log('2. Update your security rules if needed');
  console.log('3. Verify the collections in the Firebase Console');
}

// Run the verification
verifyAllCollections()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running verification script:', error);
    process.exit(1);
  }); 