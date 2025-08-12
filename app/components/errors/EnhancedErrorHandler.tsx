'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  XCircle, 
  Shield, 
  Wifi, 
  Server,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/app/components/ui/use-toast';

export interface EnhancedError {
  type: 'authentication' | 'authorization' | 'network' | 'server' | 'validation' | 'not_found' | 'csrf' | 'rate_limit';
  message: string;
  details?: string;
  code?: string;
  recoverable?: boolean;
  retryable?: boolean;
  timestamp?: number;
  context?: Record<string, any>;
}

interface EnhancedErrorHandlerProps {
  error: EnhancedError;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * Enhanced error display component with recovery options
 */
export function EnhancedErrorHandler({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = ""
}: EnhancedErrorHandlerProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-dismiss for non-critical errors
  useEffect(() => {
    if (error.type === 'validation' || error.type === 'not_found') {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.type, onDismiss]);

  const handleRetry = async () => {
    if (!onRetry || !error.retryable) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      setRetryCount(prev => prev + 1);
      toast({
        title: "Retry Successful",
        description: "The operation completed successfully.",
        variant: "default"
      });
    } catch (retryError) {
      toast({
        title: "Retry Failed",
        description: "The operation failed again. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case 'authentication':
        return <User className="h-4 w-4" />;
      case 'authorization':
        return <Shield className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'validation':
        return <Info className="h-4 w-4" />;
      case 'csrf':
        return <Shield className="h-4 w-4" />;
      case 'rate_limit':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = () => {
    switch (error.type) {
      case 'validation':
      case 'not_found':
        return 'default' as const;
      case 'authentication':
      case 'authorization':
      case 'csrf':
        return 'destructive' as const;
      default:
        return 'destructive' as const;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'authentication':
        return 'Authentication Required';
      case 'authorization':
        return 'Access Denied';
      case 'network':
        return 'Connection Problem';
      case 'server':
        return 'Server Error';
      case 'validation':
        return 'Invalid Input';
      case 'not_found':
        return 'Not Found';
      case 'csrf':
        return 'Security Error';
      case 'rate_limit':
        return 'Too Many Requests';
      default:
        return 'Error';
    }
  };

  const getRecoveryActions = () => {
    const actions = [];

    // Add retry button for retryable errors
    if (error.retryable && onRetry) {
      actions.push(
        <Button
          key="retry"
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="ml-2"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : `Retry ${retryCount > 0 ? `(${retryCount})` : ''}`}
        </Button>
      );
    }

    // Add specific recovery actions based on error type
    switch (error.type) {
      case 'authentication':
        actions.push(
          <Button
            key="login"
            variant="default"
            size="sm"
            onClick={() => window.location.href = '/auth'}
            className="ml-2"
          >
            Sign In
          </Button>
        );
        break;
      case 'network':
        actions.push(
          <Button
            key="refresh"
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh Page
          </Button>
        );
        break;
      case 'csrf':
        actions.push(
          <Button
            key="refresh"
            variant="default"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-2"
          >
            Refresh Page
          </Button>
        );
        break;
    }

    return actions;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Alert variant={getErrorVariant()} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2 flex-1">
          {getErrorIcon()}
          <div className="flex-1">
            <AlertTitle className="flex items-center space-x-2">
              <span>{getErrorTitle()}</span>
              {error.code && (
                <Badge variant="outline" className="text-xs">
                  {error.code}
                </Badge>
              )}
              {error.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(error.timestamp)}
                </span>
              )}
            </AlertTitle>
            <AlertDescription className="mt-1">
              <div>{error.message}</div>
              
              {/* Error Details Toggle */}
              {error.details && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showErrorDetails ? (
                      <><EyeOff className="h-3 w-3 mr-1" /> Hide Details</>
                    ) : (
                      <><Eye className="h-3 w-3 mr-1" /> Show Details</>
                    )}
                  </Button>
                  
                  {showErrorDetails && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      {error.details}
                      {error.context && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-muted-foreground">
                            Additional Context
                          </summary>
                          <pre className="mt-1 text-xs">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center">
          {getRecoveryActions()}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="ml-2 h-auto p-1"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

/**
 * Enhanced toast notification for errors
 */
export function showEnhancedErrorToast(error: EnhancedError, options?: {
  onRetry?: () => void | Promise<void>;
  duration?: number;
}) {
  const { onRetry, duration = 6000 } = options || {};
  
  toast({
    title: (() => {
      switch (error.type) {
        case 'authentication':
          return 'Authentication Required';
        case 'authorization':
          return 'Access Denied';
        case 'network':
          return 'Connection Problem';
        case 'server':
          return 'Server Error';
        case 'validation':
          return 'Invalid Input';
        case 'not_found':
          return 'Not Found';
        case 'csrf':
          return 'Security Error';
        case 'rate_limit':
          return 'Too Many Requests';
        default:
          return 'Error';
      }
    })(),
    description: error.message,
    variant: error.type === 'validation' || error.type === 'not_found' ? 'default' : 'destructive',
    duration,
    action: error.retryable && onRetry ? (
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    ) : undefined,
  });
}

/**
 * Error boundary fallback component
 */
export function EnhancedErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void; 
}) {
  const enhancedError: EnhancedError = {
    type: 'server',
    message: 'Something went wrong. Please try refreshing the page.',
    details: error.message,
    retryable: true,
    timestamp: Date.now(),
    context: {
      stack: error.stack,
      name: error.name
    }
  };

  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <EnhancedErrorHandler 
          error={enhancedError}
          onRetry={resetError}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      </div>
    </div>
  );
}