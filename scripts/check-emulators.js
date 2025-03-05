#!/usr/bin/env node

/**
 * Script to check if Firebase emulators are running correctly
 * 
 * This script checks if the Firebase emulators are running and accessible
 * Run with: node scripts/check-emulators.js
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
}

// Define the emulators to check
const emulators = [
  { name: 'Firestore', host: 'localhost', port: 8080 },
  { name: 'Authentication', host: 'localhost', port: 9099 },
  { name: 'Storage', host: 'localhost', port: 9199 },
  { name: 'Emulator UI', host: 'localhost', port: 4000 }
];

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Function to check if an emulator is running
async function checkEmulator(emulator) {
  console.log(`Checking ${emulator.name} emulator on ${emulator.host}:${emulator.port}...`);
  
  try {
    // Use a more direct approach to check if the port is in use
    try {
      const result = execSync(`lsof -i :${emulator.port} | grep LISTEN`, { encoding: 'utf8' });
      if (result && result.trim()) {
        console.log(`✅ ${emulator.name} emulator is running (Port ${emulator.port} is in use)`);
        return true;
      }
    } catch (error) {
      // If lsof command fails or returns nothing, the port is not in use
    }
    
    const inUse = await isPortInUse(emulator.port);
    
    if (inUse) {
      // Try to make a request to the emulator
      const options = {
        hostname: emulator.host,
        port: emulator.port,
        path: '/',
        method: 'GET',
        timeout: 2000
      };
      
      return new Promise((resolve) => {
        const req = http.request(options, (res) => {
          console.log(`✅ ${emulator.name} emulator is running (Status: ${res.statusCode})`);
          resolve(true);
        });
        
        req.on('error', (error) => {
          console.log(`❌ ${emulator.name} emulator port is in use, but not responding correctly`);
          console.log(`   Error: ${error.message}`);
          resolve(false);
        });
        
        req.on('timeout', () => {
          console.log(`❌ ${emulator.name} emulator request timed out`);
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    } else {
      console.log(`❌ ${emulator.name} emulator is not running`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking ${emulator.name} emulator: ${error.message}`);
    return false;
  }
}

// Function to check Firebase CLI version
function checkFirebaseCLI() {
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log(`Firebase CLI version: ${version}`);
    return true;
  } catch (error) {
    console.log('❌ Firebase CLI is not installed or not in PATH');
    console.log('   Please install it with: npm install -g firebase-tools');
    return false;
  }
}

// Function to check environment variables
function checkEnvironmentVariables() {
  console.log('\nChecking environment variables...');
  
  // Check if we're using emulators
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' || 
                     process.env.USE_FIREBASE_EMULATOR === 'true';
  
  if (useEmulator) {
    console.log('✅ Using Firebase emulators, skipping Firebase configuration check');
    console.log(`   NEXT_PUBLIC_USE_FIREBASE_EMULATOR: ${process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR || 'not set'}`);
    console.log(`   USE_FIREBASE_EMULATOR: ${process.env.USE_FIREBASE_EMULATOR || 'not set'}`);
    return true;
  }
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('   Please check your .env.local file');
    return false;
  } else {
    console.log('✅ All required environment variables are set');
    
    // Check emulator flags
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
    console.log(`   NEXT_PUBLIC_USE_FIREBASE_EMULATOR: ${useEmulator ? '✅ true' : '❌ false'}`);
    
    return true;
  }
}

// Main function
async function main() {
  console.log('=== Firebase Emulator Check ===\n');
  
  // Check Firebase CLI
  const cliInstalled = checkFirebaseCLI();
  if (!cliInstalled) {
    process.exit(1);
  }
  
  // Check environment variables
  checkEnvironmentVariables();
  
  // Check each emulator
  console.log('\nChecking emulators...');
  const results = await Promise.all(emulators.map(checkEmulator));
  const allRunning = results.every(result => result);
  
  console.log('\nSummary:');
  if (allRunning) {
    console.log('✅ All emulators are running correctly');
    console.log('\nYou can access the Emulator UI at: http://localhost:4000');
    process.exit(0);
  } else {
    console.log('❌ Some emulators are not running correctly');
    console.log('\nTo start the emulators, run:');
    console.log('npm run firebase:start-emulators');
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Error checking emulators:', error);
  process.exit(1);
}); 