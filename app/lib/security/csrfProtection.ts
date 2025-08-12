import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * CSRF Protection Configuration
 */
interface CSRFConfig {
  cookieName: string;
  headerName: string;
  tokenLength: number;
  maxAge: number; // in seconds
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  httpOnly: boolean;
}

/**
 * Default CSRF configuration
 */
const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  maxAge: 60 * 60 * 24, // 24 hours
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // Must be false so client can read it for headers
};

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateToken(tokenLength: number = DEFAULT_CSRF_CONFIG.tokenLength): string {
  return randomBytes(tokenLength).toString('hex');
}

/**
 * Sign a token with a secret for additional security
 */
function signToken(token: string, secret: string): string {
  return createHash('sha256')
    .update(token + secret)
    .digest('hex');
}

/**
 * Create a double-submit cookie token pair
 * Returns both the token and a signed version for validation
 */
export function createTokenPair(secret: string, config: Partial<CSRFConfig> = {}): { token: string; signature: string } {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const token = generateToken(finalConfig.tokenLength);
  const signature = signToken(token, secret);
  return { token, signature };
}

/**
 * Verify a token against its signature
 */
function verifyTokenSignature(token: string, signature: string, secret: string): boolean {
  const expectedSignature = signToken(token, secret);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Set CSRF token in cookies for server-side use
 */
export async function setTokenCookie(token: string, config: Partial<CSRFConfig> = {}): Promise<void> {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const cookieStore = await cookies();
  
  cookieStore.set({
    name: finalConfig.cookieName,
    value: token,
    httpOnly: finalConfig.httpOnly,
    secure: finalConfig.secure,
    sameSite: finalConfig.sameSite,
    maxAge: finalConfig.maxAge,
    path: '/',
  });
}

/**
 * Get CSRF token from cookies
 */
export async function getTokenFromCookie(config: Partial<CSRFConfig> = {}): Promise<string | null> {
  try {
    const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(finalConfig.cookieName);
    return tokenCookie?.value || null;
  } catch {
    return null;
  }
}

/**
 * Validate CSRF token from request
 */
export function validateToken(request: NextRequest, sessionSecret?: string, config: Partial<CSRFConfig> = {}): boolean {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  
  // Skip validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // Get token from header
  const headerToken = request.headers.get(finalConfig.headerName);
  if (!headerToken) {
    return false;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(finalConfig.cookieName)?.value;
  if (!cookieToken) {
    return false;
  }

  // Double-submit cookie validation
  const tokensMatch = timingSafeEqual(
    Buffer.from(headerToken, 'hex'),
    Buffer.from(cookieToken, 'hex')
  );

  if (!tokensMatch) {
    return false;
  }

  // Additional signature validation if session secret is provided
  if (sessionSecret) {
    const signature = request.headers.get('x-csrf-signature');
    if (signature) {
      return verifyTokenSignature(headerToken, signature, sessionSecret);
    }
  }

  return true;
}

/**
 * Add CSRF token to response headers and cookies
 */
export function addTokenToResponse(response: NextResponse, token?: string, config: Partial<CSRFConfig> = {}): NextResponse {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const csrfToken = token || generateToken(finalConfig.tokenLength);
  
  // Set cookie
  response.cookies.set({
    name: finalConfig.cookieName,
    value: csrfToken,
    httpOnly: finalConfig.httpOnly,
    secure: finalConfig.secure,
    sameSite: finalConfig.sameSite,
    maxAge: finalConfig.maxAge,
    path: '/',
  });

  // Add to response headers for client-side access
  response.headers.set('X-CSRF-Token', csrfToken);

  return response;
}

/**
 * Generate CSRF token for forms
 */
export async function generateFormToken(config: Partial<CSRFConfig> = {}): Promise<string> {
  const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
  const token = generateToken(finalConfig.tokenLength);
  await setTokenCookie(token, finalConfig);
  return token;
}

/**
 * Middleware function for CSRF protection
 */
export function createCSRFMiddleware(config: Partial<CSRFConfig> = {}) {
  return async (request: NextRequest) => {
    const finalConfig = { ...DEFAULT_CSRF_CONFIG, ...config };
    
    // Validate token for state-changing requests
    if (!validateToken(request, undefined, finalConfig)) {
      return new NextResponse(
        JSON.stringify({
          error: 'CSRF token validation failed',
          message: 'Invalid or missing CSRF token'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.next();
  };
}

/**
 * Global CSRF protection instance
 */
export const csrfProtection = {
  generateToken,
  createTokenPair,
  setTokenCookie,
  getTokenFromCookie,
  validateToken,
  addTokenToResponse,
  generateFormToken,
  createCSRFMiddleware,
  config: DEFAULT_CSRF_CONFIG
};

// Legacy exports for backward compatibility
export async function generateCSRFToken(): Promise<string> {
  return generateFormToken();
}

export function validateCSRFToken(request: NextRequest): boolean {
  return validateToken(request);
}

export function addCSRFToResponse(response: NextResponse): NextResponse {
  return addTokenToResponse(response);
}

export interface CSRFTokenData {
  token: string;
  headerName: string;
}

export async function getCSRFTokenData(): Promise<CSRFTokenData> {
  const token = await generateFormToken();
  return {
    token,
    headerName: DEFAULT_CSRF_CONFIG.headerName
  };
}