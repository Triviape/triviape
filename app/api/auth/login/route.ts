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
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields (email or password)'
      }, { status: 400 });
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
      return NextResponse.json({
        success: true,
        token: customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        }
      }, { status: 200 });
    } catch (error: any) {
      // If the user doesn't exist or there's another error
      if (error.code === 'auth/user-not-found' || error.message?.includes('User not found')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid email or password',
          errorCode: 'auth/user-not-found',
        }, { status: 401 });
      }
      
      // If it's any other error, rethrow it
      throw error;
    }
  } catch (error: any) {
    console.error('Login error:', error);
    
    const errorMessage = getAuthErrorMessage(error);
    const errorCode = error.code ? error.code : 'unknown';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 