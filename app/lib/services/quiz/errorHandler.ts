/**
 * Error handling utilities for quiz service
 */

import { QuizServiceError, QuizServiceErrorType } from './types';

/**
 * Create a standardized quiz service error
 * @param message Error message
 * @param type Error type
 * @param code Error code (optional)
 * @param originalError Original error (optional)
 * @returns QuizServiceError
 */
export function createQuizError(
  message: string,
  type: QuizServiceErrorType,
  code?: string,
  originalError?: Error
): QuizServiceError {
  const error = new Error(message) as QuizServiceError;
  error.type = type;
  error.code = code;
  error.originalError = originalError;
  return error;
}

/**
 * Log quiz service errors with appropriate context
 * @param error Error to log
 * @param context Additional context information
 */
export function logQuizServiceError(error: QuizServiceError, context?: Record<string, any>): void {
  console.error(`[QuizService] ${error.type}: ${error.message}`, {
    code: error.code,
    context,
    originalError: error.originalError
  });
} 