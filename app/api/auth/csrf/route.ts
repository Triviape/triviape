import { NextResponse } from 'next/server';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { generateCSRFToken, addTokenToResponse } from '@/app/lib/security/csrfProtection';

/**
 * API route to generate and provide CSRF tokens (same token on body + response cookies).
 */
export async function GET(request: Request) {
  return withApiErrorHandling(
    request,
    async () => {
      const csrfToken = await generateCSRFToken();
      return {
        token: csrfToken,
        headerName: 'x-csrf-token' as const,
      };
    },
    {
      responseHandler: (response, result) => {
        addTokenToResponse(response as NextResponse, result.token);
      },
    },
  );
}

/** Refresh CSRF token (same as GET for this endpoint). */
export async function POST(request: Request) {
  return GET(request);
}
