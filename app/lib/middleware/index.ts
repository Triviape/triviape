/**
 * Centralized middleware exports
 * 
 * This module provides easy access to all middleware functions
 * used throughout the application's API routes.
 */

export {
  withErrorHandling,
  throwStandardError,
  isStandardError,
  type StandardError,
  type ErrorMiddlewareOptions,
} from './errorMiddleware';

export {
  withSecurity,
  createSecurityMiddleware,
  type SecurityMiddlewareConfig,
} from './securityMiddleware';

// Re-export commonly used utilities
export { generateRequestId, ApiErrorCode } from '../apiUtils';
export { withRateLimit, RateLimitConfigs } from '../rateLimiter';
