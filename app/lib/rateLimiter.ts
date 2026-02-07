/**
 * Comprehensive rate limiting system for API endpoints
 */

import { NextRequest } from 'next/server';
import { logError, ErrorCategory, ErrorSeverity } from './errorHandler';
import { RateLimitSchemas } from './validation/securitySchemas';
import { UpstashRateLimitStore } from './rateLimiter/upstashStore';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
  handler?: (req: NextRequest, res: Response) => Response;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

/**
 * Rate limit store interface
 */
interface RateLimitStore {
  get(key: string): RateLimitEntry | undefined | Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry): void | Promise<void>;
  delete(key: string): void | Promise<void>;
  clear(): void | Promise<void>;
  cleanup?(): void;
}

/**
 * In-memory rate limit store
 * In production, use Redis or similar for distributed environments
 */
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private store: RateLimitStore;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(store?: RateLimitStore) {
    if (store) {
      this.store = store;
    } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Use Upstash Redis in production
      try {
        this.store = new UpstashRateLimitStore();
      } catch (error) {
        console.warn('Failed to initialize Upstash store, falling back to memory:', error);
        this.store = new MemoryRateLimitStore();
      }
    } else {
      // Fall back to in-memory store
      this.store = new MemoryRateLimitStore();
    }

    // Only set up cleanup interval for memory store (Redis handles expiration automatically)
    if (this.store instanceof MemoryRateLimitStore) {
      this.cleanupInterval = setInterval(() => {
        if (this.store instanceof MemoryRateLimitStore) {
          this.store.cleanup();
        }
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Get client identifier from request
   */
  private getClientId(req: NextRequest): string {
    // Try to get user ID from session first
    const userId = req.headers.get('x-user-id');
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to IP address
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      'unknown';
    
    return `ip:${ip}`;
  }

  /**
   * Check if request is within rate limits
   */
  async checkLimit(
    req: NextRequest,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const clientId = config.keyGenerator?.(req) || this.getClientId(req);
    const key = `${clientId}:${req.nextUrl.pathname}`;
    const now = Date.now();

    // Get current entry (handle both sync and async stores)
    let entry = await Promise.resolve(this.store.get(key));

    // If no entry or expired, create new one
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequest: now
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      logError(new Error(`Rate limit exceeded for ${clientId}`), {
        category: ErrorCategory.API,
        severity: ErrorSeverity.WARNING,
        context: {
          action: 'rate_limit_exceeded',
          additionalData: {
            clientId,
            path: req.nextUrl.pathname,
            limit: config.max,
            windowMs: config.windowMs,
            retryAfter
          }
        }
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      };
    }

    // Increment count
    entry.count++;
    await Promise.resolve(this.store.set(key, entry));

    return {
      allowed: true,
      remaining: Math.max(0, config.max - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Create rate limit middleware
   */
  createMiddleware(config: RateLimitConfig) {
    return async (req: NextRequest): Promise<Response | null> => {
      const result = await this.checkLimit(req, config);

      if (!result.allowed) {
        const message = config.message || 'Too many requests';
        const statusCode = config.statusCode || 429;

        // Create error response
        const response = new Response(
          JSON.stringify({
            error: message,
            retryAfter: result.retryAfter,
            resetTime: new Date(result.resetTime).toISOString()
          }),
          {
            status: statusCode,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.max.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              ...(result.retryAfter && {
                'Retry-After': result.retryAfter.toString()
              })
            }
          }
        );

        return config.handler?.(req, response) || response;
      }

      return null; // Continue to next middleware
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again later.',
    statusCode: 429
  },

  // Moderate rate limiting for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many API requests. Please try again later.',
    statusCode: 429
  },

  // Loose rate limiting for public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: 'Too many requests. Please try again later.',
    statusCode: 429
  },

  // File upload rate limiting
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Too many file uploads. Please try again later.',
    statusCode: 429
  },

  // Search rate limiting
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: 'Too many search requests. Please try again later.',
    statusCode: 429
  }
};

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter();

/**
 * Rate limit middleware factory
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return globalRateLimiter.createMiddleware(config);
}

/**
 * Apply rate limiting to API route
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  config: RateLimitConfig
) {
  return async (req: NextRequest): Promise<Response> => {
    const middleware = createRateLimitMiddleware(config);
    const rateLimitResponse = await middleware(req);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(req);
  };
}

/**
 * Rate limit decorator for API routes
 */
export function rateLimit(config: RateLimitConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      if (req instanceof Request) {
        const nextReq = req as unknown as NextRequest;
        const middleware = createRateLimitMiddleware(config);
        const rateLimitResponse = await middleware(nextReq);

        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Utility to get rate limit headers
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number,
  retryAfter?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString()
  };

  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return headers;
}

/**
 * Validate rate limit configuration
 */
export function validateRateLimitConfig(config: RateLimitConfig): boolean {
  try {
    RateLimitSchemas.rateLimitConfig.parse(config);
    return true;
  } catch (error) {
    logError(new Error('Invalid rate limit configuration'), {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'validate_rate_limit_config',
        additionalData: { config, error }
      }
    });
    return false;
  }
} 
