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
  details?: unknown;
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
  transformError?: (error: unknown) => StandardError;
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
function normalizeError(error: Record<string, unknown>, options: ErrorMiddlewareOptions): {
  statusCode: number;
  errorCode: ApiErrorCode;
  message: string;
  details?: unknown;
} {
  const errorMessage = typeof error.message === 'string' ? error.message : undefined;
  const errorCode = typeof error.code === 'string' ? error.code : undefined;
  const errorName = typeof error.name === 'string' ? error.name : undefined;
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : undefined;

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
  if (errorCode?.startsWith('auth/')) {
    return {
      statusCode: 401,
      errorCode: ApiErrorCode.UNAUTHORIZED,
      message: getAuthErrorMessage(error),
    };
  }

  // Already structured errors with statusCode
  if (statusCode) {
    let normalizedErrorCode = ApiErrorCode.INTERNAL_ERROR;

    if (statusCode === 400) {
      normalizedErrorCode = ApiErrorCode.BAD_REQUEST;
    } else if (statusCode === 401) {
      normalizedErrorCode = ApiErrorCode.UNAUTHORIZED;
    } else if (statusCode === 403) {
      normalizedErrorCode = ApiErrorCode.FORBIDDEN;
    } else if (statusCode === 404) {
      normalizedErrorCode = ApiErrorCode.NOT_FOUND;
    } else if (statusCode === 409) {
      normalizedErrorCode = ApiErrorCode.CONFLICT;
    } else if (statusCode === 422) {
      normalizedErrorCode = ApiErrorCode.VALIDATION_ERROR;
    } else if (statusCode === 503) {
      normalizedErrorCode = ApiErrorCode.SERVICE_UNAVAILABLE;
    }

    return {
      statusCode,
      errorCode: (Object.values(ApiErrorCode) as string[]).includes(errorCode ?? '')
        ? (errorCode as ApiErrorCode)
        : normalizedErrorCode,
      message: errorMessage || 'An error occurred',
      details: error.details,
    };
  }

  // Validation errors
  if (
    errorMessage?.toLowerCase().includes('validation') ||
    errorCode === 'validation-failed' ||
    errorName === 'ValidationError'
  ) {
    return {
      statusCode: 400,
      errorCode: ApiErrorCode.VALIDATION_ERROR,
      message: errorMessage || 'Validation failed',
      details: error.details || error.errors,
    };
  }

  // Not Found errors
  if (
    errorMessage?.toLowerCase().includes('not found') ||
    errorCode === 'not-found' ||
    errorName === 'NotFoundError'
  ) {
    return {
      statusCode: 404,
      errorCode: ApiErrorCode.NOT_FOUND,
      message: errorMessage || 'Resource not found',
    };
  }

  // Permission/Authorization errors
  if (
    errorCode === 'permission-denied' ||
    errorCode === 'forbidden' ||
    errorMessage?.toLowerCase().includes('permission') ||
    errorMessage?.toLowerCase().includes('forbidden')
  ) {
    return {
      statusCode: 403,
      errorCode: ApiErrorCode.FORBIDDEN,
      message: errorMessage || 'Permission denied',
    };
  }

  // Conflict errors
  if (
    errorCode === 'conflict' ||
    errorCode === 'already-exists' ||
    errorMessage?.toLowerCase().includes('already exists')
  ) {
    return {
      statusCode: 409,
      errorCode: ApiErrorCode.ALREADY_EXISTS,
      message: errorMessage || 'Resource already exists',
    };
  }

  // Network/Service errors
  if (
    errorName === 'NetworkError' ||
    errorMessage?.toLowerCase().includes('network') ||
    errorMessage?.toLowerCase().includes('timeout')
  ) {
    return {
      statusCode: 503,
      errorCode: ApiErrorCode.SERVICE_UNAVAILABLE,
      message: errorMessage || 'Service temporarily unavailable',
    };
  }

  // Default to internal server error
  return {
    statusCode: 500,
    errorCode: ApiErrorCode.INTERNAL_ERROR,
    message: errorMessage || 'An unexpected error occurred',
    details: options.includeStackTrace && typeof error.stack === 'string'
      ? { stack: error.stack }
      : undefined,
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
export async function withErrorHandling<T = unknown>(
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
  } catch (error: unknown) {
    // Normalize the error to a standard format
    const errObj = (typeof error === 'object' && error !== null ? error : { message: String(error) }) as Record<string, unknown>;
    const { statusCode, errorCode, message, details } = normalizeError(errObj, config);

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
    return NextResponse.json(errorResponse as ApiResponse<T>, { status: statusCode });
  }
}

/**
 * Type guard to check if an error is a StandardError
 */
export function isStandardError(error: unknown): error is StandardError {
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
  details?: unknown
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
