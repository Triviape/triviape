import NextAuth from 'next-auth';
import { authConfig } from '@/app/api/auth/[...nextauth]/route';

/**
 * Auth configuration and utilities
 * Provides typed authentication functions for the application
 */
export const { 
  auth, 
  signIn, 
  signOut,
  handlers
} = NextAuth(authConfig);

/**
 * Re-export types for use throughout the application
 */
export type { Session, User } from 'next-auth'; 