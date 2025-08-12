/**
 * Security validation schemas for input sanitization and validation
 */

import { z } from 'zod';

/**
 * Base security validation utilities
 */
export const SecurityUtils = {
  /**
   * Sanitize string input to prevent XSS
   */
  sanitizeString: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  /**
   * Validate and sanitize email
   */
  sanitizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  /**
   * Validate URL and ensure it's safe
   */
  sanitizeUrl: (url: string): string => {
    const sanitized = url.trim();
    if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://');
    }
    return sanitized;
  },

  /**
   * Validate file size
   */
  validateFileSize: (size: number, maxSize: number = 5 * 1024 * 1024): boolean => {
    return size <= maxSize;
  },

  /**
   * Validate file type
   */
  validateFileType: (filename: string, allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'gif']): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }
};

/**
 * User input validation schemas
 */
export const UserInputSchemas = {
  // Display name with XSS protection
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores')
    .transform(SecurityUtils.sanitizeString),

  // Email with validation and sanitization
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters')
    .transform(SecurityUtils.sanitizeEmail),

  // Strong password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Bio with XSS protection
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .transform(val => val ? SecurityUtils.sanitizeString(val) : val),

  // URL with validation
  url: z.string()
    .url('Please enter a valid URL')
    .transform(SecurityUtils.sanitizeUrl)
    .optional(),

  // Location with sanitization
  location: z.string()
    .max(100, 'Location must be less than 100 characters')
    .transform(SecurityUtils.sanitizeString)
    .optional(),
};

/**
 * Quiz input validation schemas
 */
export const QuizInputSchemas = {
  // Quiz title with XSS protection
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .transform(SecurityUtils.sanitizeString),

  // Quiz description with XSS protection
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .transform(SecurityUtils.sanitizeString)
    .optional(),

  // Category ID validation
  categoryId: z.string()
    .min(1, 'Category ID is required')
    .max(50, 'Category ID must be less than 50 characters'),

  // Difficulty level validation
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' })
  }),

  // Time limit validation
  timeLimit: z.number()
    .min(30, 'Time limit must be at least 30 seconds')
    .max(3600, 'Time limit must be less than 1 hour'),

  // Question text with XSS protection
  questionText: z.string()
    .min(10, 'Question must be at least 10 characters')
    .max(500, 'Question must be less than 500 characters')
    .transform(SecurityUtils.sanitizeString),

  // Answer options with XSS protection
  answerOptions: z.array(z.string())
    .min(2, 'Must have at least 2 answer options')
    .max(6, 'Must have at most 6 answer options')
    .transform(options => options.map(SecurityUtils.sanitizeString)),

  // Correct answer validation
  correctAnswer: z.number()
    .min(0, 'Correct answer index must be 0 or greater')
    .max(5, 'Correct answer index must be 5 or less'),
};

/**
 * API input validation schemas
 */
export const ApiInputSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: z.number().min(1, 'Page must be 1 or greater').default(1),
    limit: z.number().min(1, 'Limit must be 1 or greater').max(100, 'Limit must be 100 or less').default(20),
    offset: z.number().min(0, 'Offset must be 0 or greater').optional(),
  }),

  // Search parameters
  search: z.object({
    query: z.string()
      .min(1, 'Search query is required')
      .max(100, 'Search query must be less than 100 characters')
      .transform(SecurityUtils.sanitizeString),
    filters: z.record(z.string(), z.any()).optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string()
      .min(1, 'Filename is required')
      .max(255, 'Filename must be less than 255 characters'),
    size: z.number()
      .min(1, 'File size must be greater than 0')
      .max(5 * 1024 * 1024, 'File size must be less than 5MB'),
    type: z.string()
      .min(1, 'File type is required'),
  }),
};

/**
 * Authentication input validation schemas
 */
export const AuthInputSchemas = {
  // Login credentials
  login: z.object({
    email: UserInputSchemas.email,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().default(false),
  }),

  // Registration data
  register: z.object({
    email: UserInputSchemas.email,
    password: UserInputSchemas.password,
    displayName: UserInputSchemas.displayName,
    acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  }),

  // Password reset
  resetPassword: z.object({
    email: UserInputSchemas.email,
  }),

  // Change password
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: UserInputSchemas.password,
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
};

/**
 * Rate limiting validation schemas
 */
export const RateLimitSchemas = {
  // Rate limit configuration
  rateLimitConfig: z.object({
    windowMs: z.number().min(1000, 'Window must be at least 1 second'),
    max: z.number().min(1, 'Max requests must be at least 1'),
    message: z.string().optional(),
    statusCode: z.number().min(400).max(429).default(429),
  }),

  // Client identification
  clientId: z.object({
    ip: z.string().ip(),
    userAgent: z.string().max(500, 'User agent too long'),
    userId: z.string().optional(),
  }),
};

/**
 * Security headers validation schemas
 */
export const SecurityHeaderSchemas = {
  // CSRF token validation
  csrfToken: z.string()
    .min(32, 'CSRF token must be at least 32 characters')
    .max(128, 'CSRF token must be less than 128 characters'),

  // API key validation
  apiKey: z.string()
    .min(32, 'API key must be at least 32 characters')
    .max(128, 'API key must be less than 128 characters'),

  // Session token validation
  sessionToken: z.string()
    .min(32, 'Session token must be at least 32 characters')
    .max(256, 'Session token must be less than 256 characters'),
};

/**
 * Comprehensive validation function with security checks
 */
export function validateWithSecurity<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: Record<string, any>
): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    // Additional security checks
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, any>;
      
      // Check for suspicious patterns
      const suspiciousKeys = ['__proto__', 'constructor', 'prototype'];
      for (const key of suspiciousKeys) {
        if (key in dataObj) {
          return {
            success: false,
            errors: { _security: 'Suspicious input detected' }
          };
        }
      }

      // Check for excessive nesting
      const checkDepth = (obj: any, depth: number = 0): boolean => {
        if (depth > 10) return false;
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).every(val => checkDepth(val, depth + 1));
        }
        return true;
      };

      if (!checkDepth(dataObj)) {
        return {
          success: false,
          errors: { _security: 'Input too deeply nested' }
        };
      }
    }

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
    
    return { 
      success: false, 
      errors: { _error: 'An unexpected error occurred during validation' } 
    };
  }
}

/**
 * Sanitize and validate user input with comprehensive security checks
 */
export function sanitizeAndValidate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    allowedTags?: string[];
  } = {}
): { success: boolean; data?: T; errors?: Record<string, string> } {
  try {
    // Pre-sanitization checks
    if (typeof data === 'string' && data.length > (options.maxLength || 10000)) {
      return {
        success: false,
        errors: { _security: 'Input too long' }
      };
    }

    // Validate with security checks
    return validateWithSecurity(schema, data);
  } catch (error) {
    return {
      success: false,
      errors: { _error: 'Validation failed' }
    };
  }
} 