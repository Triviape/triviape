/**
 * Environment utility functions for consistent environment checks
 */

/**
 * Check if the code is running in a development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the code is running in a production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if the code is running in a test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Check if the code is running on the server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if the code is running in the browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if mock data should be used
 * Only enabled in test environment or when explicitly requested
 */
export function shouldUseMockData(): boolean {
  // Never use mock data in production
  if (isProduction()) {
    return false;
  }
  
  // Always use in test environment
  if (isTest()) {
    return true;
  }
  
  // In development, only use if explicitly enabled
  if (isDevelopment()) {
    // Check for environment variable
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      return true;
    }
    
    // Check for query parameter in browser
    if (isBrowser() && new URLSearchParams(window.location.search).has('mock')) {
      return true;
    }
  }
  
  // Default to false - real data
  return false;
}

/**
 * Get the base URL for API requests
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // Default to relative path
  return '/api';
}

/**
 * Get the Firebase project ID
 */
export function getFirebaseProjectId(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-dev';
}

/**
 * Check if Firebase emulators should be used
 */
export function shouldUseFirebaseEmulators(): boolean {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' || isDevelopment();
} 