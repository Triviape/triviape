/**
 * Utilities for optimizing API requests
 */

import { memoizeWithCache } from './cacheUtils';
import { logError, ErrorCategory, ErrorSeverity } from './errorHandler';

/**
 * API request options
 */
export interface ApiRequestOptions extends RequestInit {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cacheResponse?: boolean;
  cacheTtl?: number;
}

/**
 * Default API request options
 */
const defaultOptions: ApiRequestOptions = {
  timeout: 10000, // 10 seconds
  retries: 2,
  retryDelay: 1000, // 1 second
  cacheResponse: false,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
};

/**
 * Create an AbortController with timeout
 * @param timeout Timeout in milliseconds
 * @returns AbortController and signal
 */
function createAbortController(timeout?: number): { controller: AbortController; signal: AbortSignal } {
  const controller = new AbortController();
  const { signal } = controller;
  
  if (timeout) {
    setTimeout(() => controller.abort(new Error(`Request timed out after ${timeout}ms`)), timeout);
  }
  
  return { controller, signal };
}

/**
 * Make an API request with retries and timeout
 * @param url URL to fetch
 * @param options Request options
 * @returns Promise with the response
 */
export async function fetchWithRetry(
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const mergedOptions: ApiRequestOptions = { ...defaultOptions, ...options };
  const {
    baseUrl,
    timeout,
    retries,
    retryDelay,
    cacheResponse,
    cacheTtl,
    ...fetchOptions
  } = mergedOptions;
  
  // Construct the full URL
  const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
  
  // Create an AbortController for the timeout
  const { signal } = createAbortController(timeout);
  
  // Add the signal to the fetch options
  const optionsWithSignal = { ...fetchOptions, signal };
  
  let lastError: Error | null = null;
  let attempt = 0;
  
  while (attempt <= retries!) {
    try {
      const response = await fetch(fullUrl, optionsWithSignal);
      
      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      attempt++;
      
      // Log the error
      logError(error as Error, {
        category: ErrorCategory.API,
        severity: attempt > retries! ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
        context: {
          additionalData: {
            url: fullUrl,
            attempt,
            maxRetries: retries,
          }
        },
      });
      
      // If this was the last attempt, throw the error
      if (attempt > retries!) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay! * attempt));
    }
  }
  
  // This should never happen, but TypeScript requires a return statement
  throw lastError || new Error('Unknown error occurred during API request');
}

/**
 * Make a JSON API request with retries and timeout
 * @param url URL to fetch
 * @param options Request options
 * @returns Promise with the JSON response
 */
export async function fetchJson<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  return response.json();
}

/**
 * Make a cached JSON API request
 * @param url URL to fetch
 * @param options Request options
 * @returns Promise with the JSON response
 */
export const fetchJsonCached = memoizeWithCache(
  fetchJson,
  {
    ttl: defaultOptions.cacheTtl,
    staleWhileRevalidate: true,
  }
);

/**
 * Create a query string from an object
 * @param params Query parameters
 * @returns Query string
 */
export function createQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(`${key}[]`, String(item)));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Create a REST API client
 * @param baseUrl Base URL for the API
 * @param defaultOptions Default options for all requests
 * @returns API client object
 */
export function createApiClient(
  baseUrl: string,
  defaultOptions: ApiRequestOptions = {}
) {
  const client = {
    /**
     * Make a GET request
     * @param url URL to fetch
     * @param options Request options
     * @returns Promise with the JSON response
     */
    get: <T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
      return fetchJson<T>(url, {
        method: 'GET',
        baseUrl,
        ...defaultOptions,
        ...options,
      });
    },
    
    /**
     * Make a POST request
     * @param url URL to fetch
     * @param data Data to send
     * @param options Request options
     * @returns Promise with the JSON response
     */
    post: <T = any>(url: string, data: any, options: ApiRequestOptions = {}): Promise<T> => {
      return fetchJson<T>(url, {
        method: 'POST',
        body: JSON.stringify(data),
        baseUrl,
        ...defaultOptions,
        ...options,
      });
    },
    
    /**
     * Make a PUT request
     * @param url URL to fetch
     * @param data Data to send
     * @param options Request options
     * @returns Promise with the JSON response
     */
    put: <T = any>(url: string, data: any, options: ApiRequestOptions = {}): Promise<T> => {
      return fetchJson<T>(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        baseUrl,
        ...defaultOptions,
        ...options,
      });
    },
    
    /**
     * Make a PATCH request
     * @param url URL to fetch
     * @param data Data to send
     * @param options Request options
     * @returns Promise with the JSON response
     */
    patch: <T = any>(url: string, data: any, options: ApiRequestOptions = {}): Promise<T> => {
      return fetchJson<T>(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        baseUrl,
        ...defaultOptions,
        ...options,
      });
    },
    
    /**
     * Make a DELETE request
     * @param url URL to fetch
     * @param options Request options
     * @returns Promise with the JSON response
     */
    delete: <T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
      return fetchJson<T>(url, {
        method: 'DELETE',
        baseUrl,
        ...defaultOptions,
        ...options,
      });
    },
    
    /**
     * Make a cached GET request
     * @param url URL to fetch
     * @param options Request options
     * @returns Promise with the JSON response
     */
    getCached: <T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
      return fetchJsonCached<T>(url, {
        method: 'GET',
        baseUrl,
        cacheResponse: true,
        ...defaultOptions,
        ...options,
      });
    },
  };
  
  return client;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * API error codes enum
 */
export enum ApiErrorCode {
  // Auth errors
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  
  // Validation errors
  VALIDATION_ERROR = 'validation_error',
  INVALID_REQUEST = 'invalid_request',
  
  // Resource errors
  NOT_FOUND = 'not_found',
  ALREADY_EXISTS = 'already_exists',
  CONFLICT = 'conflict',
  
  // Server errors
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  
  // Generic errors
  BAD_REQUEST = 'bad_request',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: ApiErrorCode = ApiErrorCode.UNKNOWN_ERROR,
  details?: any
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Standardized API route handler with error handling
 */
export async function withApiErrorHandling<T>(
  request: Request,
  handler: () => Promise<T>,
  options?: {
    logErrors?: boolean;
    validateRequest?: (data: any) => { valid: boolean; errors?: any };
  }
): Promise<Response> {
  try {
    // Execute the handler
    const result = await handler();
    
    // Return success response
    return Response.json(createSuccessResponse(result));
  } catch (error: any) {
    // Log the error if enabled
    if (options?.logErrors !== false) {
      console.error('API error:', error);
      
      // Log to monitoring service if available
      try {
        if (typeof error === 'object' && error !== null) {
          logError(error, {
            category: ErrorCategory.API,
            severity: ErrorSeverity.ERROR,
            context: { request }
          });
        }
      } catch (loggingError) {
        console.error('Error logging failed:', loggingError);
      }
    }
    
    // Handle different error types
    let statusCode = 500;
    let errorCode = ApiErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected error occurred';
    let details = undefined;
    
    // Firebase Auth errors
    if (error.code && error.code.startsWith('auth/')) {
      statusCode = 401;
      errorCode = ApiErrorCode.UNAUTHORIZED;
      message = getAuthErrorMessage(error);
    }
    // Not Found errors
    else if (error.message?.includes('not found') || error.code === 'not-found') {
      statusCode = 404;
      errorCode = ApiErrorCode.NOT_FOUND;
      message = error.message || 'Resource not found';
    }
    // Validation errors
    else if (error.message?.includes('validation') || error.code === 'validation-failed') {
      statusCode = 400;
      errorCode = ApiErrorCode.VALIDATION_ERROR;
      message = error.message || 'Validation failed';
      details = error.details;
    }
    // Permission errors
    else if (error.code === 'permission-denied') {
      statusCode = 403;
      errorCode = ApiErrorCode.FORBIDDEN;
      message = error.message || 'Permission denied';
    }
    // Handle status code if available
    else if (error.statusCode) {
      statusCode = error.statusCode;
      
      if (statusCode >= 400 && statusCode < 500) {
        errorCode = ApiErrorCode.BAD_REQUEST;
      }
    }
    // Use error message if available
    if (error.message) {
      message = error.message;
    }
    
    // Return standardized error response
    return Response.json(
      createErrorResponse(message, errorCode, details),
      { status: statusCode }
    );
  }
} 