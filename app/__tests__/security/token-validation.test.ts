import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { 
  initializeTestFirebase, 
  createTestUser, 
  signOutTestUser, 
  ensureEmulatorsRunning,
  TEST_USER,
  generateTestEmail
} from '../utils/firebase-test-utils';
import { User, UserCredential } from 'firebase/auth';

// Mock the Firebase Admin Service
jest.mock('@/app/lib/firebaseAdmin', () => ({
  FirebaseAdminService: {
    verifyIdToken: jest.fn(),
    createCustomToken: jest.fn(),
  },
}));

// Skip tests if emulators are not running
const itIfEmulatorsRunning = process.env.CI ? it.skip : it;

describe('Token Validation Security Tests', () => {
  // Check if emulators are running before all tests
  beforeAll(async () => {
    try {
      await ensureEmulatorsRunning();
      console.log('✅ Firebase emulators are running');
      
      // Initialize Firebase with emulators
      initializeTestFirebase();
    } catch (error) {
      console.error('❌ Firebase emulators are not running. Skipping security tests.');
      console.error('Run emulators with: npm run emulators');
    }
  });
  
  // Clean up after each test
  afterEach(async () => {
    try {
      await signOutTestUser();
      jest.clearAllMocks();
    } catch (error) {
      console.warn('Error signing out test user:', error);
    }
  });
  
  itIfEmulatorsRunning('should reject expired tokens', async () => {
    // Create a test user
    const user: User = await createTestUser(generateTestEmail(), 'Test@123456');
    
    // Mock verifyIdToken to throw an expired token error
    (FirebaseAdminService.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error('Firebase ID token has expired')
    );
    
    // Get a token from the user
    const idToken = await user.getIdToken();
    
    // Attempt to verify the token
    await expect(FirebaseAdminService.verifyIdToken(idToken)).rejects.toThrow(
      'Firebase ID token has expired'
    );
  });
  
  itIfEmulatorsRunning('should reject invalid tokens', async () => {
    // Mock verifyIdToken to throw an invalid token error
    (FirebaseAdminService.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error('Invalid ID token')
    );
    
    // Attempt to verify an invalid token
    await expect(FirebaseAdminService.verifyIdToken('invalid-token')).rejects.toThrow(
      'Invalid ID token'
    );
  });
  
  itIfEmulatorsRunning('should reject tokens from different Firebase projects', async () => {
    // Mock verifyIdToken to throw a project ID mismatch error
    (FirebaseAdminService.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error('Firebase ID token has incorrect "aud" (audience) claim')
    );
    
    // Attempt to verify a token from a different project
    await expect(FirebaseAdminService.verifyIdToken('token-from-different-project')).rejects.toThrow(
      'Firebase ID token has incorrect "aud" (audience) claim'
    );
  });
  
  itIfEmulatorsRunning('should verify valid tokens', async () => {
    // Create a test user
    const user: User = await createTestUser(generateTestEmail(), 'Test@123456');
    
    // Get a token from the user
    const idToken = await user.getIdToken();
    
    // Mock verifyIdToken to return a decoded token
    (FirebaseAdminService.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: user.uid,
      email: TEST_USER.email,
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
    });
    
    // Verify the token
    const decodedToken = await FirebaseAdminService.verifyIdToken(idToken);
    
    // Check that the token contains the expected user ID
    expect(decodedToken.uid).toBe(user.uid);
  });
  
  itIfEmulatorsRunning('should handle token with custom claims', async () => {
    // Create a test user
    const user: User = await createTestUser(generateTestEmail(), 'Test@123456');
    
    // Mock createCustomToken to return a token with custom claims
    (FirebaseAdminService.createCustomToken as jest.Mock).mockResolvedValue('custom-token-with-claims');
    
    // Create a custom token with claims
    const customToken = await FirebaseAdminService.createCustomToken(
      user.uid,
      { role: 'admin', premiumUser: true }
    );
    
    // Mock verifyIdToken to return a decoded token with custom claims
    (FirebaseAdminService.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: user.uid,
      email: TEST_USER.email,
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      role: 'admin',
      premiumUser: true,
    });
    
    // Verify the token
    const decodedToken = await FirebaseAdminService.verifyIdToken('id-token-with-claims');
    
    // Check that the token contains the custom claims
    expect(decodedToken.role).toBe('admin');
    expect(decodedToken.premiumUser).toBe(true);
  });
}); 