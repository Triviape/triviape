# Performance Monitoring System

This document outlines the performance monitoring system implemented in our application. The system provides tools for tracking, analyzing, and visualizing performance metrics across the application.

## Overview

The performance monitoring system consists of several components:

1. **Performance Analyzer**: Core utility for recording and analyzing performance metrics
2. **Performance Dashboard**: UI component for visualizing performance metrics
3. **Performance Provider**: Provider component that enables monitoring in development mode
4. **Performance Hooks**: Custom hooks for measuring performance in components

## Performance Analyzer

The performance analyzer (`app/lib/performanceAnalyzer.ts`) provides utilities for:

- Recording performance metrics
- Measuring execution time of functions
- Calculating performance statistics
- Generating performance summaries

### Metric Types

The system tracks various types of metrics:

- **Navigation**: Page navigation and loading times
- **Resource**: Resource loading (images, scripts, etc.)
- **Paint**: Paint events (LCP, FCP)
- **Layout Shift**: Cumulative Layout Shift (CLS)
- **First Input**: First Input Delay (FID)
- **Component**: Component rendering, mounting, and unmounting
- **Query**: React Query operations
- **Mutation**: React Query mutations
- **Firebase**: Firebase operations
- **Custom**: Custom metrics

## Performance Hooks

### usePerformanceMonitor

The `usePerformanceMonitor` hook (`app/hooks/performance/usePerformanceMonitor.ts`) tracks component lifecycle events:

```tsx
import { usePerformanceMonitor } from '@/app/hooks/performance';

function MyComponent() {
  usePerformanceMonitor({
    componentName: 'MyComponent',
    trackRenders: true,
    trackTimeOnScreen: true,
    logWarningAfterRenders: 5
  });
  
  // Component code...
}
```

### useMeasurePerformance

The `useMeasurePerformance` hook (`app/hooks/performance/useMeasurePerformance.ts`) provides utilities for measuring the performance of operations:

```tsx
import { useMeasurePerformance } from '@/app/hooks/performance';

function MyComponent() {
  const { measureSync, measureAsync, recordCustomMetric } = useMeasurePerformance({
    context: 'MyComponent'
  });
  
  // Measure a synchronous operation
  const result = measureSync('calculation', () => {
    // Expensive calculation
    return 42;
  });
  
  // Measure an asynchronous operation
  const fetchData = async () => {
    const data = await measureAsync('fetchData', () => {
      return fetch('/api/data').then(res => res.json());
    });
    
    // Use data...
  };
  
  // Record a custom metric
  const handleClick = () => {
    recordCustomMetric('buttonClick', 1);
  };
  
  // Component code...
}
```

### useNetworkMonitor

The `useNetworkMonitor` hook (`app/hooks/performance/useNetworkMonitor.ts`) tracks network requests and resource loading:

```tsx
import { useNetworkMonitor } from '@/app/hooks/performance';

function MyComponent() {
  useNetworkMonitor({
    trackFetch: true,
    trackResources: true,
    trackNavigation: true
  });
  
  // Component code...
}
```

## Performance Dashboard

The performance dashboard (`app/components/performance/PerformanceDashboard.tsx`) provides a visual interface for viewing performance metrics. It's automatically included in development mode through the `PerformanceProvider`.

Features:
- View metrics by type
- See slowest components
- Clear metrics
- Configure refresh interval

## Performance Provider

The performance provider (`app/providers/PerformanceProvider.tsx`) enables performance monitoring in development mode. It's included in the application's root layout.

Features:
- Tracks page navigation
- Monitors web vitals
- Includes the performance dashboard in development mode

## Best Practices

1. **Use the appropriate hook for your needs**:
   - `usePerformanceMonitor` for component lifecycle monitoring
   - `useMeasurePerformance` for measuring specific operations
   - `useNetworkMonitor` for tracking network requests

2. **Be selective about what you measure**:
   - Focus on expensive operations
   - Avoid measuring trivial operations that could add overhead

3. **Use meaningful names for metrics**:
   - Include component and operation names
   - Be specific about what's being measured

4. **Review the dashboard regularly**:
   - Look for slow components and operations
   - Identify patterns and bottlenecks

5. **Optimize based on data**:
   - Use the metrics to guide optimization efforts
   - Focus on the slowest operations first

## Implementation Details

The performance monitoring system is designed to have minimal impact on production performance:

- The dashboard is only included in development mode
- Monitoring can be selectively enabled/disabled
- Metrics are stored in memory, not persisted

## Future Improvements

Potential future improvements to the system:

1. **Persistent storage**: Save metrics to localStorage or a backend service
2. **Export/import**: Allow exporting and importing metrics for analysis
3. **Comparison view**: Compare performance between different versions
4. **Threshold alerts**: Alert when metrics exceed thresholds
5. **Integration with analytics**: Send metrics to analytics services 