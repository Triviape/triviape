'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from './firebaseAdmin';
import { UserService } from './services/userService';

/**
 * Session duration (5 days)
 */
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000;

/**
 * Create a session cookie from an ID token
 * This should be called from a server action when a user signs in
 */
export async function createSessionCookie(idToken: string) {
  try {
    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION
    });
    
    // Set the cookie in the browser
    // @ts-ignore - Next.js types are not up to date
    cookies().set({
      name: 'session',
      value: sessionCookie,
      maxAge: SESSION_DURATION / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    // Update the last login timestamp
    await UserService.updateLastLogin(decodedToken.uid);
    
    return { success: true };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Revoke the session cookie by clearing it
 * This should be called when a user signs out
 */
export async function revokeSession() {
  try {
    // Get the session cookie
    // @ts-ignore - Next.js types are not up to date
    const sessionCookie = cookies().get('session')?.value;
    
    if (sessionCookie) {
      // Verify and revoke the session
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedToken.uid);
    }
    
    // Clear the cookie
    // @ts-ignore - Next.js types are not up to date
    cookies().delete('session');
    
    return { success: true };
  } catch (error) {
    console.error('Error revoking session:', error);
    
    // Clear the cookie anyway to be safe
    // @ts-ignore - Next.js types are not up to date
    cookies().delete('session');
    
    return { success: false, error: 'Failed to sign out properly' };
  }
}

/**
 * Get the authenticated user from the session cookie
 * Returns null if the user is not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    // @ts-ignore - Next.js types are not up to date
    const sessionCookie = cookies().get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    
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