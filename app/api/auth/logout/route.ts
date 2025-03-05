import { cookies } from 'next/headers';

/**
 * API route to handle user logout
 * This endpoint clears the session cookie
 */
export async function POST(request: Request) {
  try {
    // Return success response with cleared cookie
    return {
      status: 200,
      data: {
        success: true,
        message: 'Logged out successfully'
      },
      headers: new Headers({
        'Set-Cookie': 'session=; Path=/; Max-Age=0; SameSite=Lax'
      })
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    
    return {
      status: 500,
      data: {
        success: false,
        error: 'An error occurred during logout',
        timestamp: new Date().toISOString()
      }
    };
  }
} 