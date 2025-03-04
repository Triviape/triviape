import * as admin from 'firebase-admin';

/**
 * Initialize the Firebase Admin SDK if it hasn't been initialized already
 */
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // Use service account credentials if available
    if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS, 'base64').toString('utf8')
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      // Fall back to default credentials (useful for development)
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  }
  
  return admin;
}

// Initialize the admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

// Export the admin instances
export const adminAuth = firebaseAdmin.auth();
export const adminDb = firebaseAdmin.firestore();
export const adminStorage = firebaseAdmin.storage();

/**
 * Firebase Admin Service for server-side operations
 */
export class FirebaseAdminService {
  /**
   * Create a custom authentication token for a user
   * Useful for server-side authentication
   */
  static async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    return await adminAuth.createCustomToken(uid, claims);
  }
  
  /**
   * Verify an ID token and get the associated user
   */
  static async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return await adminAuth.verifyIdToken(idToken);
  }
  
  /**
   * Get a user by ID
   */
  static async getUserById(uid: string): Promise<admin.auth.UserRecord> {
    return await adminAuth.getUser(uid);
  }
  
  /**
   * Create a new user in Firebase Auth
   */
  static async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    return await adminAuth.createUser(userData);
  }
  
  /**
   * Set custom user claims for a user
   * This can be used for role-based access control
   */
  static async setCustomUserClaims(uid: string, claims: Record<string, any>): Promise<void> {
    return await adminAuth.setCustomUserClaims(uid, claims);
  }
  
  /**
   * Run a Firestore transaction on the server side
   * This is useful for complex data operations
   */
  static async runTransaction<T>(
    updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>
  ): Promise<T> {
    return await adminDb.runTransaction(updateFunction);
  }
  
  /**
   * Create a signed URL for file download
   * This is useful for secure file access
   */
  static async createSignedUrl(filePath: string, expirationTimeMs = 15 * 60 * 1000): Promise<string> {
    const options = {
      version: 'v4' as const,
      action: 'read' as const,
      expires: Date.now() + expirationTimeMs,
    };
    
    const [url] = await adminStorage.bucket().file(filePath).getSignedUrl(options);
    return url;
  }
}

export default FirebaseAdminService; 