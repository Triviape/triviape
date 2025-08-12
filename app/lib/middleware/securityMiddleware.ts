/**
 * Comprehensive security middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RateLimitConfigs } from '../rateLimiter';
import { logError, ErrorCategory, ErrorSeverity } from '../errorHandler';
import { validateCSRFToken } from '../security/csrfProtection';

/**
 * Security middleware configuration
 */
export interface SecurityMiddlewareConfig {
  rateLimit?: boolean;
  validateHeaders?: boolean;
  validateBody?: boolean;
  maxBodySize?: number;
  allowedOrigins?: string[];
  enableCORS?: boolean;
  enableCSRF?: boolean;
  enableXSS?: boolean;
  enableSQLInjection?: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityMiddlewareConfig = {
  rateLimit: true,
  validateHeaders: true,
  validateBody: true,
  maxBodySize: 1024 * 1024, // 1MB
  allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
  enableCORS: true,
  enableCSRF: true,
  enableXSS: true,
  enableSQLInjection: true
};

/**
 * Security headers to add to all responses
 */
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

/**
 * Validate request headers for security
 */
function validateHeaders(req: NextRequest): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-real-ip',
    'x-forwarded-for'
  ];
  
  for (const header of suspiciousHeaders) {
    if (req.headers.get(header)) {
      errors.push(`Suspicious header detected: ${header}`);
    }
  }
  
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      errors.push('Invalid content type. Expected application/json');
    }
  }
  
  // Check request size
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > DEFAULT_SECURITY_CONFIG.maxBodySize!) {
    errors.push('Request body too large');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate request body for security threats
 */
function validateBody(body: unknown): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    return { valid: true };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i
  ];
  
  const checkValue = (value: unknown, path: string = '') => {
    if (typeof value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          errors.push(`Suspicious pattern detected in ${path}: ${pattern.source}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, path ? `${path}.${key}` : key);
      }
    }
  };
  
  checkValue(body);
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate CORS headers
 */
function validateCORS(req: NextRequest): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  const origin = req.headers.get('origin');
  
  if (origin && !DEFAULT_SECURITY_CONFIG.allowedOrigins!.includes(origin)) {
    errors.push(`CORS: Origin not allowed: ${origin}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate CSRF token using comprehensive protection
 */
function validateCSRF(req: NextRequest): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  // Use the comprehensive CSRF validation
  const isValid = validateCSRFToken(req);
  
  if (!isValid) {
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return { valid: true };
    }
    
    // Check what specifically failed
    const headerToken = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;
    
    if (!headerToken) {
      errors.push('CSRF token missing from headers');
    }
    if (!cookieToken) {
      errors.push('CSRF token missing from cookies');
    }
    if (headerToken && cookieToken && headerToken !== cookieToken) {
      errors.push('CSRF token mismatch between header and cookie');
    }
    
    // If no specific errors identified, use generic message
    if (errors.length === 0) {
      errors.push('CSRF token validation failed');
    }
  }
  
  return {
    valid: isValid,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Create security middleware
 */
export function createSecurityMiddleware(config: SecurityMiddlewareConfig = {}) {
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
  
  return async (req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) => {
    try {
      // 1. Validate headers
      if (finalConfig.validateHeaders) {
        const headerValidation = validateHeaders(req);
        if (!headerValidation.valid) {
          logError(new Error('Security validation failed'), {
            category: ErrorCategory.SECURITY,
            severity: ErrorSeverity.ERROR,
            context: {
              action: 'validate_headers',
              additionalData: { errors: headerValidation.errors }
            }
          });
          
          return new NextResponse(
            JSON.stringify({
              error: 'Security validation failed',
              details: headerValidation.errors
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
              }
            }
          );
        }
      }
      
      // 2. Validate CORS
      if (finalConfig.enableCORS) {
        const corsValidation = validateCORS(req);
        if (!corsValidation.valid) {
          logError(new Error('CORS validation failed'), {
            category: ErrorCategory.SECURITY,
            severity: ErrorSeverity.ERROR,
            context: {
              action: 'validate_cors',
              additionalData: { errors: corsValidation.errors }
            }
          });
          
          return new NextResponse(
            JSON.stringify({
              error: 'CORS validation failed',
              details: corsValidation.errors
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
              }
            }
          );
        }
      }
      
      // 3. Validate CSRF
      if (finalConfig.enableCSRF) {
        const csrfValidation = validateCSRF(req);
        if (!csrfValidation.valid) {
          logError(new Error('CSRF validation failed'), {
            category: ErrorCategory.SECURITY,
            severity: ErrorSeverity.ERROR,
            context: {
              action: 'validate_csrf',
              additionalData: { errors: csrfValidation.errors }
            }
          });
          
          return new NextResponse(
            JSON.stringify({
              error: 'CSRF validation failed',
              details: csrfValidation.errors
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
              }
            }
          );
        }
      }
      
      // 4. Validate request body for POST/PUT/PATCH requests
      if (finalConfig.validateBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          const body = await req.json();
          const bodyValidation = validateBody(body);
          
          if (!bodyValidation.valid) {
            logError(new Error('Body validation failed'), {
              category: ErrorCategory.SECURITY,
              severity: ErrorSeverity.ERROR,
              context: {
                action: 'validate_body',
                additionalData: { errors: bodyValidation.errors }
              }
            });
            
            return new NextResponse(
              JSON.stringify({
                error: 'Request body validation failed',
                details: bodyValidation.errors
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                  ...SECURITY_HEADERS
                }
              }
            );
          }
        } catch (err) {
          const error = err as Error;
          return new NextResponse(
            JSON.stringify({
              error: 'Invalid JSON in request body'
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...SECURITY_HEADERS
              }
            }
          );
        }
      }
      
      // 5. Apply rate limiting if enabled
      if (finalConfig.rateLimit) {
        const rateLimitedHandler = withRateLimit(handler, RateLimitConfigs.api);
        const response = await rateLimitedHandler(req);
        
        // Add security headers to response
        if (response) {
          Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
        
        return response;
      }
      
      // 6. Execute handler
      const response = await handler(req);
      
      // Add security headers to response
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), {
        category: ErrorCategory.SECURITY,
        severity: ErrorSeverity.ERROR,
        context: {
          action: 'security_middleware',
          additionalData: { error }
        }
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Security middleware error',
          message: 'An error occurred while processing your request'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...SECURITY_HEADERS
          }
        }
      );
    }
  };
}

/**
 * Apply security middleware to API route
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: SecurityMiddlewareConfig
) {
  const securityMiddleware = createSecurityMiddleware(config);
  return (req: NextRequest) => securityMiddleware(req, handler);
}

/**
 * Security decorator for API routes
 */
export function secure(config?: SecurityMiddlewareConfig) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      const req = args[0];
      if (req instanceof Request) {
        const nextReq = req as unknown as NextRequest;
        const securityMiddleware = createSecurityMiddleware(config);
        return securityMiddleware(nextReq, originalMethod.bind(this));
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}