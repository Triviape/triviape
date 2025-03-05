#!/usr/bin/env node

/**
 * Comprehensive setup script for Triviape
 * 
 * This script will:
 * 1. Check if Firebase emulators are installed
 * 2. Start the Firebase emulators if they're not already running
 * 3. Verify that all required Firestore collections exist
 * 4. Import sample quiz data
 * 5. Import additional quiz data
 * 
 * Usage: npm run setup:all
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env.local file found. Creating one from .env.local.example...');
  try {
    const exampleEnvPath = path.resolve(process.cwd(), '.env.local.example');
    if (fs.existsSync(exampleEnvPath)) {
      fs.copyFileSync(exampleEnvPath, envPath);
      console.log('Created .env.local file from example.');
      dotenv.config({ path: envPath });
    } else {
      console.warn('No .env.local.example file found. You will need to create a .env.local file manually.');
    }
  } catch (error) {
    console.error('Error creating .env.local file:', error);
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if a port is in use
function isPortInUse(port) {
  try {
    execSync(`lsof -i:${port} -t`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to check if emulators are running
function checkEmulatorsRunning() {
  // Check if Firestore emulator is running (port 8080)
  const firestoreRunning = isPortInUse(8080);
  // Check if Auth emulator is running (port 9099)
  const authRunning = isPortInUse(9099);
  // Check if Storage emulator is running (port 9199)
  const storageRunning = isPortInUse(9199);
  
  return firestoreRunning && authRunning && storageRunning;
}

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to run an npm script
async function runNpmScript(scriptName) {
  try {
    await runCommand('npm', ['run', scriptName]);
    return true;
  } catch (error) {
    console.error(`Error running npm script ${scriptName}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Triviape Setup Script ===');
  
  // Check if Firebase CLI is installed
  if (!commandExists('firebase')) {
    console.log('Firebase CLI is not installed. Installing...');
    try {
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('Firebase CLI installed successfully.');
    } catch (error) {
      console.error('Failed to install Firebase CLI:', error.message);
      console.log('Please install Firebase CLI manually: npm install -g firebase-tools');
      process.exit(1);
    }
  } else {
    console.log('Firebase CLI is already installed.');
  }
  
  // Check if Firebase emulators are running
  if (!checkEmulatorsRunning()) {
    console.log('Firebase emulators are not running. Starting them...');
    
    // Start emulators in a separate process
    const emulatorProcess = spawn('npm', ['run', 'firebase:start-emulators'], {
      detached: true,
      stdio: 'inherit'
    });
    
    // Wait for emulators to start
    console.log('Waiting for emulators to start...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (!checkEmulatorsRunning()) {
      console.error('Failed to start Firebase emulators. Please start them manually: npm run firebase:start-emulators');
      process.exit(1);
    }
    
    console.log('Firebase emulators started successfully.');
  } else {
    console.log('Firebase emulators are already running.');
  }
  
  // Verify Firestore collections
  console.log('\n=== Verifying Firestore Collections ===');
  const verifySuccess = await runNpmScript('firebase:verify');
  if (!verifySuccess) {
    console.warn('Failed to verify Firestore collections. Continuing anyway...');
  }
  
  // Import basic quiz data
  console.log('\n=== Importing Basic Quiz Data ===');
  const importSuccess = await runNpmScript('firebase:import-data');
  if (!importSuccess) {
    console.warn('Failed to import basic quiz data. Continuing anyway...');
  }
  
  // Import additional quiz data
  console.log('\n=== Importing Additional Quiz Data ===');
  const importAdditionalSuccess = await runNpmScript('firebase:import-additional-data');
  if (!importAdditionalSuccess) {
    console.warn('Failed to import additional quiz data. Continuing anyway...');
  }
  
  console.log('\n=== Setup Complete ===');
  console.log('Your Triviape development environment is now set up!');
  console.log('\nNext steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Access the Firebase Emulator UI at http://localhost:4000');
  
  // Close readline interface
  rl.close();
  
  // Exit successfully
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
}); 