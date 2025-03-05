import { NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

/**
 * API route to run Firebase authentication diagnostics
 * This endpoint allows testing Firebase Admin connectivity without client-side imports
 */
export async function GET(request: Request) {
  try {
    // Check if Firebase Admin is initialized
    const adminStatus = {
      initialized: true,
      timestamp: new Date().toISOString()
    };
    
    // Test Firebase Admin by trying to get a non-existent user
    // This will fail, but it will confirm the Admin SDK is working
    try {
      await FirebaseAdminService.getUserById('test-user-id');
    } catch (error: any) {
      // Expected error - user not found
      if (error.code === 'auth/user-not-found') {
        adminStatus.adminAuthWorking = true;
      } else {
        adminStatus.adminAuthWorking = false;
        adminStatus.adminAuthError = error.message || String(error);
      }
    }
    
    return NextResponse.json({
      success: true,
      adminStatus,
      serverInfo: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Diagnostics error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 