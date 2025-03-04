import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from './app/lib/firebaseAdmin';

/**
 * Middleware to handle authentication and protected routes
 */
export async function middleware(request: NextRequest) {
  // Get the session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  
  // Check for authentication status based on the route
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/register');
  
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/profile') ||
                          request.nextUrl.pathname.startsWith('/admin');
  
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  // Non-protected routes can proceed without authentication
  if (!isProtectedRoute && !isAuthRoute && !isApiRoute) {
    return NextResponse.next();
  }

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && isProtectedRoute) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Verify session for protected routes and API routes
  if (sessionCookie && (isProtectedRoute || isApiRoute)) {
    try {
      // Verify the session
      await adminAuth.verifySessionCookie(sessionCookie, true);
      
      // Additional route protection for admin routes
      if (request.nextUrl.pathname.startsWith('/admin')) {
        // Verify admin claims
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        if (!decodedToken.admin) {
          // Not an admin, redirect to home
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
      
      // Session is valid and user has correct permissions
      return NextResponse.next();
    } catch (error) {
      // Session is invalid, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // If authenticated and trying to access auth routes, redirect to dashboard
  if (sessionCookie && isAuthRoute) {
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Session is invalid but they're trying to login anyway, so allow it
      return NextResponse.next();
    }
  }

  // All other cases
  return NextResponse.next();
}

/**
 * Configure which routes the middleware will run on
 */
export const config = {
  matcher: [
    // Routes that always check auth
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/api/:path*',
    
    // Auth routes (to redirect if already logged in)
    '/login',
    '/register',
  ],
}; 