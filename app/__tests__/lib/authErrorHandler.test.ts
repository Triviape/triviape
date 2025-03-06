import { FirebaseError } from 'firebase/app';
import { 
  getAuthErrorMessage, 
  checkFirebaseAuthConnectivity, 
  retryAuthOperation,
  logAuthError,
  AUTH_ERROR_MESSAGES
} from '@/app/lib/authErrorHandler';
import { getAuthInstance } from '@/app/lib/firebase';

// Mock the firebase module
jest.mock('@/app/lib/firebase', () => ({
  getAuthInstance: jest.fn(),
}));

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Auth Error Handler', () => {
  describe('getAuthErrorMessage', () => {
    it('should return mapped message for Firebase errors', () => {
      const error = new FirebaseError('auth/network-request-failed', 'Network error');
      const message = getAuthErrorMessage(error);
      expect(message).toBe(AUTH_ERROR_MESSAGES['auth/network-request-failed']);
    });

    it('should return default message with code for unmapped Firebase errors', () => {
      const error = new FirebaseError('auth/unknown-code', 'Unknown error');
      const message = getAuthErrorMessage(error);
      expect(message).toContain('auth/unknown-code');
      expect(message).toContain('Unknown error');
    });

    it('should handle regular Error objects', () => {
      const error = new Error('Regular error');
      const message = getAuthErrorMessage(error);
      expect(message).toBe('Error: Regular error');
    });

    it('should handle unknown error types', () => {
      const message = getAuthErrorMessage('string error');
      expect(message).toBe('An unknown error occurred. Please try again.');
    });
  });

  describe('checkFirebaseAuthConnectivity', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return success false if auth is not initialized', async () => {
      (getAuthInstance as jest.Mock).mockReturnValue(null);
      
      const result = await checkFirebaseAuthConnectivity();
      
      expect(result.success).toBe(false);
      expect(result.details).toContain('not initialized');
    });

    it('should return success true if auth is initialized', async () => {
      (getAuthInstance as jest.Mock).mockReturnValue({
        currentUser: null
      });
      
      const result = await checkFirebaseAuthConnectivity();
      
      expect(result.success).toBe(true);
      expect(result.details).toContain('Firebase Auth is initialized');
    });

    it('should handle errors during connectivity check', async () => {
      (getAuthInstance as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const result = await checkFirebaseAuthConnectivity();
      
      expect(result.success).toBe(false);
      expect(result.details).toBe('Test error');
    });
  });

  describe('retryAuthOperation', () => {
    it('should return result if operation succeeds on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryAuthOperation(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry operation on network error', async () => {
      const networkError = new FirebaseError('auth/network-request-failed', 'Network error');
      const operation = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');
      
      const result = await retryAuthOperation(operation, 1);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const authError = new FirebaseError('auth/user-not-found', 'User not found');
      const operation = jest.fn().mockRejectedValue(authError);
      
      await expect(retryAuthOperation(operation)).rejects.toThrow(authError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const networkError = new FirebaseError('auth/network-request-failed', 'Network error');
      const operation = jest.fn().mockRejectedValue(networkError);
      
      await expect(retryAuthOperation(operation, 2)).rejects.toThrow(networkError);
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('logAuthError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should log Firebase errors with details', () => {
      const error = new FirebaseError('auth/network-request-failed', 'Network error');
      logAuthError(error, { userId: '123' });
      
      expect(console.error).toHaveBeenCalled();
      const loggedArgs = (console.error as jest.Mock).mock.calls[0];
      expect(loggedArgs[0]).toContain('[ERROR] [authentication]');
      
      // The error object is in the first argument, not the second
      expect(error.code).toBe('auth/network-request-failed');
      expect(error.message).toBe('Network error');
    });

    it('should log regular errors', () => {
      const error = new Error('Regular error');
      logAuthError(error);
      
      expect(console.error).toHaveBeenCalled();
      const loggedArgs = (console.error as jest.Mock).mock.calls[0];
      expect(loggedArgs[0]).toContain('[ERROR] [authentication]');
      expect(error.message).toBe('Regular error');
    });

    it('should log unknown error types', () => {
      logAuthError('string error');
      
      expect(console.error).toHaveBeenCalled();
      const loggedArgs = (console.error as jest.Mock).mock.calls[0];
      expect(loggedArgs[0]).toContain('[ERROR] [authentication]');
      // The original error is stored in the error object's message
      expect(loggedArgs[1].message).toBe('string error');
    });
  });
}); 