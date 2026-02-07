import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createSessionCookie } from '@/app/lib/authUtils';

export type RestSignInResult = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  idToken: string;
};

export async function signInWithEmailAndPasswordViaRest(email: string, password: string): Promise<RestSignInResult> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Firebase API key is not configured');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const code = data?.error?.message as string | undefined;
    switch (code) {
      case 'EMAIL_NOT_FOUND':
      case 'INVALID_PASSWORD':
      case 'INVALID_LOGIN_CREDENTIALS':
        throw new Error('Invalid email or password');
      case 'USER_DISABLED':
        throw new Error('This account has been disabled');
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        throw new Error('Too many failed login attempts. Please try again later.');
      default:
        throw new Error('Authentication failed');
    }
  }

  const idToken = data.idToken as string | undefined;
  if (!idToken) {
    throw new Error('Authentication failed');
  }

  return {
    uid: data.localId as string,
    email: data.email as string,
    displayName: (data.displayName as string | undefined) || undefined,
    photoURL: (data.photoUrl as string | undefined) || undefined,
    idToken,
  };
}

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
          const user = await signInWithEmailAndPasswordViaRest(email, password);
          // Issue Firebase Admin session cookie for server actions expecting it
          await createSessionCookie(user.idToken);

          return {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            image: user.photoURL,
          };
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          throw new Error(err?.message || 'Invalid email or password');
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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.uid = token.id as string; // alias for Firebase UID compatibility
        session.user.email = token.email as string;
        session.user.name = (token.name as string | undefined) || session.user.name;
        session.user.displayName = session.user.name;
        session.user.image = (token.picture as string | undefined) || session.user.image;
        session.user.photoURL = session.user.image;
        session.user.role = (token.role as string | undefined) || 'user';
      }
      return session;
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
