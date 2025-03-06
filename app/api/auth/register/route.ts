import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

/**
 * API route to handle user registration
 * This endpoint uses Firebase Admin to create users on the server side
 */
export async function POST(request: Request) {
  try {
    // Get registration data from request
    const { email, password, displayName } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields (email or password)'
      }, { status: 400 });
    }
    
    try {
      // Create a new user with Firebase Admin
      const userRecord = await FirebaseAdminService.createUser({
        email,
        password,
        displayName: displayName || '',
      });
      
      // Create a custom token for this user
      const customToken = await FirebaseAdminService.createCustomToken(userRecord.uid);
      
      // Return success response with token and user data
      return NextResponse.json({
        success: true,
        token: customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
        }
      }, { status: 201 });
    } catch (error: any) {
      // If the email is already in use
      if (error.code === 'auth/email-already-in-use' || 
          (error.message && error.message.includes('already in use'))) {
        return NextResponse.json({
          success: false,
          error: 'The email address is already in use by another account',
          errorCode: 'auth/email-already-in-use',
        }, { status: 400 });
      }
      
      // If it's any other error, rethrow it
      throw error;
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    
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