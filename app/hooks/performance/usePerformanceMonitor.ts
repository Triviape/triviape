/**
 * Performance Monitor Hook
 * 
 * Custom hook for monitoring component performance metrics.
 */

'use client';

import { useEffect, useRef } from 'react';
import { getPerformanceInstance } from '@/app/lib/firebase';
import { 
  recordMetric, 
  MetricType,
  measureExecutionTime,
  measureAsyncExecutionTime
} from '@/app/lib/performanceAnalyzer';

interface UsePerformanceMonitorOptions {
  componentName: string;
  trackRenders?: boolean;
  trackTimeOnScreen?: boolean;
  logWarningAfterRenders?: number;
}

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitor({
  componentName,
  trackRenders = true,
  trackTimeOnScreen = true,
  logWarningAfterRenders = 5
}: UsePerformanceMonitorOptions) {
  const renderCount = useRef(0);
  const mountTime = useRef(0);
  
  useEffect(() => {
    // Track component mount
    mountTime.current = performance.now();
    recordMetric({
      type: MetricType.COMPONENT_MOUNT,
      name: componentName,
      value: 0,
      metadata: { action: 'mount' }
    });
    
    // Track component unmount and time on screen
    return () => {
      const unmountTime = performance.now();
      const timeOnScreen = unmountTime - mountTime.current;
      
      recordMetric({
        type: MetricType.COMPONENT_UNMOUNT,
        name: componentName,
        value: 0,
        metadata: { action: 'unmount' }
      });
      
      if (trackTimeOnScreen) {
        recordMetric({
          type: MetricType.COMPONENT,
          name: `${componentName} time on screen`,
          value: timeOnScreen,
          metadata: { 
            timeOnScreen,
            renderCount: renderCount.current
          }
        });
      }
    };
  }, [componentName, trackTimeOnScreen]);
  
  // Track renders
  if (trackRenders) {
    renderCount.current += 1;
    
    recordMetric({
      type: MetricType.COMPONENT_RENDER,
      name: componentName,
      value: 0,
      metadata: { 
        renderCount: renderCount.current,
        timestamp: performance.now()
      }
    });
    
    if (renderCount.current > logWarningAfterRenders) {
      recordMetric({
        type: MetricType.COMPONENT,
        name: `${componentName} excessive renders`,
        value: renderCount.current,
        metadata: { 
          warning: `Component rendered ${renderCount.current} times`,
          timestamp: performance.now()
        }
      });
    }
  }
  
  /**
   * Track user interaction with timing
   */
  const trackInteraction = (interactionName: string, duration: number) => {
    recordMetric({
      type: MetricType.INTERACTION,
      name: `${componentName}: ${interactionName}`,
      value: duration,
      metadata: { componentName }
    });
  };
  
  /**
   * Measure execution time of a synchronous function
   */
  const measureOperation = <T>(
    operationName: string, 
    operation: () => T
  ): T => {
    return measureExecutionTime(
      operation,
      (duration) => {
        recordMetric({
          type: MetricType.CUSTOM,
          name: `${componentName}: ${operationName}`,
          value: duration,
          metadata: { componentName, operationType: 'sync' }
        });
      }
    );
  };
  
  /**
   * Measure execution time of an asynchronous function
   */
  const measureAsyncOperation = <T>(
    operationName: string, 
    operation: () => Promise<T>
  ): Promise<T> => {
    return measureAsyncExecutionTime(
      operation,
      (duration) => {
        recordMetric({
          type: MetricType.CUSTOM,
          name: `${componentName}: ${operationName}`,
          value: duration,
          metadata: { componentName, operationType: 'async' }
        });
      }
    );
  };
  
  return {
    renderCount: renderCount.current,
    trackInteraction,
    measureOperation,
    measureAsyncOperation
  };
}

/**
 * Track a user interaction
 * @param componentName Component name
 * @param interactionName Interaction name
 * @returns Function to end the tracking
 */
export function trackInteraction(componentName: string, interactionName: string): () => void {
  const startTime = performance.now();
  
  // Track in Firebase Performance if available
  const perf = getPerformanceInstance();
  let trace: any = null;
  
  if (perf) {
    trace = perf.trace(`${componentName}_${interactionName}`);
    trace.start();
  }
  
  // Return a function to end the tracking
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record interaction metric
    recordMetric({
      type: MetricType.CUSTOM,
      name: `${componentName}_${interactionName}`,
      value: duration,
      metadata: {
        componentName,
        interactionName,
        startTime,
        endTime
      }
    });
    
    if (trace) {
      trace.stop();
    }
  };
}

/**
 * Measure the execution time of a function
 * @param fn Function to measure
 * @param componentName Component name
 * @param operationName Operation name
 * @returns Function result
 */
export function measureOperation<T>(
  fn: () => T,
  componentName: string,
  operationName: string
): T {
  return measureExecutionTime(
    fn,
    MetricType.CUSTOM,
    `${componentName}_${operationName}`,
    { componentName, operationName }
  );
}

/**
 * Measure the execution time of an async function
 * @param fn Async function to measure
 * @param componentName Component name
 * @param operationName Operation name
 * @returns Promise with function result
 */
export async function measureAsyncOperation<T>(
  fn: () => Promise<T>,
  componentName: string,
  operationName: string
): Promise<T> {
  return measureAsyncExecutionTime(
    fn,
    MetricType.CUSTOM,
    `${componentName}_${operationName}`,
    { componentName, operationName }
  );
} 