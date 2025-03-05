import { NextResponse } from 'next/server';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

/**
 * API route to test Firebase signup functionality
 * This endpoint allows testing signup without affecting real application state
 */
export async function POST(request: Request) {
  try {
    // Get credentials from request
    const { email, password, displayName } = await request.json();
    
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields (email, password, or displayName)'
        }, 
        { status: 400 }
      );
    }
    
    // Start performance measurement
    const startTime = performance.now();
    
    // Create a user with Firebase Admin
    const userRecord = await FirebaseAdminService.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });
    
    // End performance measurement
    const endTime = performance.now();
    
    // Clean up - delete the test user immediately
    try {
      await FirebaseAdminService.deleteUser(userRecord.uid);
    } catch (deleteError) {
      console.warn('Error cleaning up test user:', deleteError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test signup successful (user was created and deleted)',
      performanceMs: Math.round(endTime - startTime),
      uid: userRecord.uid,
      email: userRecord.email,
      userDeleted: true
    });
  } catch (error: any) {
    console.error('Test signup error:', error);
    
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