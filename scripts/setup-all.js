#!/usr/bin/env node

/**
 * Complete setup script for Triviape
 * 
 * This script runs all the necessary setup steps for the Triviape application:
 * 1. Firebase setup
 * 2. Start Firebase emulators
 * 3. Import sample quiz data
 * 4. Import sample user data
 * 5. Create sample authentication users
 * 6. Verify Firestore collections
 * 
 * Run with: npm run setup:all
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully: ${command} ${args.join(' ')}`);
        resolve();
      } else {
        console.error(`❌ Command failed with code ${code}: ${command} ${args.join(' ')}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      console.error(`❌ Failed to start command: ${error.message}`);
      reject(error);
    });
  });
}

// Check if .env.local exists, if not create it from example
function setupEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const exampleEnvPath = path.resolve(process.cwd(), '.env.local.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(exampleEnvPath)) {
    console.log('📄 Creating .env.local from .env.local.example');
    fs.copyFileSync(exampleEnvPath, envPath);
    console.log('✅ Created .env.local file');
  } else if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file already exists');
  } else {
    console.error('❌ .env.local.example not found, cannot create .env.local');
    throw new Error('.env.local.example not found');
  }
}

// Check if emulators are already running
async function checkEmulatorsRunning() {
  try {
    execSync('npm run firebase:check-emulators', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Main setup function
async function setup() {
  console.log('🔥 Starting Triviape setup process...');
  
  try {
    // Step 1: Setup environment file
    setupEnvFile();
    
    // Step 2: Run Firebase setup
    await runCommand('npm', ['run', 'firebase:setup']);
    
    // Step 3: Check if emulators are already running
    const emulatorsRunning = await checkEmulatorsRunning();
    
    // Step 4: Start emulators if not already running
    let emulatorProcess;
    if (!emulatorsRunning) {
      console.log('🚀 Starting Firebase emulators...');
      
      // Ask user if they want to start emulators in background or foreground
      const answer = await new Promise((resolve) => {
        rl.question('Do you want to start emulators in the background? (y/n): ', (answer) => {
          resolve(answer.toLowerCase());
        });
      });
      
      if (answer === 'y' || answer === 'yes') {
        // Start emulators in background
        emulatorProcess = spawn('npm', ['run', 'emulators:persistent'], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        
        emulatorProcess.unref();
        console.log('🔥 Firebase emulators started in background with persistence enabled');
        
        // Wait for emulators to start
        console.log('⏳ Waiting for emulators to start (15 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        // Tell user to start emulators in another terminal
        console.log('\n⚠️ Please start Firebase emulators in another terminal with:');
        console.log('npm run emulators:persistent');
        
        const confirmed = await new Promise((resolve) => {
          rl.question('\nHave you started the emulators? (y/n): ', (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          });
        });
        
        if (!confirmed) {
          console.log('❌ Setup aborted. Please start emulators and try again.');
          rl.close();
          return;
        }
      }
    } else {
      console.log('✅ Firebase emulators are already running');
    }
    
    // Step 5: Import sample quiz data
    await runCommand('npm', ['run', 'firebase:import-data']);
    
    // Step 6: Import sample user data
    await runCommand('npm', ['run', 'firebase:add-users']);
    
    // Step 7: Create sample authentication users
    await runCommand('npm', ['run', 'firebase:create-sample-users']);
    
    // Step 8: Verify Firestore collections
    await runCommand('npm', ['run', 'firebase:verify']);
    
    // Step 9: Export emulator data for persistence
    await runCommand('npm', ['run', 'emulators:export']);
    
    console.log('\n🎉 Triviape setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the development server with emulators: npm run dev:with-persistent-emulators');
    console.log('2. Open http://localhost:3030 in your browser');
    console.log('\nHappy coding! 🚀');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the setup
setup(); 