import { NextRequest, NextResponse } from 'next/server';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { 
  initializeTestFirebase, 
  createTestUser, 
  signInTestUser, 
  signOutTestUser, 
  ensureEmulatorsRunning,
  TEST_USER,
  generateTestUserData,
  cleanupTestResources
} from '../utils/firebase-test-utils';
import { shouldUseEmulators } from '@/app/lib/emulatorUtils';
import firebaseAdmin from '@/app/lib/firebaseAdmin';
import { User } from 'firebase/auth';

// Mock the Firebase Admin Service
jest.mock('@/app/lib/firebaseAdmin', () => ({
  __esModule: true,
  default: {
    initializeFirebaseAdmin: jest.fn()
  }, // Mock the default export
  FirebaseAdminService: {
    createCustomToken: jest.fn(),
    verifyIdToken: jest.fn(),
    getUserById: jest.fn(),
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    isUsingEmulators: jest.fn().mockReturnValue(true),
  },
}));

// Mock the Next.js Response
jest.mock('next/server', () => {
  // Don't use requireActual to avoid the Request error
  return {
    NextRequest: jest.fn().mockImplementation((url, options) => ({
      url,
      method: options?.method || 'GET',
      headers: new Map(Object.entries(options?.headers || {})),
      json: jest.fn().mockImplementation(() => Promise.resolve(JSON.parse(options?.body || '{}'))),
      text: jest.fn().mockImplementation(() => Promise.resolve(options?.body || '')),
      nextUrl: { pathname: new URL(url).pathname },
      cookies: { get: jest.fn(), set: jest.fn(), delete: jest.fn() },
    })),
    NextResponse: {
      json: jest.fn((data, options) => ({ 
        data, 
        options,
        headers: new Map(),
        status: options?.status || 200,
        cookies: {
          set: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
        }
      })),
      redirect: jest.fn((url) => ({
        url,
        status: 302,
        headers: new Map(),
        cookies: {
          set: jest.fn(),
          get: jest.fn(),
          delete: jest.fn(),
        }
      })),
    },
  };
});

// Skip tests if emulators are not running
const itIfEmulatorsRunning = process.env.CI ? it.skip : it;

// Skip tests if emulators are not available
const itIfEmulators = shouldUseEmulators() ? it : it.skip;

describe('Auth API Routes', () => {
  // Declare testUser variable
  let testUser: { email: string; password: string; displayName: string };
  
  // Declare route handlers
  let registerHandler: { POST: (req: NextRequest) => Promise<any> };
  let loginHandler: { POST: (req: NextRequest) => Promise<any> };
  let sessionHandler: { POST: (req: NextRequest) => Promise<any> };
  let logoutHandler: { POST: (req: NextRequest) => Promise<any> };
  
  // Check if emulators are running before all tests
  beforeAll(async () => {
    try {
      await ensureEmulatorsRunning();
      console.log('✅ Firebase emulators are running');
      
      // Initialize Firebase with emulators
      initializeTestFirebase();
      
      // Generate unique test user data
      testUser = generateTestUserData();
    } catch (error) {
      console.error('❌ Firebase emulators are not running. Skipping API tests.');
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
  
  afterAll(async () => {
    await cleanupTestResources();
  });
  
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Dynamically import the route handler to reset module state between tests
      jest.isolateModules(() => {
        loginHandler = require('@/app/api/auth/login/route');
      });
    });
    
    itIfEmulatorsRunning('should return a custom token for valid credentials', async () => {
      // Create a test user first
      const user: User = await createTestUser(TEST_USER.email, TEST_USER.password);
      const idToken = await user.getIdToken();
      
      // Mock the Firebase Admin createCustomToken function
      (FirebaseAdminService.createCustomToken as jest.Mock).mockResolvedValue('mock-custom-token');
      (FirebaseAdminService.getUserByEmail as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: TEST_USER.email,
        displayName: TEST_USER.displayName,
      });
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
        }),
      });
      
      // Call the API route handler
      const response = await loginHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.token).toBeDefined();
    });
    
    itIfEmulatorsRunning('should return an error for invalid credentials', async () => {
      // Create a mock request with invalid credentials
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }),
      });
      
      // Mock the Firebase Admin function to throw an error
      (FirebaseAdminService.getUserByEmail as jest.Mock).mockRejectedValue(
        new Error('User not found')
      );
      
      // Call the API route handler
      const response = await loginHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });
  });
  
  describe('POST /api/auth/register', () => {
    beforeEach(async () => {
      // Dynamically import the route handler to reset module state between tests
      jest.isolateModules(() => {
        registerHandler = require('@/app/api/auth/register/route');
      });
    });
    
    itIfEmulatorsRunning('should create a new user and return a custom token', async () => {
      // Generate a unique email for this test
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      // Mock the Firebase Admin functions
      (FirebaseAdminService.createUser as jest.Mock).mockResolvedValue({
        uid: 'new-test-uid',
        email: uniqueEmail,
        displayName: TEST_USER.displayName,
      });
      (FirebaseAdminService.createCustomToken as jest.Mock).mockResolvedValue('mock-custom-token');
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: uniqueEmail,
          password: TEST_USER.password,
          displayName: TEST_USER.displayName,
        }),
      });
      
      // Call the API route handler
      const response = await registerHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.token).toBeDefined();
      expect(responseData.user).toBeDefined();
      expect(responseData.user.email).toBe(uniqueEmail);
    });
    
    itIfEmulatorsRunning('should return an error for existing email', async () => {
      // Create a test user first
      await createTestUser(TEST_USER.email, TEST_USER.password);
      
      // Mock the Firebase Admin function to throw an error
      (FirebaseAdminService.createUser as jest.Mock).mockRejectedValue(
        new Error('The email address is already in use by another account')
      );
      
      // Create a mock request with existing email
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          displayName: TEST_USER.displayName,
        }),
      });
      
      // Call the API route handler
      const response = await registerHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
      expect(responseData.error).toContain('already in use');
    });
  });
  
  describe('POST /api/auth/session', () => {
    beforeEach(async () => {
      // Dynamically import the route handler to reset module state between tests
      jest.isolateModules(() => {
        sessionHandler = require('@/app/api/auth/session/route');
      });
    });
    
    itIfEmulatorsRunning('should create a session cookie for valid ID token', async () => {
      // Create a test user first
      const user: User = await createTestUser(TEST_USER.email, TEST_USER.password);
      const idToken = await user.getIdToken();
      
      // Mock the Firebase Admin verifyIdToken function
      (FirebaseAdminService.verifyIdToken as jest.Mock).mockResolvedValue({
        uid: 'test-uid',
        email: TEST_USER.email,
      });
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
        }),
      });
      
      // Call the API route handler
      const response = await sessionHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(response.headers.has('Set-Cookie')).toBe(true);
    });
    
    itIfEmulatorsRunning('should return an error for invalid ID token', async () => {
      // Create a mock request with invalid ID token
      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: 'invalid-token',
        }),
      });
      
      // Mock the Firebase Admin function to throw an error
      (FirebaseAdminService.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('Invalid ID token')
      );
      
      // Call the API route handler
      const response = await sessionHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });
  });
  
  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Dynamically import the route handler to reset module state between tests
      jest.isolateModules(() => {
        logoutHandler = require('@/app/api/auth/logout/route');
      });
    });
    
    itIfEmulatorsRunning('should clear the session cookie', async () => {
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });
      
      // Call the API route handler
      const response = await logoutHandler.POST(request);
      
      // Parse the response
      const responseData = response.data;
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(response.headers.has('Set-Cookie')).toBe(true);
      
      // Check that the cookie is cleared
      const cookieHeader = response.headers.get('Set-Cookie');
      expect(cookieHeader).toContain('session=;');
      expect(cookieHeader).toContain('Max-Age=0');
    });
  });
});

// Helper function to create a mock request
function createMockRequest(method: string, body: any = {}, headers: Record<string, string> = {}) {
  // Create mock headers object
  const mockHeaders = {
    get: (name: string) => headers[name] || null,
    has: (name: string) => !!headers[name],
  };
  
  // Create mock cookies object
  const mockCookies = {
    get: (name: string) => null,
    getAll: () => [],
    has: (name: string) => false,
    set: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    method,
    headers: mockHeaders,
    cookies: mockCookies,
    json: () => Promise.resolve(body),
  } as unknown as NextRequest;
}

// Helper function to create a mock response
function createMockResponse() {
  const headers = new Map();
  const cookies = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    headers,
    cookies,
    status: 200,
    json: (data: any) => ({ data, status: 200 }),
  };
} 