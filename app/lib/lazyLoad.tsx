/**
 * Utilities for lazy loading components with loading and error states
 */

'use client';

import React, { Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import { trackInteraction } from '@/app/hooks/performance/usePerformanceMonitor';

/**
 * Options for lazy loading components
 */
interface LazyLoadOptions {
  componentName: string;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  trackPerformance?: boolean;
}

/**
 * Default loading component
 */
const DefaultLoadingComponent = () => (
  <div className="flex items-center justify-center p-4 min-h-[200px]">
    <div className="animate-pulse flex space-x-4">
      <div className="rounded-full bg-slate-200 h-10 w-10"></div>
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-slate-200 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-slate-200 rounded col-span-2"></div>
            <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Default error component
 */
const DefaultErrorComponent = ({ error }: { error: Error }) => (
  <div className="p-4 border border-red-300 bg-red-50 rounded-md">
    <h3 className="text-lg font-medium text-red-800">Error Loading Component</h3>
    <p className="mt-2 text-sm text-red-700">{error.message}</p>
  </div>
);

/**
 * Error boundary component for catching errors in lazy loaded components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode | ((error: Error) => React.ReactNode); onError?: (error: Error) => void },
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
    console.error('Component error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback(this.state.error)
        : this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Lazy load a component with loading and error states
 * @param importFn Function that imports the component
 * @param options Options for lazy loading
 * @returns Lazy loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions
): LazyExoticComponent<T> {
  const {
    componentName,
    fallback = <DefaultLoadingComponent />,
    errorFallback = (error: Error) => <DefaultErrorComponent error={error} />,
    onLoad,
    onError,
    trackPerformance = true
  } = options;

  // Create a wrapper to track performance
  const wrappedImport = async () => {
    let endTracking: (() => void) | undefined;
    
    if (trackPerformance) {
      endTracking = trackInteraction('LazyLoad', componentName);
    }
    
    try {
      const result = await importFn();
      
      if (onLoad) {
        onLoad();
      }
      
      if (endTracking) {
        endTracking();
      }
      
      return result;
    } catch (error) {
      if (endTracking) {
        endTracking();
      }
      
      console.error(`Error lazy loading component ${componentName}:`, error);
      throw error;
    }
  };

  const LazyComponent = lazy(wrappedImport);

  // Create a wrapper component that includes Suspense and ErrorBoundary
  const WrappedComponent = (props: any) => (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  // Cast the wrapped component to the same type as the lazy component
  return WrappedComponent as unknown as LazyExoticComponent<T>;
}

/**
 * Create a lazy loaded component with a specific import path
 * @param path Path to the component
 * @param options Options for lazy loading
 * @returns Lazy loaded component
 */
export function createLazyComponent<T extends ComponentType<any>>(
  path: string,
  options: Omit<LazyLoadOptions, 'componentName'>
): LazyExoticComponent<T> {
  const componentName = path.split('/').pop()?.split('.')[0] || 'UnknownComponent';
  
  return lazyLoad<T>(
    () => import(path),
    {
      componentName,
      ...options
    }
  );
} 