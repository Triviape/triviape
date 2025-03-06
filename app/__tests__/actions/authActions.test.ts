import { login, register, logout } from '@/app/actions/authActions';
import { UserService } from '@/app/lib/services/userService';
import { createSessionCookie, revokeSession } from '@/app/lib/authUtils';
import { redirect } from 'next/navigation';
import { initTestFirebase } from '../utils/firebase-test-utils';
import { cleanupTestResources, generateTestUserData } from '../utils/test-data-factory';

// Initialize test Firebase
beforeAll(async () => {
  await initTestFirebase();
});

afterAll(async () => {
  await cleanupTestResources();
});

// Mock the dependencies
jest.mock('@/app/lib/services/userService', () => ({
  UserService: {
    signInWithEmail: jest.fn(),
    registerWithEmail: jest.fn(),
    updateLastLogin: jest.fn(),
  }
}));

jest.mock('@/app/lib/authUtils', () => ({
  createSessionCookie: jest.fn(),
  revokeSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Authentication Server Actions', () => {
  const mockFormData = () => {
    return {
      get: jest.fn().mockImplementation((key) => {
        switch (key) {
          case 'email':
            return 'test@example.com';
          case 'password':
            return 'securePassword123';
          case 'displayName':
            return 'Test User';
          case 'redirectTo':
            return '/dashboard';
          default:
            return null;
        }
      }),
      toString: jest.fn(),
    } as unknown as FormData;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestResources();
  });

  describe('login action', () => {
    it('should handle successful login', async () => {
      // Mock successful authentication
      const mockUser = {
        uid: 'test-user-id',
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      };
      
      (UserService.signInWithEmail as jest.Mock).mockResolvedValue({ 
        user: mockUser 
      });
      (createSessionCookie as jest.Mock).mockResolvedValue({ 
        success: true 
      });

      const formData = mockFormData();
      const result = await login({}, formData);

      expect(UserService.signInWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'securePassword123'
      );
      expect(createSessionCookie).toHaveBeenCalledWith('test-token');
      expect(UserService.updateLastLogin).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({
        success: true,
        redirectTo: '/dashboard',
      });
    });

    it('should handle validation errors', async () => {
      const invalidFormData = {
        get: jest.fn().mockImplementation((key) => {
          switch (key) {
            case 'email':
              return 'invalid-email';
            case 'password':
              return '123'; // Too short
            default:
              return null;
          }
        }),
      } as unknown as FormData;

      const result = await login({}, invalidFormData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle auth errors', async () => {
      (UserService.signInWithEmail as jest.Mock).mockRejectedValue({
        code: 'auth/user-not-found',
      });

      const formData = mockFormData();
      const result = await login({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No account found with this email address.');
    });

    // New edge case tests
    it('should handle network errors during login', async () => {
      (UserService.signInWithEmail as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const formData = mockFormData();
      const result = await login({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error: Network Error');
    });

    it('should handle rate limiting errors', async () => {
      (UserService.signInWithEmail as jest.Mock).mockRejectedValue({
        code: 'auth/too-many-requests',
      });

      const formData = mockFormData();
      const result = await login({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many unsuccessful attempts. Please try again later or reset your password.');
    });

    it('should handle session cookie creation failure', async () => {
      const mockUser = {
        uid: 'test-user-id',
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      };
      
      (UserService.signInWithEmail as jest.Mock).mockResolvedValue({ 
        user: mockUser 
      });
      (createSessionCookie as jest.Mock).mockResolvedValue({ 
        success: false,
        error: 'Failed to create session cookie'
      });

      const formData = mockFormData();
      const result = await login({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create session cookie');
    });
  });

  describe('register action', () => {
    it('should handle successful registration', async () => {
      // Mock successful registration
      const mockUser = {
        uid: 'new-user-id',
        getIdToken: jest.fn().mockResolvedValue('new-token'),
      };
      
      (UserService.registerWithEmail as jest.Mock).mockResolvedValue({
        user: mockUser,
      });
      (createSessionCookie as jest.Mock).mockResolvedValue({
        success: true,
      });

      const formData = mockFormData();
      const result = await register({}, formData);

      expect(UserService.registerWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'securePassword123',
        'Test User'
      );
      expect(createSessionCookie).toHaveBeenCalledWith('new-token');
      expect(result).toEqual({
        success: true,
        redirectTo: '/dashboard',
      });
    });

    it('should handle validation errors', async () => {
      const invalidFormData = {
        get: jest.fn().mockImplementation((key) => {
          switch (key) {
            case 'email':
              return 'invalid-email';
            case 'password':
              return '123'; // Too short
            case 'displayName':
              return 'T'; // Too short
            default:
              return null;
          }
        }),
      } as unknown as FormData;

      const result = await register({}, invalidFormData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle registration errors', async () => {
      (UserService.registerWithEmail as jest.Mock).mockRejectedValue({
        code: 'auth/email-already-in-use',
      });

      const formData = mockFormData();
      const result = await register({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('This email is already registered. Please use a different email or try logging in.');
    });

    // New edge case tests
    it('should handle weak password errors', async () => {
      (UserService.registerWithEmail as jest.Mock).mockRejectedValue({
        code: 'auth/weak-password',
      });

      const formData = mockFormData();
      const result = await register({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is too weak. Please use a stronger password.');
    });

    it('should handle invalid email format during registration', async () => {
      (UserService.registerWithEmail as jest.Mock).mockRejectedValue({
        code: 'auth/invalid-email',
      });

      const formData = mockFormData();
      const result = await register({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('The email address is not valid.');
    });

    it('should handle unexpected errors during registration', async () => {
      (UserService.registerWithEmail as jest.Mock).mockRejectedValue({
        code: 'auth/internal-error',
      });

      const formData = mockFormData();
      const result = await register({}, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication error (auth/internal-error): undefined');
    });
  });

  describe('logout action', () => {
    it('should revoke the session and redirect', async () => {
      await logout();
      
      expect(revokeSession).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/');
    });

    // New edge case test
    it('should handle errors during session revocation', async () => {
      (revokeSession as jest.Mock).mockRejectedValue(new Error('Failed to revoke session'));
      
      // The logout function doesn't throw errors, it redirects even if there's an error
      await logout();
      
      expect(revokeSession).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });
}); 