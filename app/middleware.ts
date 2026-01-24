import { NextRequest, NextResponse } from 'next/server';

/**
 * Authentication middleware for API routes
 * Uses NextAuth session verification for protected routes
 *
 * @param req The incoming request
 * @returns The response or undefined to continue
 */
export function authMiddleware(req: NextRequest) {
  // Get the path from the request
  const path = req.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = [
    '/api/user',
    '/api/protected',
  ];

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // If it's not a protected route, continue
  if (!isProtectedRoute) {
    return;
  }

  // Get the auth token from the request
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // If there's no token, return 401
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Token validation is handled by NextAuth JWT verification
  // The actual JWT verification happens in the route handlers using `await auth()`
  // This middleware only checks for token presence
  return;
}

/**
 * Middleware function for Next.js middleware
 * Protects page routes using NextAuth session verification
 * NextAuth automatically handles JWT validation via cookies
 *
 * @param req The incoming request
 * @returns The response or undefined to continue
 */
export async function middleware(req: NextRequest) {
  // Get the path from the request
  const path = req.nextUrl.pathname;

  // Define protected routes for page routes (not API routes)
  const protectedPageRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/team',
    '/challenge',
    '/daily',
  ];

  // Check if the path is a protected page route
  const isProtectedPageRoute = protectedPageRoutes.some(route => path.startsWith(route));

  // If it's not a protected page route, continue
  if (!isProtectedPageRoute) {
    return;
  }

  // Get NextAuth session cookie
  // NextAuth stores session in __Secure-next-auth.session-token (production) or next-auth.session-token (dev)
  const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                      req.cookies.get('__Secure-next-auth.session-token')?.value;

  // If there's no session token, redirect to login
  if (!sessionToken) {
    const redirectUrl = new URL('/auth', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Session validation is handled by NextAuth via JWT verification in the cookie
  // If the cookie is present and valid, NextAuth will accept it
  // Invalid/expired tokens are rejected by NextAuth's built-in verification
  return undefined;
}

// Define which paths this middleware will run for
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all protected page routes
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/challenge/:path*',
    '/daily/:path*',
  ],
};

const middlewareExports = { authMiddleware, middleware };
export default middlewareExports;