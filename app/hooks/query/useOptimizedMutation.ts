/**
 * Hook for optimizing React Query mutations
 */

'use client';

import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { usePerformanceMonitor } from '@/app/hooks/performance/usePerformanceMonitor';
import { logError, ErrorCategory, ErrorSeverity } from '@/app/lib/errorHandler';
import { trackInteraction } from '@/app/hooks/performance/usePerformanceMonitor';

/**
 * Options for optimized mutation
 */
export interface OptimizedMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  /**
   * Component name for performance monitoring
   */
  componentName?: string;
  
  /**
   * Mutation name for performance monitoring and error logging
   */
  mutationName?: string;
  
  /**
   * Whether to track performance
   */
  trackPerformance?: boolean;
  
  /**
   * Whether to log errors
   */
  logErrors?: boolean;
  
  /**
   * Error severity for logging
   */
  errorSeverity?: ErrorSeverity;
  
  /**
   * Whether to retry on error
   */
  retry?: boolean;
  
  /**
   * Number of retries
   */
  retryCount?: number;
  
  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number | ((retryAttempt: number) => number);
}

/**
 * Hook for optimizing React Query mutations
 * @param options Mutation options
 * @returns Mutation result
 */
export function useOptimizedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: OptimizedMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    componentName = 'UnknownComponent',
    mutationName = 'UnknownMutation',
    trackPerformance = true,
    logErrors = true,
    errorSeverity = ErrorSeverity.ERROR,
    retry = false,
    retryCount = 3,
    retryDelay = 1000,
    ...mutationOptions
  } = options;
  
  // Track component performance
  if (trackPerformance) {
    usePerformanceMonitor({
      componentName: `${componentName}_${mutationName}`,
      trackRenders: true,
      trackTimeOnScreen: true
    });
  }
  
  // Wrap the mutationFn to track performance and handle errors
  const originalMutationFn = mutationOptions.mutationFn;
  
  if (originalMutationFn) {
    mutationOptions.mutationFn = async (variables: TVariables) => {
      let endTracking: (() => void) | undefined;
      
      if (trackPerformance) {
        endTracking = trackInteraction(componentName, `mutation_${mutationName}`);
      }
      
      let retryAttempt = 0;
      let lastError: any = null;
      
      const performMutation = async (): Promise<TData> => {
        try {
          const result = await originalMutationFn(variables);
          return result;
        } catch (error) {
          lastError = error;
          
          if (retry && retryAttempt < retryCount) {
            retryAttempt++;
            
            // Calculate delay
            const delay = typeof retryDelay === 'function'
              ? retryDelay(retryAttempt)
              : retryDelay * retryAttempt;
            
            // Log retry attempt
            console.warn(`Retrying mutation ${mutationName} (attempt ${retryAttempt}/${retryCount}) after ${delay}ms`);
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Retry
            return performMutation();
          }
          
          // Log error if all retries failed or retry is disabled
          if (logErrors) {
            logError(error as Error, {
              category: ErrorCategory.MUTATION,
              severity: errorSeverity,
              context: {
                action: mutationName,
                additionalData: {
                  componentName,
                  mutationName,
                  variables: JSON.stringify(variables).substring(0, 200) // Truncate for logging
                }
              }
            });
          }
          
          throw error;
        }
      };
      
      try {
        const result = await performMutation();
        
        if (endTracking) {
          endTracking();
        }
        
        return result;
      } catch (error) {
        if (endTracking) {
          endTracking();
        }
        
        throw lastError || error;
      }
    };
  }
  
  // Wrap onError to log errors
  const originalOnError = mutationOptions.onError;
  
  if (logErrors && !originalOnError) {
    mutationOptions.onError = (error, variables, context) => {
      logError(error as Error, {
        category: ErrorCategory.MUTATION,
        severity: errorSeverity,
        context: {
          action: mutationName,
          additionalData: {
            componentName,
            mutationName,
            variables: JSON.stringify(variables).substring(0, 200) // Truncate for logging
          }
        }
      });
    };
  } else if (originalOnError) {
    const typedOriginalOnError = originalOnError as (
      error: TError,
      variables: TVariables,
      context: TContext
    ) => void;
    
    mutationOptions.onError = (error, variables, context) => {
      if (logErrors) {
        logError(error as Error, {
          category: ErrorCategory.MUTATION,
          severity: errorSeverity,
          context: {
            action: mutationName,
            additionalData: {
              componentName,
              mutationName,
              variables: JSON.stringify(variables).substring(0, 200) // Truncate for logging
            }
          }
        });
      }
      
      typedOriginalOnError(error, variables, context as TContext);
    };
  }
  
  // Use the mutation with optimized options
  return useMutation<TData, TError, TVariables, TContext>(mutationOptions);
} 