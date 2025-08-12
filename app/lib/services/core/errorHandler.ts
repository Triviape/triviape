/**
 * Comprehensive error handling system for all services
 */

import { FirebaseError } from 'firebase/app';
import { ErrorCategory, ErrorSeverity, logError } from '../../errorHandler';

/**
 * Service error types for categorization
 */
export enum ServiceErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND_ERROR = 'not_found_error',
  CONFLICT_ERROR = 'conflict_error',
  FIREBASE_ERROR = 'firebase_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Service error class with additional context
 */
export class ServiceError extends Error {
  public readonly type: ServiceErrorType;
  public readonly code?: string;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly severity: ErrorSeverity;

  constructor(
    message: string,
    type: ServiceErrorType,
    code?: string,
    originalError?: Error,
    context?: Record<string, any>,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ) {
    super(message);
    this.name = 'ServiceError';
    this.type = type;
    this.code = code;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();
    this.severity = severity;

    // Preserve stack trace
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case ServiceErrorType.VALIDATION_ERROR:
        return 'The provided data is invalid. Please check your input and try again.';
      case ServiceErrorType.AUTHENTICATION_ERROR:
        return 'Authentication failed. Please log in again.';
      case ServiceErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ServiceErrorType.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ServiceErrorType.CONFLICT_ERROR:
        return 'This operation conflicts with existing data.';
      case ServiceErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection.';
      case ServiceErrorType.RATE_LIMIT_ERROR:
        return 'Too many requests. Please try again later.';
      case ServiceErrorType.TIMEOUT_ERROR:
        return 'The operation timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get error category for logging
   */
  getCategory(): ErrorCategory {
    switch (this.type) {
      case ServiceErrorType.VALIDATION_ERROR:
        return ErrorCategory.VALIDATION;
      case ServiceErrorType.AUTHENTICATION_ERROR:
      case ServiceErrorType.AUTHORIZATION_ERROR:
        return ErrorCategory.AUTHENTICATION;
      case ServiceErrorType.FIREBASE_ERROR:
        return ErrorCategory.DATABASE;
      case ServiceErrorType.NETWORK_ERROR:
      case ServiceErrorType.TIMEOUT_ERROR:
        return ErrorCategory.NETWORK;
      case ServiceErrorType.RATE_LIMIT_ERROR:
        return ErrorCategory.API;
      default:
        return ErrorCategory.UNKNOWN;
    }
  }
}

/**
 * Create a standardized service error
 */
export function createServiceError(
  message: string,
  type: ServiceErrorType,
  code?: string,
  originalError?: Error,
  context?: Record<string, any>,
  severity?: ErrorSeverity
): ServiceError {
  const error = new ServiceError(message, type, code, originalError, context, severity);
  
  // Log the error
  logError(error, {
    category: error.getCategory(),
    severity: error.severity,
    context: {
      action: 'service_error',
      additionalData: {
        errorType: type,
        errorCode: code,
        context
      }
    }
  });

  return error;
}

/**
 * Handle Firebase errors and convert to ServiceError
 */
export function handleFirebaseError(error: FirebaseError, operation: string): ServiceError {
  let type: ServiceErrorType;
  let severity: ErrorSeverity = ErrorSeverity.ERROR;

  // Map Firebase error codes to service error types
  switch (error.code) {
    case 'permission-denied':
      type = ServiceErrorType.AUTHORIZATION_ERROR;
      break;
    case 'unauthenticated':
      type = ServiceErrorType.AUTHENTICATION_ERROR;
      break;
    case 'not-found':
      type = ServiceErrorType.NOT_FOUND_ERROR;
      break;
    case 'already-exists':
      type = ServiceErrorType.CONFLICT_ERROR;
      break;
    case 'resource-exhausted':
      type = ServiceErrorType.RATE_LIMIT_ERROR;
      break;
    case 'deadline-exceeded':
      type = ServiceErrorType.TIMEOUT_ERROR;
      break;
    case 'unavailable':
      type = ServiceErrorType.NETWORK_ERROR;
      break;
    case 'invalid-argument':
      type = ServiceErrorType.VALIDATION_ERROR;
      break;
    default:
      type = ServiceErrorType.FIREBASE_ERROR;
  }

  return createServiceError(
    `Firebase error during ${operation}: ${error.message}`,
    type,
    error.code,
    error,
    { operation, firebaseCode: error.code }
  );
}

/**
 * Handle validation errors
 */
export function handleValidationError(error: Error, field?: string): ServiceError {
  return createServiceError(
    `Validation error${field ? ` for field '${field}'` : ''}: ${error.message}`,
    ServiceErrorType.VALIDATION_ERROR,
    'VALIDATION_ERROR',
    error,
    { field }
  );
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: Error, operation: string): ServiceError {
  return createServiceError(
    `Authentication error during ${operation}: ${error.message}`,
    ServiceErrorType.AUTHENTICATION_ERROR,
    'AUTH_ERROR',
    error,
    { operation }
  );
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(resource: string, id?: string): ServiceError {
  return createServiceError(
    `${resource} not found${id ? ` with ID: ${id}` : ''}`,
    ServiceErrorType.NOT_FOUND_ERROR,
    'NOT_FOUND',
    undefined,
    { resource, id }
  );
}

/**
 * Handle conflict errors
 */
export function handleConflictError(message: string, context?: Record<string, any>): ServiceError {
  return createServiceError(
    `Conflict: ${message}`,
    ServiceErrorType.CONFLICT_ERROR,
    'CONFLICT',
    undefined,
    context
  );
}

/**
 * Handle rate limit errors
 */
export function handleRateLimitError(operation: string, retryAfter?: number): ServiceError {
  return createServiceError(
    `Rate limit exceeded for operation: ${operation}`,
    ServiceErrorType.RATE_LIMIT_ERROR,
    'RATE_LIMIT',
    undefined,
    { operation, retryAfter }
  );
}

/**
 * Handle timeout errors
 */
export function handleTimeoutError(operation: string, timeout: number): ServiceError {
  return createServiceError(
    `Operation timed out: ${operation} (${timeout}ms)`,
    ServiceErrorType.TIMEOUT_ERROR,
    'TIMEOUT',
    undefined,
    { operation, timeout }
  );
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: Error, operation: string): ServiceError {
  return createServiceError(
    `Network error during ${operation}: ${error.message}`,
    ServiceErrorType.NETWORK_ERROR,
    'NETWORK_ERROR',
    error,
    { operation }
  );
}

/**
 * Error handler wrapper for async operations
 */
export function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  return operation().catch((error) => {
    if (error instanceof ServiceError) {
      throw error;
    }

    if (error instanceof FirebaseError) {
      throw handleFirebaseError(error, operationName);
    }

    // Handle other types of errors
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        throw handleTimeoutError(operationName, 5000);
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw handleNetworkError(error, operationName);
      }
    }

    // Default to unknown error
    throw createServiceError(
      `Unexpected error during ${operationName}: ${error instanceof Error ? error.message : String(error)}`,
      ServiceErrorType.UNKNOWN_ERROR,
      'UNKNOWN_ERROR',
      error instanceof Error ? error : new Error(String(error)),
      { operationName, ...context }
    );
  });
}

/**
 * Retry wrapper for operations that might fail due to transient issues
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry certain error types
      if (error instanceof ServiceError) {
        const nonRetryableTypes = [
          ServiceErrorType.VALIDATION_ERROR,
          ServiceErrorType.AUTHENTICATION_ERROR,
          ServiceErrorType.AUTHORIZATION_ERROR,
          ServiceErrorType.NOT_FOUND_ERROR,
          ServiceErrorType.CONFLICT_ERROR
        ];

        if (nonRetryableTypes.includes(error.type)) {
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
        category: ErrorCategory.API,
        severity: ErrorSeverity.WARNING,
        context: {
          action: 'retry_operation',
          additionalData: {
            operationName,
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

  // This should never be reached
  throw lastError!;
} 