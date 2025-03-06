/**
 * Utility functions for working with Firebase emulators
 */

import { isClient } from './utils';
import { 
  EMULATOR_HOSTS, 
  EMULATOR_PORTS, 
  shouldUseEmulators as checkShouldUseEmulators 
} from './emulatorConfig';

/**
 * Check if we should use Firebase emulators
 */
export function shouldUseEmulators(): boolean {
  return checkShouldUseEmulators();
}

/**
 * Check if a specific emulator is available by attempting to connect to it
 * @param host The host address (e.g., 'localhost')
 * @param port The port number
 * @returns Promise that resolves to true if the emulator is available, false otherwise
 */
export async function isEmulatorAvailable(host: string, port: number): Promise<boolean> {
  // Only run this check on the server side
  if (isClient()) {
    return true; // Assume available on client side
  }
  
  try {
    // Use fetch to check if the emulator is running
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
    
    const response = await fetch(`http://${host}:${port}`, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.status !== 404; // Any response except 404 means the emulator is likely running
  } catch (error) {
    // If fetch fails, the emulator is probably not running
    return false;
  }
}

/**
 * Parse an emulator host string into host and port components
 * @param emulatorHost The emulator host string (e.g., 'localhost:11001')
 * @returns An object with host and port properties
 */
export function parseEmulatorHost(emulatorHost: string): { host: string; port: number } {
  const [host, portStr] = emulatorHost.split(':');
  const port = parseInt(portStr, 10);
  
  return { host, port };
}

/**
 * Check if all required emulators are available
 * @returns Promise that resolves to true if all emulators are available, false otherwise
 */
export async function areEmulatorsAvailable(): Promise<boolean> {
  // Only run this check on the server side
  if (isClient()) {
    return true; // Assume available on client side
  }
  
  // Skip check if we're not supposed to use emulators
  if (!shouldUseEmulators()) {
    return false;
  }
  
  try {
    // Get emulator hosts from the shared configuration
    const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || EMULATOR_HOSTS.auth;
    const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST || EMULATOR_HOSTS.firestore;
    const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || EMULATOR_HOSTS.storage;
    
    // Parse hosts
    const auth = parseEmulatorHost(authEmulatorHost);
    const firestore = parseEmulatorHost(firestoreEmulatorHost);
    const storage = parseEmulatorHost(storageEmulatorHost);
    
    // Check if all emulators are available
    const [authAvailable, firestoreAvailable, storageAvailable] = await Promise.all([
      isEmulatorAvailable(auth.host, auth.port),
      isEmulatorAvailable(firestore.host, firestore.port),
      isEmulatorAvailable(storage.host, storage.port)
    ]);
    
    return authAvailable && firestoreAvailable && storageAvailable;
  } catch (error) {
    console.error('Error checking emulator availability:', error);
    return false;
  }
}

/**
 * Log a warning if emulators should be used but are not available
 */
export async function checkEmulatorAvailability(): Promise<void> {
  // Only run this check on the server side
  if (isClient()) {
    return;
  }
  
  // Skip check if we're not supposed to use emulators
  if (!shouldUseEmulators()) {
    return;
  }
  
  const available = await areEmulatorsAvailable();
  
  if (!available) {
    console.warn(
      '⚠️ Firebase emulators are not running but environment is configured to use them.\n' +
      'Start emulators with: npm run emulators\n' +
      'Your app may fall back to production Firebase services or experience errors.'
    );
  } else {
    console.log('✅ Firebase emulators are running and available');
  }
} 