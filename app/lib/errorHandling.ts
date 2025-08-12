'use client';

import { toast } from '@/app/components/ui/use-toast';

/**
 * Standard error types for the application
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  SERVER = 'server',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
}

/**
 * Structured error object with additional metadata
 */
export interface AppError {
  isAppError: true;
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Create a standardized error object
 */
export function createAppError(
  type: ErrorType,
  message: string,
  options?: {
    code?: string;
    details?: Record<string, unknown>;
    originalError?: Error;
  }
): AppError {
  return {
    isAppError: true,
    type,
    message,
    code: options?.code,
    details: options?.details,
    originalError: options?.originalError
  };
}

/**
 * Handle API response errors and convert to AppError
 */
export async function handleApiError(response: Response): Promise<AppError> {
  let errorData: Record<string, unknown> = {};
  
  try {
    errorData = (await response.json()) as Record<string, unknown>;
  } catch {
    // If we can't parse JSON, use status text
    errorData = { error: response.statusText };
  }
  
  const message = (errorData.error as string) || 'An unexpected error occurred';
  
  // Map HTTP status codes to error types
  switch (response.status) {
    case 400:
      return createAppError(ErrorType.VALIDATION, message, { 
        code: 'BAD_REQUEST',
        details: errorData.details as Record<string, unknown> | undefined
      });
    case 401:
      return createAppError(ErrorType.AUTHENTICATION, message, { 
        code: 'UNAUTHORIZED'
      });
    case 403:
      return createAppError(ErrorType.AUTHORIZATION, message, { 
        code: 'FORBIDDEN'
      });
    case 404:
      return createAppError(ErrorType.NOT_FOUND, message, { 
        code: 'NOT_FOUND'
      });
    case 500:
    case 502:
    case 503:
    case 504:
      return createAppError(ErrorType.SERVER, message, { 
        code: 'SERVER_ERROR'
      });
    default:
      return createAppError(ErrorType.UNKNOWN, message, { 
        code: `HTTP_${response.status}`
      });
  }
}

/**
 * Handle network or unexpected errors
 */
export function handleUnexpectedError(error: unknown): AppError {
  if (error instanceof Error) {
    // Network errors
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return createAppError(
        ErrorType.NETWORK,
        'Network error. Please check your connection.',
        { originalError: error }
      );
    }
    
    // Timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return createAppError(
        ErrorType.NETWORK,
        'Request timed out. Please try again.',
        { originalError: error }
      );
    }
    
    // Generic error with the original error message
    return createAppError(
      ErrorType.UNKNOWN,
      error.message,
      { originalError: error }
    );
  }
  
  // For non-Error objects
  return createAppError(
    ErrorType.UNKNOWN,
    'An unexpected error occurred',
    { details: { error } }
  );
}

/**
 * Display an error toast with appropriate styling based on error type
 */
export function showErrorToast(error: AppError) {
  let title = 'Error';
  let variant: 'default' | 'destructive' = 'destructive';
  
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      title = 'Authentication Error';
      break;
    case ErrorType.AUTHORIZATION:
      title = 'Authorization Error';
      break;
    case ErrorType.NETWORK:
      title = 'Network Error';
      break;
    case ErrorType.SERVER:
      title = 'Server Error';
      break;
    case ErrorType.VALIDATION:
      title = 'Validation Error';
      break;
    case ErrorType.NOT_FOUND:
      title = 'Not Found';
      variant = 'default';
      break;
  }
  
  toast({
    title,
    description: error.message,
    variant
  });
  
  // Log detailed error information to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', error);
  }
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAppError' in error &&
    (error as AppError).isAppError === true
  );
}


/**
 * Safely execute an async function with standardized error handling
 * @returns [data, error] tuple
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  options?: {
    onError?: (error: AppError) => void;
    showToast?: boolean;
  }
): Promise<[T | null, AppError | null]> {
  try {
    const data = await asyncFn();
    return [data, null];
  } catch (error) {
    let appError: AppError;
    
    if (isAppError(error)) {
      appError = error;
    } else if (error instanceof Response) {
      appError = await handleApiError(error);
    } else {
      appError = handleUnexpectedError(error);
    }
    
    // Call custom error handler if provided
    if (options?.onError) {
      options.onError(appError);
    }
    
    // Show toast if requested
    if (options?.showToast !== false) {
      showErrorToast(appError);
    }
    
    return [null, appError];
  }
}