/**
 * Core services index
 * Exports all core service functionality
 */

// Base service implementation
export { 
  BaseService, 
  BaseServiceImplementation, 
  ListOptions, 
  ListResult, 
  BatchOperations 
} from './baseService';

// Error handling
export { 
  ServiceError, 
  ServiceErrorType, 
  createServiceError,
  handleFirebaseError,
  handleValidationError,
  handleAuthError,
  handleNotFoundError,
  handleConflictError,
  handleRateLimitError,
  handleTimeoutError,
  handleNetworkError,
  withErrorHandling,
  withRetry
} from './errorHandler';

// Performance monitoring
export { 
  PerformanceMonitor,
  performanceMonitor,
  measureLeaderboardLoad,
  measureFriendAction,
  measureMultiplayerAction,
  measureSocialAction,
  measureAuthOperation,
  measureQuizOperation,
  measureUserOperation,
  recordRealtimeLatency
} from './performanceMonitor'; 