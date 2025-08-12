import { NextResponse } from 'next/server';
import { generateCSRFToken, addCSRFToResponse } from '@/app/lib/security/csrfProtection';

/**
 * API route to generate and provide CSRF tokens
 */
export async function GET() {
  try {
    // Generate a new CSRF token
    const csrfToken = await generateCSRFToken();
    
    // Create response with token
    const response = NextResponse.json({
      success: true,
      data: {
        token: csrfToken,
        headerName: 'x-csrf-token'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });

    // Add CSRF token to response headers and cookies
    return addCSRFToResponse(response);
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate CSRF token'
    }, { status: 500 });
  }
}

/**
 * Refresh CSRF token (same as GET for this endpoint)
 */
export async function POST() {
  return GET();
}