'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { userService } from '@/app/lib/services/user';
import { createSessionCookie, revokeSession } from '@/app/lib/authUtils';
import { getAuthErrorMessage } from '@/app/lib/authErrorHandler';
import { FirebaseError } from 'firebase/app';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { AuthResult } from '@/app/types/user';

// Schema for login
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for registration
const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
});

/**
 * Server action to handle login
 */
export async function login(prevState: any, formData: FormData) {
  try {
    // Validate form data
    const rawInput = {
      email: formData.get('email'),
      password: formData.get('password'),
    };
    
    const validatedFields = LoginSchema.safeParse(rawInput);
    
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    // Client-side login only; server actions should use NextAuth directly
    const result = await userService.signInWithEmail(
      validatedFields.data.email,
      validatedFields.data.password
    );
    
    // Get the user's ID token for session creation
    const idToken = await result.user.getIdToken();
    
    // Create a session cookie
    const sessionResult = await createSessionCookie(idToken);
    
    if (sessionResult && typeof sessionResult === 'object' && !sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error || 'Failed to create session',
      };
    }
    
    // Update last login
    await userService.updateLastLogin(result.user.uid);
    
    return {
      success: true,
      redirectTo: formData.get('redirectTo')?.toString() || '/dashboard',
    };
  } catch (error) {
    console.error('Login error:', error);
    
    // Use the error handler to get a user-friendly message
    const errorMessage = getAuthErrorMessage(error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server action to handle registration
 */
export async function register(prevState: any, formData: FormData) {
  try {
    // Validate form data
    const rawInput = {
      email: formData.get('email'),
      password: formData.get('password'),
      displayName: formData.get('displayName'),
    };
    
    const validatedFields = RegisterSchema.safeParse(rawInput);
    
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    
    // Client-side registration only; server actions should use NextAuth directly
    const result = await userService.registerWithEmail(
      validatedFields.data.email,
      validatedFields.data.password,
      validatedFields.data.displayName
    );
    
    // Get the user's ID token for session creation
    const idToken = await result.user.getIdToken();
    
    // Create a session cookie
    const sessionResult = await createSessionCookie(idToken);
    
    if (sessionResult && typeof sessionResult === 'object' && !sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error || 'Failed to create session',
      };
    }
    
    return {
      success: true,
      redirectTo: formData.get('redirectTo')?.toString() || '/dashboard',
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Use the error handler to get a user-friendly message
    const errorMessage = getAuthErrorMessage(error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server action to handle logout
 */
export async function logout() {
  try {
    await revokeSession();
    redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, redirect to home
    redirect('/');
  }
}

/**
 * Direct API for login with email and password
 * This is used by the API routes
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<AuthResult> {
  try {
    // First, authenticate the user with Firebase Admin
    const userRecord = await FirebaseAdminService.getUserByEmail(email);
    
    // Generate a custom token for this user
    const customToken = await FirebaseAdminService.createCustomToken(userRecord.uid);
    
    // Return the custom token - client side will need to exchange this for an ID token
    return {
      success: true,
      message: 'Login successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || email,
        displayName: userRecord.displayName || '',
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during login',
    };
  }
}

/**
 * Direct API for registering a new user
 * This is used by the API routes
 */
export async function registerNewUser(
  email: string, 
  password: string, 
  displayName: string
): Promise<AuthResult> {
  try {
    // Create the user with Firebase Admin
    const userRecord = await FirebaseAdminService.createUser({
      email,
      password,
      displayName,
    });
    
    // Generate a custom token for this user
    const customToken = await FirebaseAdminService.createCustomToken(userRecord.uid);
    
    // Return the custom token - client side will need to exchange this for an ID token
    return {
      success: true,
      message: 'Registration successful',
      token: customToken,
      user: {
        uid: userRecord.uid,
        email: userRecord.email || email,
        displayName: userRecord.displayName || displayName,
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during registration',
    };
  }
} 
