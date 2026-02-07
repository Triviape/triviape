'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FirebaseAdminService } from './firebaseAdmin';

/**
 * Create a session cookie from a Firebase ID token
 */
export async function createSessionCookie(idToken: string, maxAge: number = 60 * 60 * 24 * 5 * 1000): Promise<string | { success: boolean; error?: string }> {
  try {
    // Verify the ID token
    await FirebaseAdminService.getAuth().verifyIdToken(idToken);
    
    // Create a session cookie
    const sessionCookie = await FirebaseAdminService.getAuth().createSessionCookie(idToken, {
      expiresIn: maxAge,
    });
    
    // Set the cookie - cookies() returns a Promise in Next.js 14
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAge / 1000, // Convert to seconds
      path: '/',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error creating session'
    };
  }
}

/**
 * Revoke the session cookie by clearing it
 * This should be called when a user signs out
 */
export async function revokeSession() {
  try {
    // Get the session cookie - cookies() returns a Promise in Next.js 14
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (sessionCookie) {
      // Verify and revoke the session
      const decodedToken = await FirebaseAdminService.getAuth().verifySessionCookie(sessionCookie);
      await FirebaseAdminService.getAuth().revokeRefreshTokens(decodedToken.uid);
    }
    
    // Clear the cookie
    const cookieStoreForDelete = await cookies();
    cookieStoreForDelete.delete('session');
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking session:', error);
    
    // Clear the cookie anyway to be safe
    const cookieStoreForDelete = await cookies();
    cookieStoreForDelete.delete('session');
    
    return { success: false, error: 'Failed to sign out properly' };
  }
}

/**
 * Get the authenticated user from the session cookie
 * Returns null if the user is not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    // Get the session cookie - cookies() returns a Promise in Next.js 14
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    const decodedToken = await FirebaseAdminService.getAuth().verifySessionCookie(sessionCookie, true);
    const userRecord = await FirebaseAdminService.getAuth().getUser(decodedToken.uid);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      customClaims: userRecord.customClaims || {}
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Check if the user is authenticated and redirect if not
 * This can be used in server components or server actions
 */
export async function requireAuth(redirectTo = '/login') {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
} 
