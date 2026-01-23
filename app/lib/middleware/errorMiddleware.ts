/**
 * Centralized error handling middleware for API routes
 * 
 * This module provides a unified approach to error handling across all API endpoints,
 * ensuring consistent error responses and logging.
 * 
 * @module errorMiddleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  createErrorResponse, 
  generateRequestId, 
  ApiErrorCode,
  ApiResponse
} from '../apiUtils';
import { logError, ErrorCategory, ErrorSeverity } from '../errorHandler';
import { getAuthErrorMessage } from '../authErrorHandler';

/**
 * Standard error structure expected by the middleware
 */
export interface StandardError {
  code?: string | ApiErrorCode;
  message?: string;
  statusCode?: number;
  details?: any;
}

/**
 * Options for error middleware configuration
 */
export interface ErrorMiddlewareOptions {
  /** Whether to log errors (default: true) */
  logErrors?: boolean;
  /** Whether to include stack traces in development (default: true) */
  includeStackTrace?: boolean;
  /** Custom error transformer */
  transformError?: (error: any) => StandardError;
}

/**
 * Default error middleware options
 */
const DEFAULT_OPTIONS: ErrorMiddlewareOptions = {
  logErrors: true,
  includeStackTrace: process.env.NODE_ENV === 'development',
};

/**
 * Map common error patterns to standardized error responses
 */
function normalizeError(error: any, options: ErrorMiddlewareOptions): {
  statusCode: number;
  errorCode: ApiErrorCode;
  message: string;
  details?: any;
} {
  // Custom transformer if provided
  if (options.transformError) {
    const transformed = options.transformError(error);
    return {
      statusCode: transformed.statusCode || 500,
      errorCode: (transformed.code as ApiErrorCode) || ApiErrorCode.INTERNAL_ERROR,
      message: transformed.message || 'An unexpected error occurred',
      details: transformed.details,
    };
  }

  // Firebase Auth errors
  if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
    return {
      statusCode: 401,
      errorCode: ApiErrorCode.UNAUTHORIZED,
      message: getAuthErrorMessage(error),
    };
  }

  // Already structured errors with statusCode
  if (error.statusCode) {
    const statusCode = error.statusCode;
    let errorCode = ApiErrorCode.INTERNAL_ERROR;

    if (statusCode === 400) {
      errorCode = ApiErrorCode.BAD_REQUEST;
    } else if (statusCode === 401) {
      errorCode = ApiErrorCode.UNAUTHORIZED;
    } else if (statusCode === 403) {
      errorCode = ApiErrorCode.FORBIDDEN;
    } else if (statusCode === 404) {
      errorCode = ApiErrorCode.NOT_FOUND;
    } else if (statusCode === 409) {
      errorCode = ApiErrorCode.CONFLICT;
    } else if (statusCode === 422) {
      errorCode = ApiErrorCode.VALIDATION_ERROR;
    } else if (statusCode === 503) {
      errorCode = ApiErrorCode.SERVICE_UNAVAILABLE;
    }

    return {
      statusCode,
      errorCode: error.code || errorCode,
      message: error.message || 'An error occurred',
      details: error.details,
    };
  }

  // Validation errors
  if (
    error.message?.toLowerCase().includes('validation') ||
    error.code === 'validation-failed' ||
    error.name === 'ValidationError'
  ) {
    return {
      statusCode: 400,
      errorCode: ApiErrorCode.VALIDATION_ERROR,
      message: error.message || 'Validation failed',
      details: error.details || error.errors,
    };
  }

  // Not Found errors
  if (
    error.message?.toLowerCase().includes('not found') ||
    error.code === 'not-found' ||
    error.name === 'NotFoundError'
  ) {
    return {
      statusCode: 404,
      errorCode: ApiErrorCode.NOT_FOUND,
      message: error.message || 'Resource not found',
    };
  }

  // Permission/Authorization errors
  if (
    error.code === 'permission-denied' ||
    error.code === 'forbidden' ||
    error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('forbidden')
  ) {
    return {
      statusCode: 403,
      errorCode: ApiErrorCode.FORBIDDEN,
      message: error.message || 'Permission denied',
    };
  }

  // Conflict errors
  if (
    error.code === 'conflict' ||
    error.code === 'already-exists' ||
    error.message?.toLowerCase().includes('already exists')
  ) {
    return {
      statusCode: 409,
      errorCode: ApiErrorCode.ALREADY_EXISTS,
      message: error.message || 'Resource already exists',
    };
  }

  // Network/Service errors
  if (
    error.name === 'NetworkError' ||
    error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('timeout')
  ) {
    return {
      statusCode: 503,
      errorCode: ApiErrorCode.SERVICE_UNAVAILABLE,
      message: error.message || 'Service temporarily unavailable',
    };
  }

  // Default to internal server error
  return {
    statusCode: 500,
    errorCode: ApiErrorCode.INTERNAL_ERROR,
    message: error.message || 'An unexpected error occurred',
    details: options.includeStackTrace ? { stack: error.stack } : undefined,
  };
}

/**
 * Centralized error handling middleware
 * 
 * Wraps API route handlers to provide consistent error handling and logging.
 * All errors thrown within the handler are caught, normalized, logged, and
 * returned in a standardized format.
 * 
 * @param request - The incoming request
 * @param handler - The route handler function
 * @param options - Configuration options
 * @returns Standardized API response
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withErrorHandling(request, async () => {
 *     // Your route logic
 *     const data = await fetchData();
 *     return { data };
 *   });
 * }
 * ```
 */
export async function withErrorHandling<T = any>(
  request: NextRequest,
  handler: () => Promise<T>,
  options: ErrorMiddlewareOptions = {}
): Promise<NextResponse<ApiResponse<T>>> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const requestId = generateRequestId();

  try {
    // Execute the handler
    const result = await handler();

    // Return standardized success response
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId,
    });
  } catch (error: any) {
    // Normalize the error to a standard format
    const { statusCode, errorCode, message, details } = normalizeError(error, config);

    // Log the error if enabled
    if (config.logErrors !== false) {
      try {
        logError(error instanceof Error ? error : new Error(String(error)), {
          category: ErrorCategory.API,
          severity: statusCode >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
          context: {
            action: 'api_request',
            additionalData: {
              requestId,
              url: request.url,
              method: request.method,
              statusCode,
              errorCode,
              details,
            },
          },
        });
      } catch (loggingError) {
        console.error('Error logging failed:', loggingError);
      }
    }

    // Return standardized error response
    const errorResponse = createErrorResponse(message, requestId, errorCode, details);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * Type guard to check if an error is a StandardError
 */
export function isStandardError(error: any): error is StandardError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error || 'statusCode' in error)
  );
}

/**
 * Helper to throw a standardized error
 * 
 * @example
 * ```ts
 * throwStandardError(ApiErrorCode.NOT_FOUND, 'User not found', 404);
 * ```
 */
export function throwStandardError(
  code: ApiErrorCode,
  message: string,
  statusCode: number,
  details?: any
): never {
  const error: StandardError = {
    code,
    message,
    statusCode,
    details,
  };
  throw error;
}

/**
 * Export withErrorHandling as default for convenience
 */
export default withErrorHandling;
