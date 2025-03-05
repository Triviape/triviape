/**
 * Script to start Firebase emulators and import sample data
 * 
 * This script starts the Firebase emulators and imports sample data
 * Run with: node scripts/start-emulators.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if firebase-tools is installed
try {
  require.resolve('firebase-tools');
} catch (e) {
  console.error('Firebase Tools is not installed. Please run: npm install -g firebase-tools');
  process.exit(1);
}

// Check if the quizzes.json file exists
const quizDataPath = path.resolve(__dirname, 'db/quizzes.json');
if (!fs.existsSync(quizDataPath)) {
  console.error(`Quiz data file not found at ${quizDataPath}`);
  console.error('Please make sure the file exists before running this script.');
  process.exit(1);
}

// Set environment variables for emulators
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
process.env.USE_FIREBASE_EMULATOR = 'true';

// Function to start the emulators
function startEmulators() {
  console.log('Starting Firebase emulators...');
  
  // Create a directory for emulator data if it doesn't exist
  const emulatorDataDir = path.resolve(__dirname, '../.emulator-data');
  if (!fs.existsSync(emulatorDataDir)) {
    fs.mkdirSync(emulatorDataDir, { recursive: true });
  }
  
  // Start the emulators with data import
  const emulators = spawn('firebase', [
    'emulators:start',
    '--import=.emulator-data',
    '--export-on-exit=.emulator-data'
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  emulators.on('error', (error) => {
    console.error('Failed to start emulators:', error);
    process.exit(1);
  });
  
  emulators.on('close', (code) => {
    if (code !== 0) {
      console.error(`Emulators exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Stopping emulators...');
    emulators.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Stopping emulators...');
    emulators.kill('SIGTERM');
  });
}

// Function to import sample data
function importSampleData() {
  console.log('Importing sample data...');
  
  // Wait for emulators to start before importing data
  setTimeout(() => {
    const importProcess = spawn('node', [
      path.resolve(__dirname, 'db/add-quiz.js')
    ], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        USE_FIREBASE_EMULATORS: 'true',
        FIRESTORE_EMULATOR_HOST: 'localhost:8080'
      }
    });
    
    importProcess.on('error', (error) => {
      console.error('Failed to import sample data:', error);
    });
    
    importProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Import process exited with code ${code}`);
      } else {
        console.log('Sample data imported successfully!');
        console.log('\nFirebase Emulators are running:');
        console.log('- Firestore: http://localhost:8080');
        console.log('- Auth: http://localhost:9099');
        console.log('- Storage: http://localhost:9199');
        console.log('- Emulator UI: http://localhost:4000');
        console.log('\nYou can now run your application with:');
        console.log('npm run dev');
      }
    });
  }, 5000); // Wait 5 seconds for emulators to start
}

// Start the emulators and import sample data
startEmulators();
importSampleData(); 