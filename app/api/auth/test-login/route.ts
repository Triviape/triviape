import { NextResponse } from 'next/server';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

/**
 * API route to test Firebase login functionality
 * This endpoint allows testing login without affecting real application state
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
    
    // For testing login, we'll create a temporary user and then try to get it by email
    // This simulates a login without actually using client-side auth
    
    // Generate a random test email if not provided
    const testEmail = email.includes('test_') ? email : `test_${Math.random().toString(36).substring(2, 10)}@example.com`;
    const testPassword = password || 'Test123!';
    const testDisplayName = 'Test User';
    
    // Create a test user
    const userRecord = await FirebaseAdminService.createUser({
      email: testEmail,
      password: testPassword,
      displayName: testDisplayName,
      emailVerified: false
    });
    
    // Verify we can retrieve the user (simulating login)
    const retrievedUser = await FirebaseAdminService.getUserById(userRecord.uid);
    
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
      message: 'Test login successful (user was created, retrieved, and deleted)',
      performanceMs: Math.round(endTime - startTime),
      uid: userRecord.uid,
      email: userRecord.email,
      userDeleted: true
    });
  } catch (error: any) {
    console.error('Test login error:', error);
    
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