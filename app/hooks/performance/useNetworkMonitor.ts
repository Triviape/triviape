/**
 * Network Monitor Hook
 * 
 * A custom hook for monitoring network requests and resource loading.
 * Tracks fetch requests, resource loading, and provides insights into network performance.
 */

import { useEffect } from 'react';
import { recordMetric, MetricType } from '@/app/lib/performanceAnalyzer';

interface UseNetworkMonitorOptions {
  /**
   * Whether to track fetch requests
   * @default true
   */
  trackFetch?: boolean;
  
  /**
   * Whether to track resource loading (images, scripts, etc.)
   * @default true
   */
  trackResources?: boolean;
  
  /**
   * Whether to track navigation timing
   * @default true
   */
  trackNavigation?: boolean;
}

/**
 * Hook for monitoring network requests and resource loading
 */
export function useNetworkMonitor({
  trackFetch = true,
  trackResources = true,
  trackNavigation = true
}: UseNetworkMonitorOptions = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Track fetch requests
    if (trackFetch) {
      const originalFetch = window.fetch;
      
      window.fetch = async (input, init) => {
        const startTime = performance.now();
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        
        try {
          const response = await originalFetch(input, init);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Record the fetch metric
          recordMetric({
            type: MetricType.RESOURCE,
            name: `Fetch: ${url}`,
            value: duration,
            metadata: {
              url,
              method: init?.method || 'GET',
              status: response.status,
              ok: response.ok
            }
          });
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          // Record the failed fetch metric
          recordMetric({
            type: MetricType.RESOURCE,
            name: `Failed Fetch: ${url}`,
            value: duration,
            metadata: {
              url,
              method: init?.method || 'GET',
              error: error instanceof Error ? error.message : String(error)
            }
          });
          
          throw error;
        }
      };
      
      // Restore original fetch on cleanup
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [trackFetch]);
  
  // Track resource loading
  useEffect(() => {
    if (typeof window === 'undefined' || !trackResources) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          recordMetric({
            type: MetricType.RESOURCE,
            name: `Resource: ${resourceEntry.name}`,
            value: resourceEntry.duration,
            metadata: {
              url: resourceEntry.name,
              initiatorType: resourceEntry.initiatorType,
              transferSize: resourceEntry.transferSize,
              decodedBodySize: resourceEntry.decodedBodySize,
              encodedBodySize: resourceEntry.encodedBodySize
            }
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
    
    return () => {
      observer.disconnect();
    };
  }, [trackResources]);
  
  // Track navigation timing
  useEffect(() => {
    if (typeof window === 'undefined' || !trackNavigation) return;
    
    // Wait for the page to fully load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigationTiming) {
          // Record key navigation metrics
          recordMetric({
            type: MetricType.NAVIGATION,
            name: 'Page Load Time',
            value: navigationTiming.loadEventEnd - navigationTiming.startTime,
            metadata: {
              url: window.location.href,
              domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.startTime,
              domInteractive: navigationTiming.domInteractive - navigationTiming.startTime,
              firstByte: navigationTiming.responseStart - navigationTiming.requestStart,
              redirectTime: navigationTiming.redirectEnd - navigationTiming.redirectStart,
              dnsLookup: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
              tcpConnection: navigationTiming.connectEnd - navigationTiming.connectStart
            }
          });
        }
      }, 0);
    });
  }, [trackNavigation]);
  
  return null;
} 