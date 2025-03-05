import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, method, headers: requestHeaders, body } = await request.json();
    
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
      method: method || 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      data,
    });
  } catch (error) {
    console.error('Firebase proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Firebase proxy is running' });
} 