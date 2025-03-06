/**
 * Performance Hooks
 * 
 * This file exports all performance-related hooks for easy importing.
 */

export { usePerformanceMonitor } from './usePerformanceMonitor';
export { useMeasurePerformance } from './useMeasurePerformance';
export { useNetworkMonitor } from './useNetworkMonitor';

// Re-export types from the performance analyzer for convenience
export { MetricType } from '@/app/lib/performanceAnalyzer'; 