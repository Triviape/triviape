import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  // If the user is not authenticated and trying to access a protected route,
  // they will be redirected to the sign-in page by NextAuth automatically
  return NextResponse.next();
});

// Optionally, you can also export a config with a matcher
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/quizzes/create/:path*',
    '/quizzes/edit/:path*',
    '/settings/:path*',
  ],
}; 