/**
 * Script to set up Firebase for the Triviape application
 * 
 * This script guides you through the process of setting up Firebase
 * Run with: node scripts/setup-firebase.js
 */

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to check if Firebase CLI is installed
async function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if user is logged in to Firebase
async function checkFirebaseLogin() {
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to initialize Firebase
async function initializeFirebase() {
  console.log('\nInitializing Firebase...');
  
  // Check if firebase.json already exists
  if (fs.existsSync(path.resolve(process.cwd(), 'firebase.json'))) {
    const overwrite = await askQuestion('firebase.json already exists. Do you want to overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping Firebase initialization.');
      return;
    }
  }
  
  // Run Firebase init
  const firebaseInit = spawn('firebase', ['init'], {
    stdio: 'inherit',
    shell: true
  });
  
  return new Promise((resolve, reject) => {
    firebaseInit.on('error', (error) => {
      console.error('Failed to initialize Firebase:', error);
      reject(error);
    });
    
    firebaseInit.on('close', (code) => {
      if (code !== 0) {
        console.error(`Firebase initialization exited with code ${code}`);
        reject(new Error(`Firebase initialization exited with code ${code}`));
      } else {
        console.log('Firebase initialized successfully!');
        resolve();
      }
    });
  });
}

// Function to update environment variables
async function updateEnvironmentVariables() {
  console.log('\nUpdating environment variables...');
  
  // Check if .env.local exists
  const envPath = path.resolve(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Ask for Firebase configuration
  console.log('\nPlease enter your Firebase configuration:');
  console.log('(You can find this in your Firebase project settings)');
  
  const apiKey = await askQuestion('API Key: ');
  const authDomain = await askQuestion('Auth Domain: ');
  const projectId = await askQuestion('Project ID: ');
  const storageBucket = await askQuestion('Storage Bucket: ');
  const messagingSenderId = await askQuestion('Messaging Sender ID: ');
  const appId = await askQuestion('App ID: ');
  const measurementId = await askQuestion('Measurement ID (optional): ');
  
  // Update environment variables
  const firebaseConfig = `
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${measurementId}

# Firebase Emulators (for development)
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
USE_FIREBASE_EMULATOR=false
`;
  
  // Write to .env.local
  fs.writeFileSync(envPath, firebaseConfig + envContent.replace(/NEXT_PUBLIC_FIREBASE_.*=.*\n/g, ''));
  
  console.log('\nEnvironment variables updated successfully!');
}

// Function to verify Firestore collections
async function verifyFirestoreCollections() {
  console.log('\nVerifying Firestore collections...');
  
  // Run the verify-collections script
  const verifyCollections = spawn('node', [
    path.resolve(__dirname, 'db/verify-collections.js')
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  return new Promise((resolve, reject) => {
    verifyCollections.on('error', (error) => {
      console.error('Failed to verify Firestore collections:', error);
      reject(error);
    });
    
    verifyCollections.on('close', (code) => {
      if (code !== 0) {
        console.error(`Verification exited with code ${code}`);
        reject(new Error(`Verification exited with code ${code}`));
      } else {
        console.log('Firestore collections verified successfully!');
        resolve();
      }
    });
  });
}

// Function to start emulators and import sample data
async function startEmulatorsAndImportData() {
  console.log('\nStarting Firebase emulators and importing sample data...');
  
  // Ask if user wants to start emulators
  const startEmulators = await askQuestion('Do you want to start Firebase emulators and import sample data? (y/n): ');
  if (startEmulators.toLowerCase() !== 'y') {
    console.log('Skipping emulators and data import.');
    return;
  }
  
  // Run the start-emulators script
  const emulators = spawn('node', [
    path.resolve(__dirname, 'start-emulators.js')
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  // This will keep running until the user terminates it
  console.log('\nEmulators are now running. Press Ctrl+C to stop.');
}

// Main function
async function main() {
  console.log('=== Firebase Setup for Triviape ===');
  
  // Check if Firebase CLI is installed
  const hasCLI = await checkFirebaseCLI();
  if (!hasCLI) {
    console.error('Firebase CLI is not installed. Please run: npm install -g firebase-tools');
    process.exit(1);
  }
  
  // Check if user is logged in to Firebase
  const isLoggedIn = await checkFirebaseLogin();
  if (!isLoggedIn) {
    console.log('You are not logged in to Firebase. Please run: firebase login');
    process.exit(1);
  }
  
  // Initialize Firebase
  await initializeFirebase();
  
  // Update environment variables
  await updateEnvironmentVariables();
  
  // Verify Firestore collections
  await verifyFirestoreCollections();
  
  // Start emulators and import sample data
  await startEmulatorsAndImportData();
  
  // Close readline interface
  rl.close();
}

// Run the main function
main().catch((error) => {
  console.error('Error during setup:', error);
  rl.close();
  process.exit(1);
}); 