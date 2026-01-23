import { NextResponse } from 'next/server';
import { UserService } from '@/app/lib/services/userService';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';

/**
 * API route to test Firebase signin functionality
 * This endpoint allows testing signin with a known test account or any provided credentials
 * ⚠️ GATED: Only available in development/test environments
 */
export async function POST(request: Request) {
  // SECURITY: Gate test endpoints to development environment only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    // Get credentials from request
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields (email or password)'
        }, 
        { status: 400 }
      );
    }
    
    // Start performance measurement
    const startTime = performance.now();
    
    // Perform signin
    const userCredential = await UserService.signInWithEmail(email, password);
    
    // End performance measurement
    const endTime = performance.now();
    
    // Sign out immediately to clean up
    try {
      await UserService.signOut();
    } catch (signOutError) {
      console.warn('Error signing out test user:', signOutError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test signin successful',
      performanceMs: Math.round(endTime - startTime),
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      emailVerified: userCredential.user.emailVerified,
      provider: userCredential.user.providerData[0]?.providerId || 'unknown'
    });
  } catch (error) {
    console.error('Test signin error:', error);
    
    const errorMessage = getAuthErrorMessage(error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : 'unknown';
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 