'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FirebaseAdminService } from './firebaseAdmin';
import { UserService } from './services/userService';

/**
 * Session duration (5 days)
 */
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

/**
 * Create a session cookie from a Firebase ID token
 */
export async function createSessionCookie(idToken: string, maxAge: number = 60 * 60 * 24 * 5 * 1000): Promise<string | { success: boolean; error?: string }> {
  try {
    // First check if this is a custom token
    if (idToken.startsWith('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.')) {
      console.log('Detected custom token, exchanging for ID token first');
      // We need to exchange the custom token for an ID token
      // This requires client-side auth, which we can't do server-side
      // Instead, return the custom token and let the client handle the exchange
      return idToken;
    }
    
    // Verify the ID token
    const decodedToken = await FirebaseAdminService.getAuth().verifyIdToken(idToken);
    
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