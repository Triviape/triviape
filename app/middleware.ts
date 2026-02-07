import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  middleware as sharedMiddleware,
  config as sharedConfig,
} from '@/app/lib/auth/middleware';

/**
 * Backward-compatible auth header presence check used by older tests/callers.
 */
export function authMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const protectedRoutes = ['/api/user', '/api/protected'];
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  if (!isProtectedRoute) {
    return;
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  return;
}

export const middleware = sharedMiddleware;
export const config = sharedConfig;

const middlewareExports = { authMiddleware, middleware };
export default middlewareExports;
