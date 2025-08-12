import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling, ApiErrorCode } from '@/app/lib/apiUtils';
import { z } from 'zod';

// Define proxy request schema for validation
const proxyRequestSchema = z.object({
  url: z.string().url('Invalid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

/**
 * API route to proxy requests to Firebase
 * This allows frontend clients to make requests to Firebase APIs
 * without exposing sensitive credentials
 */
export async function POST(request: NextRequest) {
  return withApiErrorHandling(request, async () => {
    // Parse and validate request
    const body = await request.json();
    const validationResult = proxyRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw {
        code: 'validation-failed',
        message: 'Invalid proxy request',
        details: validationResult.error.format(),
        statusCode: 400
      };
    }
    
    const { url, method, headers: requestHeaders, body: requestBody } = validationResult.data;
    
    // Create headers object from the request headers
    const headers = new Headers();
    if (requestHeaders) {
      Object.entries(requestHeaders).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers.append(key, value);
        }
      });
    }
    
    // Make the request to Firebase
    const response = await fetch(url, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      throw {
        code: `firebase-error-${response.status}`,
        message: errorData.error || `Firebase request failed with status ${response.status}`,
        details: errorData,
        statusCode: response.status
      };
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return {
      status: response.status,
      statusText: response.statusText,
      data,
    };
  });
}

export async function GET() {
  return NextResponse.json({ status: 'Firebase proxy is running' });
} 