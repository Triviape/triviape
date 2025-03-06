/**
 * Firebase Authentication Error Handler
 * 
 * This module provides comprehensive error handling for Firebase Authentication operations.
 * It includes detailed error mapping, diagnostic functions, and retry mechanisms.
 */

import { FirebaseError } from 'firebase/app';
import { getAuthInstance } from './firebase';
import { 
  handleFirebaseError, 
  ErrorContext, 
  ErrorCategory, 
  ErrorSeverity,
  logError
} from './errorHandler';

// Define NetworkInformation interface for TypeScript
interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  [key: string]: any;
}

// Extend Navigator interface to include connection property
declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

// Comprehensive mapping of Firebase Auth error codes to user-friendly messages
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'auth/network-request-failed': 'Network connection failed. Please check your internet connection and try again.',
  'auth/timeout': 'The operation has timed out. Please try again.',
  
  // Email/password authentication errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'The email address is not valid.',
  'auth/email-already-in-use': 'This email is already registered. Please use a different email or try logging in.',
  'auth/weak-password': 'Password is too weak. Please use a stronger password.',
  
  // Account errors
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
  
  // Rate limiting and security
  'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later or reset your password.',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  
  // Token errors
  'auth/invalid-credential': 'The authentication credential is invalid. Please try again.',
  'auth/invalid-verification-code': 'The verification code is invalid. Please try again.',
  'auth/invalid-verification-id': 'The verification ID is invalid. Please try again.',
  
  // Misc errors
  'auth/popup-closed-by-user': 'The sign-in popup was closed before completing the sign-in.',
  'auth/cancelled-popup-request': 'The sign-in popup request was cancelled.',
  'auth/popup-blocked': 'The sign-in popup was blocked by the browser. Please allow popups for this site.',
  'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.',
  'auth/invalid-action-code': 'The action code is invalid. This can happen if the code is malformed or has already been used.',
  'auth/missing-android-pkg-name': 'Missing Android package name.',
  'auth/missing-continue-uri': 'Missing continue URL.',
  'auth/missing-ios-bundle-id': 'Missing iOS bundle ID.',
  'auth/invalid-continue-uri': 'The continue URL is invalid.',
  'auth/invalid-dynamic-link-domain': 'The dynamic link domain is invalid.',
  'auth/argument-error': 'Invalid argument provided.',
  'auth/invalid-persistence-type': 'Invalid persistence type specified.',
  'auth/unsupported-persistence-type': 'The current environment does not support the specified persistence type.',
  'auth/invalid-oauth-provider': 'Invalid OAuth provider.',
  'auth/invalid-oauth-client-id': 'Invalid OAuth client ID.',
  'auth/captcha-check-failed': 'The reCAPTCHA response token is invalid.',
  'auth/invalid-app-credential': 'Invalid app credential.',
  'auth/invalid-custom-token': 'Invalid custom token.',
  'auth/invalid-phone-number': 'Invalid phone number.',
  'auth/missing-phone-number': 'Missing phone number.',
  'auth/quota-exceeded': 'SMS quota exceeded.',
  'auth/missing-verification-code': 'Missing verification code.',
  'auth/invalid-tenant-id': 'Invalid tenant ID.',
  'auth/tenant-id-mismatch': 'Tenant ID mismatch.',
  'auth/admin-restricted-operation': 'This operation is restricted to administrators only.',
  'auth/missing-multi-factor-info': 'Missing multi-factor authentication information.',
  'auth/missing-multi-factor-session': 'Missing multi-factor session.',
  'auth/second-factor-already-in-use': 'The second factor is already enrolled on this account.',
  'auth/maximum-second-factor-count-exceeded': 'The maximum allowed number of second factors has been exceeded.',
  'auth/unsupported-first-factor': 'Enrolling a second factor or signing in with a multi-factor account requires sign-in with a supported first factor.',
  'auth/unsupported-second-factor': 'The second factor is not supported.',
  'auth/unverified-email': 'The operation requires a verified email.',
  'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
};

/**
 * Get a user-friendly error message from a Firebase error
 * @param error The error object
 * @returns A user-friendly error message
 */
export function getAuthErrorMessage(error: unknown): string {
  // Check if it's a Firebase error by looking for the code property
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    const firebaseError = error as { code: string; message: string };
    // Return the mapped error message or a default if not found
    return AUTH_ERROR_MESSAGES[firebaseError.code] || 
      `Authentication error (${firebaseError.code}): ${firebaseError.message}`;
  }
  
  // Handle non-Firebase errors
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  
  return 'An unknown error occurred. Please try again.';
}

/**
 * Diagnostic function to check Firebase Auth connectivity
 * @returns An object with connectivity status and details
 */
export async function checkFirebaseAuthConnectivity(): Promise<{
  success: boolean;
  details: string;
  timestamp: string;
  connectionInfo?: NetworkInformation;
}> {
  try {
    const auth = getAuthInstance();
    
    // Check if auth is initialized
    if (!auth) {
      return {
        success: false,
        details: 'Firebase Auth is not initialized',
        timestamp: new Date().toISOString(),
      };
    }
    
    // Try to get the current user (doesn't require network if cached)
    const currentUser = auth.currentUser;
    
    // Get network information if available
    let connectionInfo: NetworkInformation | undefined = undefined;
    if (typeof navigator !== 'undefined' && navigator.connection) {
      connectionInfo = navigator.connection;
    }
    
    return {
      success: true,
      details: `Firebase Auth is initialized. Current user: ${currentUser ? 'Signed in' : 'Not signed in'}`,
      timestamp: new Date().toISOString(),
      ...(connectionInfo && { connectionInfo }),
    };
  } catch (error) {
    return {
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Log authentication errors with context
 * @param error Error object
 * @param context Additional context
 */
export function logAuthError(
  error: unknown,
  context: Omit<ErrorContext, 'timestamp'> = {}
): void {
  if (error instanceof FirebaseError) {
    handleFirebaseError(error, {
      ...context,
      action: 'authentication'
    });
  } else if (error instanceof Error) {
    logError(error, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      context: {
        ...context,
        action: 'authentication'
      }
    });
  } else {
    // Create a new error for non-Error objects
    const authError = new Error(String(error));
    
    logError(authError, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      context: {
        ...context,
        action: 'authentication',
        additionalData: { originalError: error }
      }
    });
  }
}

/**
 * Retry an authentication operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries
 * @param baseDelay Base delay in milliseconds
 * @returns Result of the operation
 */
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 300
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Only retry certain Firebase errors
      if (error instanceof FirebaseError) {
        const retryableCodes = [
          'auth/network-request-failed',
          'auth/too-many-requests',
          'auth/internal-error'
        ];
        
        if (!retryableCodes.includes(error.code)) {
          throw error;
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Log retry attempt
      logError(lastError, {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.WARNING,
        context: {
          action: 'retry_auth_operation',
          additionalData: {
            attempt: attempt + 1,
            maxRetries,
            delay,
            retryable: true
          }
        }
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError;
} 