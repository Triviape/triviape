'use client';

/**
 * Utilities for optimizing React components
 * 
 * @docRef: /docs/patterns/component-patterns/memoization.md
 */

import React, { ComponentType, memo, useRef, useState, useEffect } from 'react';
import { usePerformanceMonitor } from '@/app/hooks/performance/usePerformanceMonitor';
import { Skeleton } from '@/app/components/ui/skeleton';

/**
 * Options for optimized memoization
 */
export interface MemoOptions {
  /**
   * Component name for performance tracking
   */
  name?: string;
  
  /**
   * Track renders in performance monitoring
   */
  trackRenders?: boolean;
  
  /**
   * Custom comparison function for props
   */
  areEqual?: <P>(prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean;
  
  /**
   * Logs warning if component re-renders more than this many times
   */
  warnAfterRenders?: number;
}

/**
 * Create a memoized component with performance monitoring
 * 
 * @example
 * const MemoizedButton = memoWithPerf(Button, { name: 'Button' });
 * 
 * @docRef: /docs/patterns/component-patterns/memoization.md
 */
export function memoWithPerf<P extends object>(
  Component: ComponentType<P>,
  options: MemoOptions = {}
) {
  const {
    name = Component.displayName || Component.name || 'Component',
    trackRenders = true,
    areEqual,
    warnAfterRenders = 5
  } = options;
  
  // Create wrapper component that includes performance monitoring
  const WrappedComponent: React.FC<P> = (props: P) => {
    const renderCount = useRef(0);
    
    // Track render count for debugging
    renderCount.current += 1;
    
    // Use performance monitor if tracking is enabled
    usePerformanceMonitor({
      componentName: `memo(${name})`,
      trackRenders,
      logWarningAfterRenders: warnAfterRenders,
      enabled: trackRenders
    });
    
    // Add render count as data attribute in development
    const devProps = process.env.NODE_ENV === 'development'
      ? { 'data-render-count': renderCount.current }
      : {};
    
    return (
      <Component
        {...props}
        {...devProps}
      />
    );
  };
  
  // Set display name for debugging
  WrappedComponent.displayName = `MemoWithPerf(${name})`;
  
  // Return memoized component
  return memo(WrappedComponent, areEqual as any);
}

/**
 * Higher-order component for adding performance profiling
 * 
 * @example
 * const ProfiledComponent = withPerformanceProfile(MyComponent, 'MyComponent');
 */
export function withPerformanceProfile<P extends object>(
  Component: ComponentType<P>,
  name: string
) {
  const ProfiledComponent = (props: P) => {
    usePerformanceMonitor({
      componentName: name,
      trackRenders: true,
      trackTimeOnScreen: true
    });
    
    return <Component {...props} />;
  };
  
  ProfiledComponent.displayName = `Profiled(${name})`;
  
  return ProfiledComponent;
}

/**
 * Higher-order component for adding loading states
 * 
 * @example
 * const LoadingComponent = withLoadingState(MyComponent, { skeleton: <MySkeleton /> });
 */
export function withLoadingState<P extends object>(
  Component: ComponentType<P>,
  options: {
    skeleton?: React.ReactNode;
    loadingProp?: keyof P;
    fallback?: React.ComponentType;
  } = {}
) {
  const { skeleton, loadingProp = 'isLoading', fallback } = options;
  
  const LoadingComponent = (props: P) => {
    const isLoading = (props as any)[loadingProp];
    
    if (isLoading) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      
      if (skeleton) {
        return <>{skeleton}</>;
      }
      
      return <Skeleton className="h-20 w-full" />;
    }
    
    return <Component {...props} />;
  };
  
  LoadingComponent.displayName = `Loading(${Component.displayName || Component.name})`;
  
  return LoadingComponent;
}

/**
 * Error boundary component for graceful error handling
 */
export class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Measure component render performance using React.Profiler
 * 
 * @example
 * <MeasureRenders id="MyComponent">
 *   <MyComponent />
 * </MeasureRenders>
 */
export const MeasureRenders: React.FC<{
  id: string;
  children: React.ReactNode;
  onRender?: (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => void;
}> = ({ id, children, onRender }) => {
  const handleRender = (
    profileId: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    // Log render performance in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Render] ${profileId} (${phase}):`,
        {
          actualDuration: Math.round(actualDuration * 100) / 100,
          baseDuration: Math.round(baseDuration * 100) / 100,
          rerenderCost: Math.round((actualDuration / baseDuration) * 100) + '%'
        }
      );
    }
    
    // Call custom handler if provided
    if (onRender) {
      onRender(profileId, phase, actualDuration, baseDuration, startTime, commitTime);
    }
  };
  
  return (
    <React.Profiler id={id} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
};

/**
 * Hook for managing loading states with timeout
 */
export function useLoadingState(
  initialState: boolean = false,
  timeout: number = 5000
) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      setHasTimedOut(false);
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, timeout]);
  
  return {
    isLoading,
    setIsLoading,
    hasTimedOut,
    setHasTimedOut
  };
} 
