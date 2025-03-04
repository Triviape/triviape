import { login, register, logout } from '@/app/actions/authActions';
import { UserService } from '@/app/lib/services/userService';
import { createSessionCookie, revokeSession } from '@/app/lib/authUtils';
import { redirect } from 'next/navigation';

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
      expect(result.error).toBe('Invalid email or password');
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
      expect(result.error).toBe('Email is already in use');
    });
  });

  describe('logout action', () => {
    it('should revoke the session and redirect', async () => {
      await logout();
      
      expect(revokeSession).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });
}); 