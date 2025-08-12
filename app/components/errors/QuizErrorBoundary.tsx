'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for quiz-related components
 * Provides user-friendly error messages and recovery options
 */
export class QuizErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error('Quiz Error Boundary caught an error:', error, errorInfo);
    
    // You could also send error to error reporting service here
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-600">Oops! Something went wrong</CardTitle>
              <CardDescription>
                There was an error loading the quiz. This might be a temporary issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <strong>Error:</strong> {this.state.error?.message || 'Unknown error occurred'}
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={this.handleReset} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/quiz'} 
                  variant="outline"
                  className="w-full"
                >
                  Browse Other Quizzes
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="ghost"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 * Use this when you need to handle errors in a functional component
 */
export function useQuizErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Quiz error captured:', error);
    setError(error);
  }, []);

  return {
    error,
    resetError,
    captureError,
    hasError: error !== null
  };
}

/**
 * Simple error boundary wrapper for quiz components
 */
export function WithQuizErrorBoundary<T extends object>({
  children,
  fallback,
  onReset
}: {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}) {
  return (
    <QuizErrorBoundary fallback={fallback} onReset={onReset}>
      {children}
    </QuizErrorBoundary>
  );
}