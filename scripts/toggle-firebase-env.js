#!/usr/bin/env node

/**
 * This script toggles between Firebase emulator and production environments
 * by updating the .env.local file.
 * 
 * Usage:
 *   node scripts/toggle-firebase-env.js emulator
 *   node scripts/toggle-firebase-env.js production
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get the target environment from command line arguments
const targetEnv = process.argv[2]?.toLowerCase();

if (!['emulator', 'production'].includes(targetEnv)) {
  console.error('Please specify either "emulator" or "production" as an argument.');
  console.log('Usage:');
  console.log('  node scripts/toggle-firebase-env.js emulator');
  console.log('  node scripts/toggle-firebase-env.js production');
  process.exit(1);
}

// Check if .env.local exists
if (!fs.existsSync(ENV_FILE_PATH)) {
  console.log('.env.local file not found. Creating a new one...');
  fs.writeFileSync(ENV_FILE_PATH, '');
}

// Read the current .env.local file
const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');

// Parse the current environment variables
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

// Update the environment variables based on the target environment
if (targetEnv === 'emulator') {
  envVars['NEXT_PUBLIC_USE_FIREBASE_EMULATOR'] = 'true';
  envVars['USE_FIREBASE_EMULATOR'] = 'true';
  console.log('Switching to Firebase Emulator environment...');
} else {
  envVars['NEXT_PUBLIC_USE_FIREBASE_EMULATOR'] = 'false';
  envVars['USE_FIREBASE_EMULATOR'] = 'false';
  console.log('Switching to Firebase Production environment...');
  
  // Confirm with the user before switching to production
  rl.question('⚠️ WARNING: You are about to switch to the production Firebase environment. Are you sure? (y/N) ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      rl.close();
      process.exit(0);
    }
    
    // Continue with the switch
    updateEnvFile();
    rl.close();
  });
  
  return; // Exit early to wait for user confirmation
}

// Update the .env.local file
updateEnvFile();

function updateEnvFile() {
  // Convert the environment variables back to a string
  const newEnvContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Write the updated environment variables to the .env.local file
  fs.writeFileSync(ENV_FILE_PATH, newEnvContent);
  
  console.log(`Successfully switched to Firebase ${targetEnv} environment.`);
  console.log('Please restart your Next.js server for the changes to take effect.');
}

// Close readline interface if not waiting for confirmation
if (targetEnv === 'emulator') {
  rl.close();
} 