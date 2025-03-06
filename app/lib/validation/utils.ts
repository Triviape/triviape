/**
 * Validation utility functions
 */

import { z } from 'zod';

/**
 * Validate data against a Zod schema
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validation result with success flag, data, and errors
 */
export function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return { success: false, errors };
    }
    
    // For non-Zod errors, return a generic error
    return { 
      success: false, 
      errors: { _error: 'An unexpected error occurred during validation' } 
    };
  }
}

/**
 * Validate data against a Zod schema and throw an error if validation fails
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validated data
 * @throws Error if validation fails
 */
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Format Zod validation errors for form display
 * @param error Zod error
 * @returns Formatted errors object
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
} 