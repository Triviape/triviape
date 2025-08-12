/**
 * Standardized error handling for service functions
 * @param error The caught error
 * @param message User-friendly message to display
 * @returns Never returns, always throws
 */
export function handleServiceError(error: unknown, message: string): never {
  // Add more specific error handling logic as needed
  console.error(`${message}:`, error);
  
  // If error is already an Error object, add context
  if (error instanceof Error) {
    error.message = `${message}: ${error.message}`;
    throw error;
  }
  
  // Otherwise create a new error with context
  throw new Error(`${message}: ${error}`);
} 