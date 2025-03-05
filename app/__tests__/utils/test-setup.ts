import { exec } from 'child_process';
import { promisify } from 'util';
import { areEmulatorsAvailable } from '../../lib/emulatorUtils';
import { cleanupTestResources } from './test-data-factory';

const execAsync = promisify(exec);

/**
 * Check if emulators are running and start them if needed
 * @param options Configuration options
 * @returns Promise that resolves when emulators are available
 */
export async function ensureEmulatorsRunning(options: EnsureEmulatorsOptions = {}): Promise<boolean> {
  const {
    timeout = 30000,
    shouldStart = true,
    onlyServices = ['auth', 'firestore', 'storage'],
    projectId = 'triviape-cbc23'
  } = options;
  
  // Check if emulators are already running
  const available = await areEmulatorsAvailable();
  if (available) {
    console.log('✅ Firebase emulators are already running');
    return true;
  }
  
  // If emulators are not running and we shouldn't start them, throw an error
  if (!shouldStart) {
    throw new Error('Firebase emulators are not running. Start them with: npm run emulators');
  }
  
  console.log('🚀 Starting Firebase emulators...');
  
  try {
    // Start emulators in a separate process
    const servicesFlag = onlyServices.length > 0 ? `--only=${onlyServices.join(',')}` : '';
    const command = `npx firebase emulators:start --project=${projectId} ${servicesFlag} --quiet`;
    
    // Execute the command but don't wait for it to complete
    const childProcess = exec(command, {
      env: {
        ...process.env,
        FORCE_COLOR: 'true'
      }
    });
    
    // Log output for debugging
    childProcess.stdout?.on('data', (data) => {
      console.log(`Emulator: ${data}`);
    });
    
    childProcess.stderr?.on('data', (data) => {
      console.error(`Emulator Error: ${data}`);
    });
    
    // Wait for emulators to be available
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const available = await areEmulatorsAvailable();
      if (available) {
        console.log('✅ Firebase emulators are now running');
        return true;
      }
      
      console.log('⏳ Waiting for emulators to start...');
    }
    
    throw new Error(`Timed out waiting for emulators to start after ${timeout}ms`);
  } catch (error) {
    console.error('Failed to start emulators:', error);
    throw error;
  }
}

/**
 * Set up the test environment
 * @param options Configuration options
 */
export async function setupTestEnvironment(options: SetupTestEnvironmentOptions = {}): Promise<void> {
  const {
    startEmulators = true,
    cleanupBeforeTests = true,
    emulatorOptions = {}
  } = options;
  
  // Set environment variables for testing
  // NODE_ENV is read-only, so we don't modify it
  process.env.USE_FIREBASE_EMULATOR = 'true';
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
  
  // Clean up any existing test resources if needed
  if (cleanupBeforeTests) {
    await cleanupTestResources();
  }
  
  // Start emulators if needed
  if (startEmulators) {
    await ensureEmulatorsRunning({
      ...emulatorOptions,
      shouldStart: true
    });
  }
}

/**
 * Clean up the test environment
 */
export async function teardownTestEnvironment(): Promise<void> {
  // Clean up test resources
  await cleanupTestResources();
}

// Type definitions
export interface EnsureEmulatorsOptions {
  timeout?: number;
  shouldStart?: boolean;
  onlyServices?: string[];
  projectId?: string;
}

export interface SetupTestEnvironmentOptions {
  startEmulators?: boolean;
  cleanupBeforeTests?: boolean;
  emulatorOptions?: Partial<EnsureEmulatorsOptions>;
} 