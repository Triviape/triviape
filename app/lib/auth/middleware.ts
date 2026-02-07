import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { withRateLimit, RateLimitConfigs } from '../rateLimiter';
import { logError, ErrorCategory, ErrorSeverity } from '../errorHandler';
import { validateSessionFingerprint, sessionFingerprintManager } from '../security/sessionFingerprinting';

/**
 * Middleware types for route protection
 */
interface RouteConfig {
  path: string;
  protected: boolean;
}

/**
 * Session information interface
 */
interface SessionInfo {
  user?: {
    id: string;
    email?: string;
    role?: string;
  } | null;
  expires?: string;
}

/**
 * Route patterns for different types of routes
 * Using constants improves readability and maintainability
 */
const AUTH_ROUTE_PATTERNS = ['/login', '/register', '/auth'];
const PROTECTED_ROUTE_PATTERNS = [
  '/dashboard',
  '/profile',
  '/admin',
  '/daily',
  '/team',
  '/challenge'
];
const API_ROUTE_PATTERN = '/api';

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
 * Checks if a pathname starts with any of the given patterns
 * @param pathname The URL pathname to check
 * @param patterns Array of path patterns to match against
 * @returns Boolean indicating if the pathname matches any pattern
 */
function matchesAnyPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Validate request for security threats
 */
function validateRequest(req: NextRequest): { valid: boolean; errors?: string[] } {
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
  
  // Check request size
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    errors.push('Request body too large');
  }
  
  // Check for suspicious query parameters
  const url = new URL(req.url);
  const suspiciousParams = ['__proto__', 'constructor', 'prototype'];
  for (const param of suspiciousParams) {
    if (url.searchParams.has(param)) {
      errors.push(`Suspicious query parameter: ${param}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders<T extends Response>(response: T): T {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Enhanced middleware to handle authentication, security, and protected routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Security validation
  const securityValidation = validateRequest(request);
  if (!securityValidation.valid) {
    logError(new Error('Security validation failed'), {
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'middleware_security_validation',
        additionalData: { errors: securityValidation.errors, pathname }
      }
    });
    
    return new NextResponse(
      JSON.stringify({
        error: 'Security validation failed',
        details: securityValidation.errors
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
  
  // 2. Rate limiting for API routes with route-specific configs
  if (pathname.startsWith(API_ROUTE_PATTERN)) {
    let rateLimitConfig = RateLimitConfigs.api; // Default

    // Route-specific rate limit configurations
    if (pathname.startsWith('/api/auth/')) {
      rateLimitConfig = RateLimitConfigs.auth; // 5/15min
    } else if (pathname.startsWith('/api/upload') || pathname.includes('/avatar')) {
      rateLimitConfig = RateLimitConfigs.upload; // 10/hr
    } else if (pathname.includes('/search')) {
      rateLimitConfig = RateLimitConfigs.search; // 30/min
    } else if (pathname.match(/\/api\/(daily-quiz|public)/)) {
      rateLimitConfig = RateLimitConfigs.public; // 1000/min
    }

    const rateLimitedHandler = withRateLimit(async (req: NextRequest) => {
      return NextResponse.next();
    }, rateLimitConfig);

    const rateLimitResponse = await rateLimitedHandler(request);
    if (rateLimitResponse) {
      return applySecurityHeaders(rateLimitResponse);
    }
  }
  
  // 3. Check for authentication status based on the route
  const isAuthRoute = matchesAnyPattern(pathname, AUTH_ROUTE_PATTERNS);
  const isProtectedRoute = matchesAnyPattern(pathname, PROTECTED_ROUTE_PATTERNS);
  const isApiRoute = pathname.startsWith(API_ROUTE_PATTERN);
  
  // Non-protected routes can proceed without authentication
  if (!isProtectedRoute && !isAuthRoute && !isApiRoute) {
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  }

  // 4. Get authentication session
  const session = await auth();
  const isAuthenticated = !!session;

  // 5. Handle authentication logic
  if (!isAuthenticated && isProtectedRoute) {
    // Redirect to login for unauthenticated users trying to access protected routes
    const url = new URL('/auth', request.url);
    url.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(url);
    return applySecurityHeaders(response);
  }

  // 5.5. Session fingerprint validation for authenticated users
  if (isAuthenticated && session?.user) {
    try {
      const fingerprintComparison = await validateSessionFingerprint(request);
      
      // Log suspicious activity for monitoring
      if (fingerprintComparison.riskLevel === 'high') {
        logError(new Error('High-risk session detected'), {
          category: ErrorCategory.SECURITY,
          severity: ErrorSeverity.WARNING,
          context: {
            action: 'session_fingerprint_validation',
            additionalData: {
              userId: session.user.id,
              userEmail: session.user.email,
              score: fingerprintComparison.score,
              differences: fingerprintComparison.differences,
              riskLevel: fingerprintComparison.riskLevel,
              pathname
            }
          }
        });
      }
      
      // For very suspicious sessions, require re-authentication
      if (fingerprintComparison.riskLevel === 'high' && fingerprintComparison.score < 30) {
        // Clear the session fingerprint to force re-establishment
        await sessionFingerprintManager.clearFingerprint();
        
        // Redirect to login with a security notice
        const url = new URL('/auth', request.url);
        url.searchParams.set('redirect', pathname);
        url.searchParams.set('security_check', 'true');
        const response = NextResponse.redirect(url);
        return applySecurityHeaders(response);
      }
    } catch (error) {
      // Log fingerprint validation errors but don't block the request
      logError(error instanceof Error ? error : new Error('Fingerprint validation failed'), {
        category: ErrorCategory.SECURITY,
        severity: ErrorSeverity.WARNING,
        context: {
          action: 'session_fingerprint_validation_error',
          additionalData: { pathname, userId: session.user.id }
        }
      });
    }
  }

  // 6. Handle API routes with authentication
  if (isApiRoute) {
    // For API routes, check if authentication is required
    const requiresAuth = !pathname.includes('/auth/') && 
                        !pathname.includes('/public/') && 
                        !pathname.includes('/health');
    
    if (requiresAuth && !isAuthenticated) {
      return new NextResponse(
        JSON.stringify({
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...SECURITY_HEADERS
          }
        }
      );
    }
  }

  // 7. Handle authenticated users trying to access auth routes
  if (isAuthenticated && isAuthRoute) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    return applySecurityHeaders(response);
  }

  // 8. Add user context to headers for API routes
  if (isApiRoute && isAuthenticated && session?.user) {
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email || '');
    response.headers.set('x-user-role', session.user.role || 'user');
    return applySecurityHeaders(response);
  }

  // 9. Default: allow the request to proceed
  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

/**
 * Configure which routes the middleware will run on
 */
export const config = {
  matcher: [
    // Routes that always check auth and security
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/api/:path*',
    '/daily/:path*',
    '/team/:path*',
    '/challenge/:path*',
    // Auth routes
    '/auth/:path*',
    '/login',
    '/register',
    // Add security headers to all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 
