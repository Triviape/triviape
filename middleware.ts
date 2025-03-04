import { NextRequest, NextResponse } from 'next/server';

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

  // For protected routes and API routes with a session cookie
  if (sessionCookie && (isProtectedRoute || isApiRoute)) {
    // Instead of verifying the session directly in middleware (which uses Edge Runtime),
    // we'll rely on the session cookie being present and let the server-side API routes
    // or server components handle the actual verification
    
    // For admin routes, we'll do a basic check based on the cookie presence
    // The actual admin verification will happen in the server component or API route
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // We'll implement a more robust check in the admin pages/API routes
      // For now, just let it through if they have a session cookie
    }
    
    // Session cookie exists, proceed to the route
    return NextResponse.next();
  }

  // If authenticated and trying to access auth routes, redirect to dashboard
  if (sessionCookie && isAuthRoute) {
    // Redirect to dashboard if they have a session cookie
    // The actual verification will happen in the dashboard page
    return NextResponse.redirect(new URL('/dashboard', request.url));
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