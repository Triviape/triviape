import { NextResponse } from 'next/server';
import { UserService } from '@/app/lib/services/userService';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';

/**
 * API route to create a permanent test account
 * Only use this in development environments!
 */
export async function POST(request: Request) {
  // Security check - only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { 
        success: false, 
        error: 'This endpoint is only available in development mode'
      }, 
      { status: 403 }
    );
  }
  
  try {
    // Default test account credentials
    const DEFAULT_TEST_EMAIL = 'test@example.com';
    const DEFAULT_TEST_PASSWORD = 'Test123!';
    const DEFAULT_TEST_NAME = 'Test User';
    
    // Get custom credentials if provided
    const { 
      email = DEFAULT_TEST_EMAIL, 
      password = DEFAULT_TEST_PASSWORD, 
      displayName = DEFAULT_TEST_NAME 
    } = await request.json().catch(() => ({}));
    
    // Check if account already exists
    try {
      // Try to sign in first to check if the account exists
      await UserService.signInWithEmail(email, password);
      
      // Sign out if successful
      await UserService.signOut();
      
      return NextResponse.json({
        success: true,
        message: 'Test account already exists',
        email,
        displayName,
        created: false
      });
    } catch (signInError) {
      // If error is not because the user doesn't exist, rethrow
      if (signInError.code !== 'auth/user-not-found') {
        throw signInError;
      }
      
      // User doesn't exist, create the account
      const userCredential = await UserService.registerWithEmail(email, password, displayName);
      
      // Sign out immediately
      await UserService.signOut();
      
      return NextResponse.json({
        success: true,
        message: 'Test account created successfully',
        email,
        displayName,
        uid: userCredential.user.uid,
        created: true
      });
    }
  } catch (error) {
    console.error('Create test account error:', error);
    
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