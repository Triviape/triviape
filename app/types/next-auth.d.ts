import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   *
   * IMPORTANT: ID Mapping
   * - session.user.id is the Firebase UID (user.uid from Firebase Auth)
   * - This mapping happens in the NextAuth JWT callback (see app/api/auth/[...nextauth]/route.ts)
   * - When querying Firestore: use session.user.id directly as the document key
   * - When accessing raw Firebase objects: they use .uid instead of .id
   */
  interface Session {
    user: {
      /** The user's ID (Firebase UID). Maps from Firebase user.uid to NextAuth session.user.id */
      id: string;
      /** Alias for Firebase UID for legacy callers still using user.uid */
      uid?: string;
      /** The user's name (or username). */
      name?: string | null;
      /** Alias for name used by legacy profile UI */
      displayName?: string | null;
      /** The user's email address. */
      email?: string | null;
      /** Optional application role for authorization decisions. */
      role?: string;
      /** The user's image URL. */
      image?: string | null;
      /** Alias for image used by legacy profile UI */
      photoURL?: string | null;
    } & DefaultSession["user"];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   *
   * IMPORTANT: The id field here is populated from Firebase's user.uid in the
   * Credentials provider (see app/api/auth/[...nextauth]/route.ts:60)
   */
  interface User {
    /** Firebase UID - used as the primary identifier across the app */
    id: string;
    uid?: string;
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
    photoURL?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    role?: string;
  }
}
