/**
 * Global error handling utilities
 */

import { FirebaseError } from 'firebase/app';
import { z } from 'zod';

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  API = 'api',
  QUERY = 'query',
  MUTATION = 'mutation',
  PERFORMANCE = 'performance',
  UNKNOWN = 'unknown'
}

// Error context interface
export interface ErrorContext {
  userId?: string;
  path?: string;
  action?: string;
  timestamp?: Date;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Record<string, any>;
  additionalData?: Record<string, any>;
}

/**
 * Log an error with context
 * @param error Error object
 * @param options Error logging options
 */
export function logError(
  error: Error,
  options: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    context?: ErrorContext;
  } = {}
): void {
  const { 
    category = ErrorCategory.UNKNOWN,
    severity = ErrorSeverity.ERROR,
    context = {}
  } = options;
  
  // Add timestamp if not provided
  const errorContext = {
    ...context,
    timestamp: context.timestamp || new Date()
  };
  
  // Format the error for logging
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    severity,
    category,
    context: errorContext
  };
  
  // Log to console (in production, this would send to a logging service)
  console.error(`[${severity.toUpperCase()}] [${category}] ${error.message}`, errorData);
  
  // In a production app, you would send this to a logging service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   sendToLoggingService(errorData);
  // }
}

/**
 * Handle Firebase errors
 * @param error Firebase error
 * @param context Error context
 */
export function handleFirebaseError(error: FirebaseError, context: ErrorContext = {}): void {
  let category = ErrorCategory.UNKNOWN;
  let severity = ErrorSeverity.ERROR;
  
  // Determine category based on Firebase error code
  if (error.code.startsWith('auth/')) {
    category = ErrorCategory.AUTHENTICATION;
  } else if (error.code.startsWith('firestore/') || error.code.startsWith('storage/')) {
    category = ErrorCategory.DATABASE;
  } else if (error.code.startsWith('permission-denied')) {
    category = ErrorCategory.PERMISSION;
    severity = ErrorSeverity.WARNING;
  } else if (error.code.includes('network')) {
    category = ErrorCategory.NETWORK;
  }
  
  logError(error, { severity, category, context });
}

/**
 * Handle Zod validation errors
 * @param error Zod error
 * @param context Error context
 */
export function handleValidationError(error: z.ZodError, context: ErrorContext = {}): void {
  const errorMessages = error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );
  
  const validationError = new Error(`Validation failed: ${errorMessages.join(', ')}`);
  
  logError(
    validationError,
    {
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.VALIDATION,
      context: {
        ...context,
        additionalData: {
          ...context.additionalData,
          zodErrors: error.errors
        }
      }
    }
  );
}

/**
 * Handle API errors
 * @param error Error object
 * @param context Error context
 */
export function handleApiError(error: Error, context: ErrorContext = {}): void {
  logError(
    error,
    {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.API,
      context
    }
  );
}

/**
 * Handle Query errors
 * @param error Error object
 * @param context Error context
 */
export function handleQueryError(error: Error, context: ErrorContext = {}): void {
  logError(
    error,
    {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.QUERY,
      context
    }
  );
}

/**
 * Handle Mutation errors
 * @param error Error object
 * @param context Error context
 */
export function handleMutationError(error: Error, context: ErrorContext = {}): void {
  logError(
    error,
    {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.MUTATION,
      context
    }
  );
}

/**
 * Format a user-friendly error message
 * @param error Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (error instanceof FirebaseError) {
    // Handle common Firebase errors
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please use a different email or try logging in.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/invalid-email':
        return 'Invalid email address. Please check your email and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later or reset your password.';
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'firestore/unavailable':
      case 'storage/unavailable':
        return 'Service is currently unavailable. Please try again later.';
      default:
        return 'An error occurred. Please try again later.';
    }
  } else if (error instanceof z.ZodError) {
    // Format validation errors
    const errorMessages = error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    return `Validation failed: ${errorMessages.join(', ')}`;
  }
  
  // Generic error message for other types of errors
  return 'An unexpected error occurred. Please try again later.';
} 