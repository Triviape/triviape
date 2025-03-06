#!/usr/bin/env node

/**
 * Script to start both Firebase emulators and Next.js dev server
 * with automatic sample user creation
 * 
 * Run with: node scripts/dev-with-emulators.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set environment variables for emulators
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
process.env.USE_FIREBASE_EMULATOR = 'true';

// Create .emulator-data directory if it doesn't exist
const emulatorDataDir = path.resolve(__dirname, '../.emulator-data');
if (!fs.existsSync(emulatorDataDir)) {
  fs.mkdirSync(emulatorDataDir, { recursive: true });
}

// Start emulators with persistence
console.log('🔥 Starting Firebase emulators with persistence...');
const emulators = spawn('firebase', [
  'emulators:start',
  '--project=triviape-cbc23',
  '--only', 'auth,firestore,storage',
  '--import=.emulator-data',
  '--export-on-exit=.emulator-data'
], {
  stdio: 'inherit',
  shell: true
});

// Handle emulator process errors
emulators.on('error', (error) => {
  console.error('Failed to start emulators:', error);
  process.exit(1);
});

// Wait for emulators to start before creating sample users
setTimeout(() => {
  console.log('🧑‍🦱 Creating sample users...');
  const createUsers = spawn('node', [
    path.resolve(__dirname, 'create-sample-users.js')
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  createUsers.on('error', (error) => {
    console.error('Failed to create sample users:', error);
  });
  
  // Wait for sample users to be created before starting dev server
  createUsers.on('close', (code) => {
    if (code !== 0) {
      console.warn(`⚠️ Sample users creation exited with code ${code}`);
    }
    
    // Start Next.js development server
    console.log('🚀 Starting Next.js development server...');
    const nextDev = spawn('next', ['dev', '--port', '3030'], {
      stdio: 'inherit',
      shell: true
    });
    
    nextDev.on('error', (error) => {
      console.error('Failed to start Next.js dev server:', error);
      process.exit(1);
    });
    
    nextDev.on('close', (code) => {
      if (code !== 0) {
        console.error(`Next.js dev server exited with code ${code}`);
      }
      // Kill emulators when dev server is closed
      emulators.kill();
      process.exit(code);
    });
  });
}, 10000); // Wait 10 seconds for emulators to start

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping all processes...');
  emulators.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Stopping all processes...');
  emulators.kill('SIGTERM');
  process.exit();
}); 