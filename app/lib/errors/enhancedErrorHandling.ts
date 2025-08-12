'use client';

import { EnhancedError, showEnhancedErrorToast } from '@/app/components/errors/EnhancedErrorHandler';
import { FirebaseError } from 'firebase/app';
import { z } from 'zod';

/**
 * Error classification utility
 */
export class ErrorClassifier {
  static classifyError(error: unknown): EnhancedError {
    const timestamp = Date.now();

    // Handle Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as FirebaseError;
      return this.classifyFirebaseError(firebaseError, timestamp);
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return this.classifyValidationError(error, timestamp);
    }

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Unable to connect to the server. Please check your internet connection.',
        details: error.message,
        retryable: true,
        timestamp,
        context: { originalError: error.name }
      };
    }

    // Handle HTTP errors
    if (error && typeof error === 'object' && 'status' in error) {
      const httpError = error as { status: number; statusText?: string; message?: string };
      return this.classifyHTTPError(httpError, timestamp);
    }

    // Handle generic errors
    if (error instanceof Error) {
      return this.classifyGenericError(error, timestamp);
    }

    // Fallback for unknown errors
    return {
      type: 'server',
      message: 'An unexpected error occurred. Please try again.',
      details: String(error),
      retryable: true,
      timestamp,
      context: { originalError: typeof error, value: error }
    };
  }

  private static classifyFirebaseError(error: FirebaseError, timestamp: number): EnhancedError {
    const baseError = {
      code: error.code,
      details: error.message,
      timestamp,
      context: { firebaseError: true, stack: error.stack }
    };

    switch (error.code) {
      // Authentication errors
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return {
          ...baseError,
          type: 'authentication',
          message: 'Invalid email or password. Please check your credentials and try again.',
          retryable: true
        };

      case 'auth/email-already-in-use':
        return {
          ...baseError,
          type: 'validation',
          message: 'This email is already registered. Please use a different email or try signing in.',
          retryable: false
        };

      case 'auth/weak-password':
        return {
          ...baseError,
          type: 'validation',
          message: 'Password is too weak. Please choose a stronger password.',
          retryable: false
        };

      case 'auth/invalid-email':
        return {
          ...baseError,
          type: 'validation',
          message: 'Please enter a valid email address.',
          retryable: false
        };

      case 'auth/too-many-requests':
        return {
          ...baseError,
          type: 'rate_limit',
          message: 'Too many failed attempts. Please wait a few minutes before trying again.',
          retryable: true
        };

      case 'auth/user-disabled':
        return {
          ...baseError,
          type: 'authorization',
          message: 'This account has been disabled. Please contact support for assistance.',
          retryable: false
        };

      case 'auth/network-request-failed':
        return {
          ...baseError,
          type: 'network',
          message: 'Network error. Please check your connection and try again.',
          retryable: true
        };

      // Firestore errors
      case 'permission-denied':
        return {
          ...baseError,
          type: 'authorization',
          message: 'You do not have permission to perform this action.',
          retryable: false
        };

      case 'not-found':
        return {
          ...baseError,
          type: 'not_found',
          message: 'The requested resource was not found.',
          retryable: false
        };

      case 'unavailable':
        return {
          ...baseError,
          type: 'server',
          message: 'Service is temporarily unavailable. Please try again in a moment.',
          retryable: true
        };

      default:
        return {
          ...baseError,
          type: 'server',
          message: 'A service error occurred. Please try again.',
          retryable: true
        };
    }
  }

  private static classifyValidationError(error: z.ZodError, timestamp: number): EnhancedError {
    const firstError = error.errors[0];
    const fieldName = firstError?.path.join('.') || 'field';
    
    return {
      type: 'validation',
      message: `Invalid ${fieldName}: ${firstError?.message || 'Please check your input.'}`,
      details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n'),
      retryable: false,
      timestamp,
      context: { 
        validationErrors: error.errors,
        fieldCount: error.errors.length
      }
    };
  }

  private static classifyHTTPError(error: { status: number; statusText?: string; message?: string }, timestamp: number): EnhancedError {
    const { status, statusText, message } = error;
    
    if (status === 401) {
      return {
        type: 'authentication',
        message: 'Authentication required. Please sign in to continue.',
        details: message || statusText,
        retryable: false,
        timestamp,
        context: { httpStatus: status }
      };
    }

    if (status === 403) {
      return {
        type: 'authorization',
        message: 'Access denied. You do not have permission to perform this action.',
        details: message || statusText,
        retryable: false,
        timestamp,
        context: { httpStatus: status }
      };
    }

    if (status === 404) {
      return {
        type: 'not_found',
        message: 'The requested resource was not found.',
        details: message || statusText,
        retryable: false,
        timestamp,
        context: { httpStatus: status }
      };
    }

    if (status === 429) {
      return {
        type: 'rate_limit',
        message: 'Too many requests. Please wait a moment before trying again.',
        details: message || statusText,
        retryable: true,
        timestamp,
        context: { httpStatus: status }
      };
    }

    if (status >= 500) {
      return {
        type: 'server',
        message: 'Server error. Please try again in a moment.',
        details: message || statusText,
        retryable: true,
        timestamp,
        context: { httpStatus: status }
      };
    }

    return {
      type: 'server',
      message: 'An error occurred. Please try again.',
      details: message || statusText || `HTTP ${status}`,
      retryable: status < 500,
      timestamp,
      context: { httpStatus: status }
    };
  }

  private static classifyGenericError(error: Error, timestamp: number): EnhancedError {
    // Check for common error patterns
    if (error.message.includes('CSRF')) {
      return {
        type: 'csrf',
        message: 'Security validation failed. Please refresh the page and try again.',
        details: error.message,
        retryable: true,
        timestamp,
        context: { errorName: error.name, stack: error.stack }
      };
    }

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return {
        type: 'network',
        message: 'Request timed out. Please check your connection and try again.',
        details: error.message,
        retryable: true,
        timestamp,
        context: { errorName: error.name, stack: error.stack }
      };
    }

    if (error.message.includes('rate limit') || error.message.includes('too many')) {
      return {
        type: 'rate_limit',
        message: 'Too many requests. Please wait a moment before trying again.',
        details: error.message,
        retryable: true,
        timestamp,
        context: { errorName: error.name, stack: error.stack }
      };
    }

    return {
      type: 'server',
      message: error.message || 'An unexpected error occurred.',
      details: error.stack,
      retryable: true,
      timestamp,
      context: { errorName: error.name, stack: error.stack }
    };
  }
}

/**
 * Enhanced error handling with automatic classification and user feedback
 */
export class EnhancedErrorHandler {
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  /**
   * Handle an error with automatic classification and user feedback
   */
  async handleError(
    error: unknown,
    options?: {
      operation?: string;
      context?: Record<string, unknown>;
      showToast?: boolean;
      onRetry?: () => Promise<void>;
      maxRetries?: number;
    }
  ): Promise<EnhancedError> {
    const { operation, context, showToast = true, onRetry, maxRetries = this.maxRetries } = options || {};
    
    // Classify the error
    const enhancedError = ErrorClassifier.classifyError(error);
    
    // Add additional context
    if (context || operation) {
      enhancedError.context = {
        ...enhancedError.context,
        operation,
        ...context
      };
    }

    // Log error for debugging
    this.logError(enhancedError);

    // Show user feedback if requested
    if (showToast) {
      const retryHandler = onRetry ? async () => {
        const retryKey = this.getRetryKey(enhancedError, operation);
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        if (attempts >= maxRetries) {
          showEnhancedErrorToast({
            ...enhancedError,
            message: `Maximum retry attempts reached. Please try again later.`,
            retryable: false
          });
          return;
        }

        try {
          this.retryAttempts.set(retryKey, attempts + 1);
          await onRetry();
          // Clear retry count on success
          this.retryAttempts.delete(retryKey);
        } catch (retryError) {
          const retryEnhancedError = ErrorClassifier.classifyError(retryError);
          showEnhancedErrorToast(retryEnhancedError, {
            onRetry: attempts + 1 < maxRetries ? retryHandler : undefined
          });
        }
      } : undefined;

      showEnhancedErrorToast(enhancedError, {
        onRetry: enhancedError.retryable ? retryHandler : undefined
      });
    }

    return enhancedError;
  }

  /**
   * Wrap an async operation with error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    options?: {
      operationName?: string;
      context?: Record<string, unknown>;
      showToast?: boolean;
      maxRetries?: number;
    }
  ): Promise<[T | null, EnhancedError | null]> {
    const { operationName, context, showToast, maxRetries } = options || {};
    
    try {
      const result = await operation();
      return [result, null];
    } catch (error) {
      const enhancedError = await this.handleError(error, {
        operation: operationName,
        context,
        showToast,
        onRetry: operation,
        maxRetries
      });
      return [null, enhancedError];
    }
  }

  /**
   * Create a retry function for failed operations
   */
  createRetryHandler(
    operation: () => Promise<void>,
    operationName?: string,
    maxRetries = this.maxRetries
  ) {
    return async () => {
      const retryKey = operationName || 'anonymous';
      const attempts = this.retryAttempts.get(retryKey) || 0;
      
      if (attempts >= maxRetries) {
        showEnhancedErrorToast({
          type: 'server',
          message: 'Maximum retry attempts reached. Please try again later.',
          retryable: false,
          timestamp: Date.now()
        });
        return;
      }

      try {
        this.retryAttempts.set(retryKey, attempts + 1);
        await operation();
        this.retryAttempts.delete(retryKey);
      } catch (error) {
        await this.handleError(error, {
          operation: operationName,
          showToast: true,
          maxRetries
        });
      }
    };
  }

  private getRetryKey(error: EnhancedError, operation?: string): string {
    return `${operation || 'unknown'}_${error.type}_${error.code || 'no_code'}`;
  }

  private logError(error: EnhancedError): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Enhanced Error [${error.type.toUpperCase()}]`);
      console.error('Message:', error.message);
      if (error.code) console.warn('Code:', error.code);
      if (error.details) console.info('Details:', error.details);
      if (error.context) console.table(error.context);
      console.groupEnd();
    }
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new EnhancedErrorHandler();

/**
 * Convenience functions for common error handling patterns
 */
export function handleAuthError(error: unknown, onRetry?: () => Promise<void>) {
  return globalErrorHandler.handleError(error, {
    operation: 'authentication',
    showToast: true,
    onRetry
  });
}

export function handleApiError(error: unknown, operation: string, onRetry?: () => Promise<void>) {
  return globalErrorHandler.handleError(error, {
    operation: `api_${operation}`,
    showToast: true,
    onRetry
  });
}

export function handleFormError(error: unknown, formName: string) {
  return globalErrorHandler.handleError(error, {
    operation: `form_${formName}`,
    showToast: true
  });
}