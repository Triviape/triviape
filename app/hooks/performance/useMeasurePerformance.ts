/**
 * Measure Performance Hook
 * 
 * A custom hook for measuring the performance of operations in components.
 * Provides utilities for measuring both synchronous and asynchronous operations.
 */

import { useCallback } from 'react';
import { 
  measureExecutionTime, 
  measureAsyncExecutionTime, 
  recordMetric, 
  MetricType 
} from '@/app/lib/performanceAnalyzer';

interface UseMeasurePerformanceOptions {
  /**
   * The name of the component or context where measurements are being taken
   */
  context: string;
  
  /**
   * Whether to automatically log metrics to the performance analyzer
   * @default true
   */
  autoLog?: boolean;
}

/**
 * Hook for measuring performance of operations
 */
export function useMeasurePerformance({
  context,
  autoLog = true
}: UseMeasurePerformanceOptions) {
  /**
   * Measure the execution time of a synchronous function
   * 
   * @param name The name of the operation being measured
   * @param operation The function to measure
   * @param metricType The type of metric to record (defaults to CUSTOM)
   * @returns The result of the operation
   */
  const measureSync = useCallback(<T>(
    name: string,
    operation: () => T,
    metricType: MetricType = MetricType.CUSTOM
  ): T => {
    return measureExecutionTime(
      operation,
      metricType,
      `${context}: ${name}`,
      {
        context,
        operationType: 'sync'
      }
    );
  }, [context, autoLog]);
  
  /**
   * Measure the execution time of an asynchronous function
   * 
   * @param name The name of the operation being measured
   * @param operation The async function to measure
   * @param metricType The type of metric to record (defaults to CUSTOM)
   * @returns A promise that resolves to the result of the operation
   */
  const measureAsync = useCallback(<T>(
    name: string,
    operation: () => Promise<T>,
    metricType: MetricType = MetricType.CUSTOM
  ): Promise<T> => {
    return measureAsyncExecutionTime(
      operation,
      metricType,
      `${context}: ${name}`,
      {
        context,
        operationType: 'async'
      }
    );
  }, [context, autoLog]);
  
  /**
   * Record a custom metric
   * 
   * @param name The name of the metric
   * @param value The value of the metric
   * @param metricType The type of metric (defaults to CUSTOM)
   * @param metadata Additional metadata to record
   */
  const recordCustomMetric = useCallback((
    name: string,
    value: number,
    metricType: MetricType = MetricType.CUSTOM,
    metadata: Record<string, any> = {}
  ) => {
    recordMetric({
      type: metricType,
      name: `${context}: ${name}`,
      value,
      metadata: {
        context,
        ...metadata
      }
    });
  }, [context]);
  
  return {
    measureSync,
    measureAsync,
    recordCustomMetric
  };
} 