import type { NextAuthConfig } from 'next-auth';
import { getAuth } from '@/app/lib/firebase';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import NextAuth from 'next-auth';
import { z } from 'zod';

// Define the credentials type
interface FirebaseCredentials {
  email: string;
  password: string;
}

// Add rate limiting to login endpoint
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
};

// Enhance password requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Add more specific error messages
const AUTH_ERROR_MESSAGES = {
  ...existingMessages,
  'auth/invalid-session': 'Your session has expired. Please log in again.',
  'auth/concurrent-login': 'You have been logged in from another device.',
  'auth/password-leaked': 'This password has been compromised. Please change it immediately.'
};

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Firebase',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials) {
          console.error('No credentials provided');
          throw new Error('No credentials provided');
        }

        const { email, password } = credentials as FirebaseCredentials;
        
        if (!email || !password) {
          console.error('Missing email or password');
          throw new Error('Please provide both email and password');
        }
        
        try {
          const auth = getAuth();
          console.log('Attempting Firebase sign in for email:', email);
          
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          
          const { user } = userCredential;
          
          if (!user) {
            console.error('No user returned from Firebase');
            throw new Error('Authentication failed');
          }

          console.log('Successfully authenticated user:', user.email);
          
          // Return the user object that will be stored in the token
          return {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            image: user.photoURL
          };
        } catch (error: any) {
          console.error('Firebase authentication error:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          
          // Throw specific error messages based on Firebase error codes
          switch (error.code) {
            case 'auth/user-not-found':
              throw new Error('No user found with this email');
            case 'auth/wrong-password':
              throw new Error('Invalid password');
            case 'auth/invalid-email':
              throw new Error('Invalid email format');
            case 'auth/user-disabled':
              throw new Error('This account has been disabled');
            default:
              throw new Error(error.message || 'Authentication failed');
          }
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        // Initial sign in
        if (user) {
          console.log('Setting JWT token for user:', user.email);
          token.id = user.id;
          token.email = user.email;
        }
        return token;
      } catch (error) {
        console.error('Error in JWT callback:', error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        if (token && session.user) {
          console.log('Setting session for user:', token.email);
          session.user.id = token.id as string;
          session.user.email = token.email as string;
        }
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        throw error;
      }
    }
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(error: Error) {
      console.error('NextAuth error:', error);
    },
    warn(code: string) {
      console.warn('NextAuth warning:', code);
    },
    debug(code: string, metadata: unknown) {
      console.log('NextAuth debug:', { code, metadata });
    }
  }
};

// Create the handler using the authConfig
const handler = NextAuth(authConfig);

// Export the handler for GET and POST requests
export { handler as GET, handler as POST };

// Implement token refresh
const refreshToken = async () => {
  try {
    const user = getAuth().currentUser;
    if (user) {
      const newToken = await user.getIdToken(true);
      // Assuming createSessionCookie is a function that creates a session cookie
      // Replace this with the actual implementation
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Handle refresh failure
  }
};

// Add session timeout handling
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimer: NodeJS.Timeout;

const resetSessionTimer = () => {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(logout, SESSION_TIMEOUT);
};

// Implement email verification requirement
const requireEmailVerification = async (user: User) => {
  if (!user.emailVerified) {
    await sendEmailVerification(user);
    throw new Error('Please verify your email address before continuing.');
  }
}; 