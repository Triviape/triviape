import type { NextAuthConfig } from 'next-auth';
import { initializeFirebaseAuth } from '@/app/lib/firebase';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import NextAuth from 'next-auth';

// Define the credentials type
interface FirebaseCredentials {
  email: string;
  password: string;
}

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
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
          // Use Firebase Auth to verify password (only place we use client auth)
          const auth = initializeFirebaseAuth();
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
          
          // Immediately sign out from Firebase - we only needed password verification
          await auth.signOut();
          
          // Return the user object that will be stored in the NextAuth JWT token
          return {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            image: user.photoURL
          };
        } catch (error: any) {
          console.error('Authentication error:', {
            code: error.code,
            message: error.message,
          });
          
          // Handle Firebase error codes with generic message for security
          if (error.code === 'auth/user-not-found' || 
              error.code === 'auth/wrong-password' ||
              error.code === 'auth/invalid-credential') {
            throw new Error('Invalid email or password');
          }
          
          if (error.code === 'auth/user-disabled') {
            throw new Error('This account has been disabled');
          }
          
          if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many failed login attempts. Please try again later.');
          }
          
          // Generic error message for security
          throw new Error('Invalid email or password');
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