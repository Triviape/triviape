import { 
  createSuccessResponse, 
  createErrorResponse, 
  withApiErrorHandling,
  ApiErrorCode
} from '@/app/lib/apiUtils';

// Mock the error logging function
jest.mock('@/app/lib/errorHandler', () => ({
  logError: jest.fn(),
}));

describe('API Utils', () => {
  describe('createSuccessResponse', () => {
    it('should create a properly formatted success response', () => {
      const data = { user: { id: '123', name: 'Test User' } };
      const response = createSuccessResponse(data);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
      expect(response.error).toBeUndefined();
    });
  });
  
  describe('createErrorResponse', () => {
    it('should create a properly formatted error response', () => {
      const message = 'Test error message';
      const code = ApiErrorCode.NOT_FOUND;
      const details = { field: 'id', issue: 'not found' };
      
      const response = createErrorResponse(message, code, details);
      
      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(response.error).toEqual({
        message,
        code,
        details
      });
    });
    
    it('should use UNKNOWN_ERROR as default code when not provided', () => {
      const message = 'Test error message';
      const response = createErrorResponse(message);
      
      expect(response.error?.code).toBe(ApiErrorCode.UNKNOWN_ERROR);
    });
  });
  
  describe('withApiErrorHandling', () => {
    let mockRequest: Request;
    
    beforeEach(() => {
      mockRequest = new Request('https://example.com/api/test');
    });
    
    it('should return success response when handler succeeds', async () => {
      const mockHandler = jest.fn().mockResolvedValue({ id: '123', name: 'Test' });
      
      const response = await withApiErrorHandling(mockRequest, mockHandler);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({ id: '123', name: 'Test' });
      expect(responseData.timestamp).toBeDefined();
      expect(mockHandler).toHaveBeenCalled();
    });
    
    it('should handle validation errors correctly', async () => {
      const validationError = {
        code: 'validation-failed',
        message: 'Validation failed',
        details: { email: ['Invalid email'] },
        statusCode: 400
      };
      
      const mockHandler = jest.fn().mockRejectedValue(validationError);
      
      const response = await withApiErrorHandling(mockRequest, mockHandler);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error.message).toBe('Validation failed');
      expect(responseData.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      expect(responseData.error.details).toEqual({ email: ['Invalid email'] });
    });
    
    it('should handle not found errors correctly', async () => {
      const notFoundError = {
        code: 'not-found',
        message: 'User not found',
        statusCode: 404
      };
      
      const mockHandler = jest.fn().mockRejectedValue(notFoundError);
      
      const response = await withApiErrorHandling(mockRequest, mockHandler);
      const responseData = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error.message).toBe('User not found');
      expect(responseData.error.code).toBe(ApiErrorCode.NOT_FOUND);
    });
    
    it('should handle permission errors correctly', async () => {
      const permissionError = {
        code: 'permission-denied',
        message: 'Insufficient permissions',
        statusCode: 403
      };
      
      const mockHandler = jest.fn().mockRejectedValue(permissionError);
      
      const response = await withApiErrorHandling(mockRequest, mockHandler);
      const responseData = await response.json();
      
      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error.message).toBe('Insufficient permissions');
      expect(responseData.error.code).toBe(ApiErrorCode.FORBIDDEN);
    });
    
    it('should handle unexpected errors correctly', async () => {
      const unexpectedError = new Error('Something went wrong');
      
      const mockHandler = jest.fn().mockRejectedValue(unexpectedError);
      
      const response = await withApiErrorHandling(mockRequest, mockHandler);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error.message).toBe('Something went wrong');
      expect(responseData.error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
    });
    
    it('should not log errors when logErrors is false', async () => {
      const { logError } = require('@/app/lib/errorHandler');
      const error = new Error('Test error');
      
      const mockHandler = jest.fn().mockRejectedValue(error);
      
      await withApiErrorHandling(mockRequest, mockHandler, { logErrors: false });
      
      expect(logError).not.toHaveBeenCalled();
    });
  });
}); 