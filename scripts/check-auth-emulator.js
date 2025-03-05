#!/usr/bin/env node

/**
 * Script to check if the Auth emulator is properly configured
 * 
 * This script checks if the Auth emulator is running and if the environment
 * variables are properly configured. If not, it will update the .env.local file.
 * 
 * Run with: node scripts/check-auth-emulator.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const http = require('http');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  dotenv.config({ path: envPath });
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

// Function to check if the Auth emulator is running
function checkAuthEmulator() {
  const authPort = 9099; // Default Auth emulator port
  
  if (!isPortInUse(authPort)) {
    console.log(`❌ Auth emulator is not running on port ${authPort}`);
    return false;
  }
  
  // Try to connect to the Auth emulator
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${authPort}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // If we get a response, the emulator is running
        console.log(`✅ Auth emulator is running on port ${authPort}`);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Failed to connect to Auth emulator: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`❌ Connection to Auth emulator timed out`);
      resolve(false);
    });
  });
}

// Function to update the .env.local file
function updateEnvFile() {
  if (!fs.existsSync(envPath)) {
    console.log(`❌ .env.local file not found at ${envPath}`);
    return false;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  let updated = false;
  
  // Check if USE_FIREBASE_EMULATOR is set to true
  if (!envContent.includes('USE_FIREBASE_EMULATOR=true')) {
    if (envContent.includes('USE_FIREBASE_EMULATOR=')) {
      // Replace existing value
      envContent = envContent.replace(/USE_FIREBASE_EMULATOR=.*/, 'USE_FIREBASE_EMULATOR=true');
    } else {
      // Add new variable
      envContent += '\nUSE_FIREBASE_EMULATOR=true';
    }
    updated = true;
  }
  
  // Check if FIREBASE_AUTH_EMULATOR_HOST is set
  if (!envContent.includes('FIREBASE_AUTH_EMULATOR_HOST=')) {
    envContent += '\nFIREBASE_AUTH_EMULATOR_HOST=localhost:9099';
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated .env.local file with Auth emulator configuration`);
    
    // Reload environment variables
    dotenv.config({ path: envPath, override: true });
    
    return true;
  } else {
    console.log(`✅ .env.local file already has Auth emulator configuration`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🔍 Checking Auth emulator configuration...');
  
  // Check if Auth emulator is running
  const isRunning = await checkAuthEmulator();
  
  if (!isRunning) {
    console.log('⚠️ Auth emulator is not running. Please start it with:');
    console.log('npm run emulators');
    process.exit(1);
  }
  
  // Check if environment variables are properly configured
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const useFirebaseEmulator = process.env.USE_FIREBASE_EMULATOR;
  
  if (!authEmulatorHost || !useFirebaseEmulator || useFirebaseEmulator !== 'true') {
    console.log('⚠️ Auth emulator environment variables are not properly configured');
    
    // Update .env.local file
    updateEnvFile();
    
    console.log('✅ Auth emulator configuration updated');
  } else {
    console.log('✅ Auth emulator is properly configured');
  }
  
  console.log('\n🎉 Auth emulator check completed');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 