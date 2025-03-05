import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { checkEmulatorAvailability, shouldUseEmulators } from './emulatorUtils';

/**
 * Create a default service account for development purposes
 * This is only used when no credentials are provided
 */
function createDefaultServiceAccount(): ServiceAccount {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'default-project';
  
  // Generate a dummy private key for development (this won't work for real operations)
  // but will allow the app to initialize in development
  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
AgMBAAECggEAFkqH17SqMvn7aaJu9Y1V+eFgKxLFGgRbxJqRUQKKyrs+RJOeC+fL
zdPYhKmWksGWnIzud9xhEHC/7DgAn9N220NNfrYZqui8G0HP9cYKJlCDo0CKnOgA
A0tRBOIbwtC19h8ps5JDmUGizwZdG5Qz+XEIUP2aRmv4JhB29B+rYXyJcuPgkTPB
30FaEZ30cCEVWz4muOeQKmyDLFiKI6yMABbcFQs/7cVz/0L2pLXI9SElnS5MkQXd
5SuIsjHJLUx8fRKwiITjcXKUg0mN9hn0+Sy4EOkGkH+NpnYmvP5TwnFvvCacnxTr
V7DGO+LuCo0QxdXpWYaI0wKBgQDWlvG5wqP7mZ3zyxvXMH8aYKC/q/Nefwb+7P/T
l9uX2kRWzkfKsKjxY2k98NvEQOUyd0OYPkcptcxBbJO3/RQKJvQfS5x0xaxZM1S7
ffHAHObhu9AUKokGGFQ6v3hZ3ZtPfkV9iyY7pLtwyzlHmysWXlzUYn8DQXbtHqbz
sehYQwKBgQDe5s1WZ3GRvUQOulOGMUqE6wITpTQC/2gXiuJ3jo0A5spAr8JRjZjl
Bnb2Uxo5o1CotEu9IQh/6UGMSrRKUJc994uVh0HjxS5nEbs9fG8k88c3Mo87GAhX
lwQWRHCc9Fu9t0TrvIFJ7iFj5QoYg4lC7UPsVGJoKhzI9H7KrKYMVwKBgBiw3jWF
9pLo194K7DQ72zMM8Z0wYFKxSQGQgn84dCjdnKwu6QCkK30cKNRnbA8X3gzNjfiK
OJcgQDmGE2L6kd/QUQ11fJXXys4koFrUhBQDEL5JkKhlUR4y4MnQEQKBgA/NXrXC
vHJKnMJOWyigtVVQNc8iqAJaLJ8FkLTvH4ZgT8DZIBjidxSWYoQW0KeJ2V0Z+AYz
3f1BtG1qQGxBM5aHYy3N06iA2hh7q5pPP5RvV1JJq2c6LdFMDTpias93HRRLc+Q5
lS83/sCnPCZCjif/SgOSwWru6cZkJGShpSLcAYZX
-----END PRIVATE KEY-----`;
  
  return {
    projectId: projectId,
    privateKey: privateKey,
    clientEmail: `firebase-adminsdk-${Math.random().toString(36).substring(2, 10)}@${projectId}.iam.gserviceaccount.com`,
  };
}

/**
 * Configure Firebase emulators if they should be used
 */
function configureEmulators(): void {
  if (!shouldUseEmulators()) return;
  
  // Check if emulator hosts are defined in environment variables
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  const storageEmulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  
  // Connect to the emulators
  if (authEmulatorHost) {
    console.log(`🔥 Connecting to Auth emulator at: ${authEmulatorHost}`);
    // No need to explicitly connect for admin SDK - it automatically uses the environment variable
  }
  
  if (firestoreEmulatorHost) {
    console.log(`🔥 Connecting to Firestore emulator at: ${firestoreEmulatorHost}`);
    try {
      const [host, portStr] = firestoreEmulatorHost.split(':');
      const port = parseInt(portStr, 10);
      
      admin.firestore().settings({
        host: firestoreEmulatorHost,
        ssl: false,
      });
      console.log('✅ Connected to Firestore emulator successfully');
    } catch (error) {
      console.warn('Error connecting to Firestore emulator:', error);
    }
  }
  
  if (storageEmulatorHost) {
    console.log(`🔥 Connecting to Storage emulator at: ${storageEmulatorHost}`);
    // No need to explicitly connect for admin SDK - it automatically uses the environment variable
  }
  
  console.log('🔥 Firebase Admin emulator configuration complete');
}

/**
 * Initialize the Firebase Admin SDK if it hasn't been initialized already
 */
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // If we're in development or using emulators
      if (shouldUseEmulators()) {
        console.log('Development environment detected, using development credentials');
        
        // For emulators, we can initialize with a minimal configuration
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
        });
        
        // Check if emulators are available and configure them
        checkEmulatorAvailability().then(() => {
          configureEmulators();
        });
        
        console.log('Firebase Admin initialized with minimal configuration for emulators');
        return admin;
      }
      
      // Check if FIREBASE_ADMIN_CREDENTIALS is available
      if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
        try {
          // Parse the JSON string to an object
          const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
          console.log('Firebase Admin initialized with provided service account credentials');
        } catch (parseError) {
          console.error('Error parsing Firebase Admin credentials:', parseError);
          throw parseError;
        }
      } else {
        // Fallback to application default credentials if no service account provided
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('Firebase Admin initialized with application default credentials');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      
      // If credential parsing fails, try to initialize with a minimal configuration for emulators
      try {
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'triviape-cbc23'
        });
        
        // Configure emulators after initialization
        if (shouldUseEmulators()) {
          checkEmulatorAvailability().then(() => {
            configureEmulators();
          });
        }
        
        console.log('Firebase Admin initialized with minimal configuration (limited functionality)');
      } catch (fallbackError) {
        console.error('Failed to initialize even with fallback configuration:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  return admin;
}

// Initialize Firebase Admin SDK
const firebaseAdmin = initializeFirebaseAdmin();

export default firebaseAdmin;

export class FirebaseAdminService {
  /**
   * Get the Firestore database instance
   */
  static getFirestore() {
    return firebaseAdmin.firestore();
  }
  
  /**
   * Get the Auth instance
   */
  static getAuth() {
    return firebaseAdmin.auth();
  }
  
  /**
   * Check if Firebase emulators are being used
   */
  static isUsingEmulators(): boolean {
    return shouldUseEmulators();
  }

  /**
   * Create a custom authentication token for a user
   * Useful for server-side authentication
   */
  static async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    return await firebaseAdmin.auth().createCustomToken(uid, claims);
  }
  
  /**
   * Verify an ID token and return the decoded token
   */
  static async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return await firebaseAdmin.auth().verifyIdToken(idToken);
  }
  
  /**
   * Get a user by their UID
   */
  static async getUserById(uid: string): Promise<admin.auth.UserRecord> {
    return await firebaseAdmin.auth().getUser(uid);
  }
  
  /**
   * Get a user by their email
   */
  static async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    return await firebaseAdmin.auth().getUserByEmail(email);
  }
  
  /**
   * Create a new user with Firebase Admin
   */
  static async createUser(userData: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    try {
      // Ensure we properly await the operation
      return await firebaseAdmin.auth().createUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user by their UID
   */
  static async deleteUser(uid: string): Promise<void> {
    return await firebaseAdmin.auth().deleteUser(uid);
  }
  
  /**
   * Set custom user claims
   */
  static async setCustomUserClaims(uid: string, claims: Record<string, any>): Promise<void> {
    return await firebaseAdmin.auth().setCustomUserClaims(uid, claims);
  }
  
  /**
   * Run a Firestore transaction on the server side
   * This is useful for complex data operations
   */
  static async runTransaction<T>(
    updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>
  ): Promise<T> {
    return await firebaseAdmin.firestore().runTransaction(updateFunction);
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
    
    const [url] = await firebaseAdmin.storage().bucket().file(filePath).getSignedUrl(options);
    return url;
  }
} 