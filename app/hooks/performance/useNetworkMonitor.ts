/**
 * Network Monitor Hook
 * 
 * A custom hook for monitoring network requests and resource loading.
 * Uses PerformanceObserver API for proper instrumentation without monkeypatching.
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
 * Uses standard PerformanceObserver API to avoid monkeypatching
 */
export function useNetworkMonitor({
  trackFetch = true,
  trackResources = true,
  trackNavigation = true
}: UseNetworkMonitorOptions = {}) {
  
  // Track fetch/XHR and resource loading using PerformanceObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observers: PerformanceObserver[] = [];
    
    // Track resources (includes fetch, XHR, images, scripts, etc.)
    if (trackFetch || trackResources) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Categorize by initiator type
            const isFetchOrXhr = resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest';
            
            // Skip if we're not tracking this type
            if (isFetchOrXhr && !trackFetch) return;
            if (!isFetchOrXhr && !trackResources) return;
            
            recordMetric({
              type: MetricType.RESOURCE,
              name: isFetchOrXhr ? `Network: ${resourceEntry.name}` : `Resource: ${resourceEntry.name}`,
              value: resourceEntry.duration,
              metadata: {
                url: resourceEntry.name,
                initiatorType: resourceEntry.initiatorType,
                transferSize: resourceEntry.transferSize,
                decodedBodySize: resourceEntry.decodedBodySize,
                encodedBodySize: resourceEntry.encodedBodySize,
                protocol: resourceEntry.nextHopProtocol
              }
            });
          }
        });
      });
      
      resourceObserver.observe({ 
        entryTypes: ['resource'],
        buffered: true // Capture resources loaded before observer was created
      });
      observers.push(resourceObserver);
    }
    
    // Cleanup
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [trackFetch, trackResources]);
  
  // Track navigation timing
  useEffect(() => {
    if (typeof window === 'undefined' || !trackNavigation) return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navigationEntry = entry as PerformanceNavigationTiming;
          
          // Record key navigation metrics
          recordMetric({
            type: MetricType.NAVIGATION,
            name: 'Page Load',
            value: navigationEntry.loadEventEnd - navigationEntry.startTime,
            metadata: {
              url: window.location.href,
              domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime,
              domInteractive: navigationEntry.domInteractive - navigationEntry.startTime,
              firstByte: navigationEntry.responseStart - navigationEntry.requestStart,
              redirectTime: navigationEntry.redirectEnd - navigationEntry.redirectStart,
              dnsLookup: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
              tcpConnection: navigationEntry.connectEnd - navigationEntry.connectStart
            }
          });
        }
      });
    });
    
    observer.observe({ 
      entryTypes: ['navigation'],
      buffered: true
    });
    
    return () => {
      observer.disconnect();
    };
  }, [trackNavigation]);
  
  return null;
} 