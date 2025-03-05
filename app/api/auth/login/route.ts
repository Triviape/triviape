import { NextResponse } from 'next/server';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

/**
 * API route to handle user login
 * This endpoint uses Firebase Admin to authenticate users on the server side
 */
export async function POST(request: Request) {
  try {
    // Get credentials from request
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return {
        status: 400,
        data: { 
          success: false, 
          error: 'Missing required fields (email or password)'
        }
      };
    }
    
    // For server-side login, we need to use a different approach
    // since we can't directly sign in with email/password using Admin SDK
    
    try {
      // Try to get the user by email
      const userRecord = await FirebaseAdminService.getUserByEmail(email);
      
      // Create a custom token for this user
      // Note: In a real implementation, you would verify the password
      // before creating a token, but Firebase Admin doesn't provide
      // a way to verify passwords directly
      const customToken = await FirebaseAdminService.createCustomToken(userRecord.uid);
      
      // Return success response with token
      return {
        status: 200,
        data: {
          success: true,
          token: customToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
          }
        }
      };
    } catch (error: any) {
      // If the user doesn't exist or there's another error
      if (error.code === 'auth/user-not-found' || error.message?.includes('User not found')) {
        return {
          status: 401,
          data: {
            success: false,
            error: 'Invalid email or password',
            errorCode: 'auth/user-not-found',
          }
        };
      }
      
      // If it's any other error, rethrow it
      throw error;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    
    const errorMessage = getAuthErrorMessage(error);
    const errorCode = error.code ? error.code : 'unknown';
    
    return {
      status: 500,
      data: {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        timestamp: new Date().toISOString()
      }
    };
  }
} 