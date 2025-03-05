const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const EMULATOR_START_TIMEOUT = 15000; // 15 seconds
const EMULATOR_READY_PATTERN = /All emulators ready/;
const DEFAULT_TEST_PATTERN = 'app/__tests__/**/*.test.{ts,tsx}';

// Parse command line arguments
const args = process.argv.slice(2);
const testPattern = args.length > 0 ? args.join(' ') : DEFAULT_TEST_PATTERN;
const isIntegrationTest = args.some(arg => arg.includes('integration'));

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.USE_FIREBASE_EMULATOR = 'true';
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
process.env.TEST_TYPE = isIntegrationTest ? 'integration' : 'unit';

// Check if emulators are already running
function areEmulatorsRunning() {
  try {
    // Try to connect to the Auth emulator
    const result = execSync('curl -s http://localhost:9099', { stdio: 'pipe' });
    return result.toString().includes('Firebase');
  } catch (error) {
    return false;
  }
}

// Start the emulators
function startEmulators() {
  console.log('🔥 Starting Firebase emulators...');
  
  return new Promise((resolve, reject) => {
    const emulatorProcess = spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore,storage,functions'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    
    let emulatorOutput = '';
    let emulatorStarted = false;
    
    // Set a timeout to reject if emulators don't start in time
    const timeout = setTimeout(() => {
      if (!emulatorStarted) {
        emulatorProcess.kill();
        reject(new Error(`Emulators failed to start within ${EMULATOR_START_TIMEOUT}ms`));
      }
    }, EMULATOR_START_TIMEOUT);
    
    // Listen for emulator output
    emulatorProcess.stdout.on('data', (data) => {
      const output = data.toString();
      emulatorOutput += output;
      
      // Check if emulators are ready
      if (EMULATOR_READY_PATTERN.test(output)) {
        emulatorStarted = true;
        clearTimeout(timeout);
        console.log('✅ Firebase emulators started successfully');
        resolve(emulatorProcess);
      }
    });
    
    // Listen for emulator errors
    emulatorProcess.stderr.on('data', (data) => {
      emulatorOutput += data.toString();
    });
    
    // Handle emulator process exit
    emulatorProcess.on('exit', (code) => {
      if (!emulatorStarted) {
        clearTimeout(timeout);
        reject(new Error(`Emulators exited with code ${code}. Output: ${emulatorOutput}`));
      }
    });
  });
}

// Run the tests
function runTests() {
  console.log(`🧪 Running tests: ${testPattern}`);
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['jest', testPattern, '--runInBand'], {
      stdio: 'inherit',
      shell: true,
    });
    
    testProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Tests completed successfully');
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
  });
}

// Main function
async function main() {
  let emulatorProcess = null;
  let startedEmulators = false;
  
  try {
    // Check if emulators are already running
    if (!areEmulatorsRunning()) {
      emulatorProcess = await startEmulators();
      startedEmulators = true;
    } else {
      console.log('✅ Firebase emulators are already running');
    }
    
    // Run the tests
    await runTests();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up emulators if we started them
    if (emulatorProcess && startedEmulators) {
      console.log('🧹 Shutting down Firebase emulators...');
      emulatorProcess.kill();
    }
  }
}

// Run the script
main(); 