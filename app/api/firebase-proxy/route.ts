import { NextRequest } from 'next/server';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { z } from 'zod';
import { auth } from '@/auth';

// Define proxy request schema for validation
const proxyRequestSchema = z.object({
  url: z.string().url('Invalid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

const ALLOWED_FIREBASE_HOSTS = new Set([
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'firebaseremoteconfig.googleapis.com',
]);

const ALLOWED_OUTBOUND_HEADERS = new Set([
  'content-type',
  'authorization',
  'x-firebase-gmpid',
  'x-client-version',
  'x-goog-api-key',
]);

function validateProxyUrl(url: string): URL {
  const parsed = new URL(url);

  if (parsed.protocol !== 'https:') {
    throw {
      code: 'invalid-proxy-url',
      message: 'Only HTTPS proxy targets are allowed',
      statusCode: 400,
    };
  }

  if (!ALLOWED_FIREBASE_HOSTS.has(parsed.hostname)) {
    throw {
      code: 'invalid-proxy-host',
      message: 'Proxy target host is not allowed',
      statusCode: 403,
    };
  }

  return parsed;
}

/**
 * API route to proxy requests to Firebase
 * This allows frontend clients to make requests to Firebase APIs
 * without exposing sensitive credentials
 */
export async function POST(request: NextRequest) {
  return withApiErrorHandling(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw {
        code: 'unauthorized',
        message: 'Authentication required',
        statusCode: 401,
      };
    }

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
    const validatedUrl = validateProxyUrl(url);
    
    // Create headers object from the request headers
    const headers = new Headers();
    headers.set('x-proxied-by', 'triviape-server');
    if (requestHeaders) {
      Object.entries(requestHeaders).forEach(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        if (typeof value === 'string' && ALLOWED_OUTBOUND_HEADERS.has(normalizedKey)) {
          headers.append(key, value);
        }
      });
    }
    
    // Make the request to Firebase
    const response = await fetch(validatedUrl.toString(), {
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

export async function GET(request: NextRequest) {
  return withApiErrorHandling(request, async () => {
    return { status: 'Firebase proxy is running' };
  });
} 
