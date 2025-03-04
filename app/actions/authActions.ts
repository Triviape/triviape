'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { UserService } from '@/app/lib/services/userService';
import { createSessionCookie, revokeSession } from '@/app/lib/authUtils';

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
    
    // Sign in with Firebase Auth
    const result = await UserService.signInWithEmail(
      validatedFields.data.email,
      validatedFields.data.password
    );
    
    // Get the user's ID token for session creation
    const idToken = await result.user.getIdToken();
    
    // Create a session cookie
    const sessionResult = await createSessionCookie(idToken);
    
    if (!sessionResult.success) {
      return {
        success: false,
        error: 'Failed to create session',
      };
    }
    
    // Update last login
    await UserService.updateLastLogin(result.user.uid);
    
    return {
      success: true,
      redirectTo: formData.get('redirectTo')?.toString() || '/dashboard',
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = 'Failed to sign in';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many login attempts. Please try again later';
    }
    
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
    
    // Register with Firebase Auth
    const result = await UserService.registerWithEmail(
      validatedFields.data.email,
      validatedFields.data.password,
      validatedFields.data.displayName
    );
    
    // Get the user's ID token for session creation
    const idToken = await result.user.getIdToken();
    
    // Create a session cookie
    const sessionResult = await createSessionCookie(idToken);
    
    if (!sessionResult.success) {
      return {
        success: false,
        error: 'Failed to create session',
      };
    }
    
    return {
      success: true,
      redirectTo: '/dashboard',
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific Firebase Auth errors
    let errorMessage = 'Failed to register';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    }
    
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
  await revokeSession();
  redirect('/');
} 