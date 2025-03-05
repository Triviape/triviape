import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for user profile
 * This is a protected route that requires authentication
 */
export async function GET(req: NextRequest) {
  // Check if the request has an authorization header with "Bearer expired-token"
  const authHeader = req.headers.get('authorization');
  if (authHeader === 'Bearer expired-token') {
    return {
      status: 401,
      data: {
        success: false,
        error: 'Token expired'
      }
    } as any;
  }
  
  // Check if the request has an authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      data: {
        success: false,
        error: 'Authentication required'
      }
    } as any;
  }
  
  // For testing purposes, extract the token and check if it's valid
  const token = authHeader.substring(7);
  
  // Return mock user profile data
  return {
    status: 200,
    data: {
      success: true,
      profile: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      }
    }
  } as any;
}

/**
 * PUT handler for updating user profile
 * This is a protected route that requires authentication
 */
export async function PUT(req: NextRequest) {
  // Check if the request has an authorization header with "Bearer expired-token"
  const authHeader = req.headers.get('authorization');
  if (authHeader === 'Bearer expired-token') {
    return {
      status: 401,
      data: {
        success: false,
        error: 'Token expired'
      }
    } as any;
  }
  
  // Check if the request has an authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      data: {
        success: false,
        error: 'Authentication required'
      }
    } as any;
  }
  
  try {
    // Parse the request body
    const body = await req.json();
    
    // Return updated user profile
    return {
      status: 200,
      data: {
        success: true,
        profile: {
          id: 'test-user-id',
          ...body,
          updatedAt: new Date().toISOString(),
        }
      }
    } as any;
  } catch (error) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'Invalid request body'
      }
    } as any;
  }
} 