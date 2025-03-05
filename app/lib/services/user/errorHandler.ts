/**
 * Error handling utilities for user service
 */

import { UserServiceError, UserServiceErrorType } from './types';

/**
 * Create a standardized user service error
 * @param message Error message
 * @param type Error type
 * @param code Error code (optional)
 * @param originalError Original error (optional)
 * @returns UserServiceError
 */
export function createUserError(
  message: string,
  type: UserServiceErrorType,
  code?: string,
  originalError?: Error
): UserServiceError {
  const error = new Error(message) as UserServiceError;
  error.type = type;
  error.code = code;
  error.originalError = originalError;
  return error;
}

/**
 * Log user service errors with appropriate context
 * @param error Error to log
 * @param context Additional context information
 */
export function logUserServiceError(error: UserServiceError, context?: Record<string, any>): void {
  console.error(`[UserService] ${error.type}: ${error.message}`, {
    code: error.code,
    context,
    originalError: error.originalError
  });
} 