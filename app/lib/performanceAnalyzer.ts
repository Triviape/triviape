/**
 * Performance Analyzer
 * 
 * Utility for tracking and analyzing performance metrics throughout the application.
 */

import { ErrorCategory, ErrorSeverity, logError } from './errorHandler';

/**
 * Enum for different types of performance metrics
 */
export enum MetricType {
  NAVIGATION = 'navigation',
  RESOURCE = 'resource',
  PAINT = 'paint',
  LAYOUT_SHIFT = 'layout_shift',
  FIRST_INPUT = 'first_input',
  COMPONENT_RENDER = 'component_render',
  COMPONENT_MOUNT = 'component_mount',
  COMPONENT_UPDATE = 'component_update',
  COMPONENT_UNMOUNT = 'component_unmount',
  COMPONENT = 'component',
  INTERACTION = 'interaction',
  QUERY = 'query',
  MUTATION = 'mutation',
  FIREBASE = 'firebase',
  CUSTOM = 'custom',
}

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  type: MetricType;
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// In-memory storage for metrics
const metrics: PerformanceMetric[] = [];

// Maximum number of metrics to store in memory
const MAX_METRICS = 1000;

/**
 * Record a performance metric
 * @param metric Performance metric to record
 */
export function recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
  try {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    };
    
    // Add to in-memory storage
    metrics.push(fullMetric);
    
    // Trim if needed
    if (metrics.length > MAX_METRICS) {
      metrics.splice(0, metrics.length - MAX_METRICS);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.type}: ${metric.name} = ${metric.value}ms`);
    }
    
    // In production, you would send this to an analytics service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToAnalyticsService(fullMetric);
    // }
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      category: ErrorCategory.PERFORMANCE,
      severity: ErrorSeverity.WARNING,
      context: {
        action: 'record_metric',
        additionalData: { metric }
      }
    });
  }
}

/**
 * Get metrics by type
 * @param type Metric type
 * @returns Array of metrics
 */
export function getMetricsByType(type: MetricType): PerformanceMetric[] {
  return metrics.filter(metric => metric.type === type);
}

/**
 * Get metrics by name
 * @param name Metric name
 * @returns Array of metrics
 */
export function getMetricsByName(name: string): PerformanceMetric[] {
  return metrics.filter(metric => metric.name === name);
}

/**
 * Calculate average metric value
 * @param metrics Array of metrics
 * @returns Average value
 */
export function calculateAverageMetric(metrics: PerformanceMetric[]): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
  return sum / metrics.length;
}

/**
 * Calculate percentile metric value
 * @param metrics Array of metrics
 * @param percentile Percentile (0-100)
 * @returns Percentile value
 */
export function calculatePercentileMetric(
  metrics: PerformanceMetric[],
  percentile: number
): number {
  if (metrics.length === 0) return 0;
  
  // Sort metrics by value
  const sortedMetrics = [...metrics].sort((a, b) => a.value - b.value);
  
  // Calculate index
  const index = Math.ceil((percentile / 100) * sortedMetrics.length) - 1;
  
  // Return value at index
  return sortedMetrics[Math.max(0, index)].value;
}

/**
 * Get performance summary
 * @returns Performance summary
 */
export function getPerformanceSummary(): Record<string, any> {
  const summary: Record<string, any> = {
    totalMetrics: metrics.length,
    byType: {},
    slowestComponents: [],
    averageQueryTime: 0,
    p95QueryTime: 0,
    averageMutationTime: 0,
    p95MutationTime: 0
  };
  
  // Group by type
  Object.values(MetricType).forEach(type => {
    const typeMetrics = getMetricsByType(type as MetricType);
    if (typeMetrics.length > 0) {
      summary.byType[type] = {
        count: typeMetrics.length,
        average: calculateAverageMetric(typeMetrics),
        p95: calculatePercentileMetric(typeMetrics, 95),
        min: Math.min(...typeMetrics.map(m => m.value)),
        max: Math.max(...typeMetrics.map(m => m.value))
      };
    }
  });
  
  // Get slowest components
  const componentRenderMetrics = getMetricsByType(MetricType.COMPONENT);
  const componentsByName: Record<string, PerformanceMetric[]> = {};
  
  componentRenderMetrics.forEach(metric => {
    if (!componentsByName[metric.name]) {
      componentsByName[metric.name] = [];
    }
    componentsByName[metric.name].push(metric);
  });
  
  summary.slowestComponents = Object.entries(componentsByName)
    .map(([name, metrics]) => ({
      name,
      averageRenderTime: calculateAverageMetric(metrics),
      p95RenderTime: calculatePercentileMetric(metrics, 95),
      renderCount: metrics.length
    }))
    .sort((a, b) => b.averageRenderTime - a.averageRenderTime)
    .slice(0, 10);
  
  // Query metrics
  const queryMetrics = getMetricsByType(MetricType.QUERY);
  if (queryMetrics.length > 0) {
    summary.averageQueryTime = calculateAverageMetric(queryMetrics);
    summary.p95QueryTime = calculatePercentileMetric(queryMetrics, 95);
  }
  
  // Mutation metrics
  const mutationMetrics = getMetricsByType(MetricType.MUTATION);
  if (mutationMetrics.length > 0) {
    summary.averageMutationTime = calculateAverageMetric(mutationMetrics);
    summary.p95MutationTime = calculatePercentileMetric(mutationMetrics, 95);
  }
  
  return summary;
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Measure execution time of a function
 * @param fn Function to measure
 * @param metricType Metric type
 * @param metricName Metric name
 * @param metadata Additional metadata
 * @returns Function result
 */
export function measureExecutionTime<T>(
  fn: () => T,
  metricType: MetricType,
  metricName: string,
  metadata?: Record<string, any>
): T {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  recordMetric({
    type: metricType,
    name: metricName,
    value: endTime - startTime,
    metadata
  });
  
  return result;
}

/**
 * Measure execution time of an async function
 * @param fn Async function to measure
 * @param metricType Metric type
 * @param metricName Metric name
 * @param metadata Additional metadata
 * @returns Promise with function result
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  metricType: MetricType,
  metricName: string,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const endTime = performance.now();
    
    recordMetric({
      type: metricType,
      name: metricName,
      value: endTime - startTime,
      metadata
    });
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    
    recordMetric({
      type: metricType,
      name: `${metricName}_error`,
      value: endTime - startTime,
      metadata: {
        ...metadata,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    
    throw error;
  }
} 