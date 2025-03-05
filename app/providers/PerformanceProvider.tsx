/**
 * Performance Provider Component
 * 
 * This component provides performance monitoring and debugging tools
 * in development mode.
 */

'use client';

import React, { ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { recordMetric, MetricType } from '@/app/lib/performanceAnalyzer';
import { useNetworkMonitor } from '@/app/hooks/performance/useNetworkMonitor';

// Dynamically import the performance dashboard to reduce bundle size
const PerformanceDashboard = dynamic(
  () => import('@/app/components/performance/PerformanceDashboard'),
  { ssr: false }
);

interface PerformanceProviderProps {
  children: ReactNode;
}

/**
 * Performance Provider Component
 */
export default function PerformanceProvider({ children }: PerformanceProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Enable network monitoring in development mode
  const showDashboard = process.env.NODE_ENV === 'development';
  useNetworkMonitor({
    trackFetch: showDashboard,
    trackResources: showDashboard,
    trackNavigation: showDashboard
  });
  
  // Track page navigation
  useEffect(() => {
    // Record navigation metric
    recordMetric({
      type: MetricType.NAVIGATION,
      name: pathname,
      value: 0, // We don't have the actual navigation time here
      metadata: {
        pathname,
        searchParams: searchParams.toString()
      }
    });
    
    // Track web vitals
    if (typeof window !== 'undefined') {
      // Use the web-vitals library if available
      import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
        getCLS(({ value }) => {
          recordMetric({
            type: MetricType.LAYOUT_SHIFT,
            name: 'CLS',
            value,
            metadata: { pathname }
          });
        });
        
        getFID(({ value }) => {
          recordMetric({
            type: MetricType.FIRST_INPUT,
            name: 'FID',
            value,
            metadata: { pathname }
          });
        });
        
        getLCP(({ value }) => {
          recordMetric({
            type: MetricType.PAINT,
            name: 'LCP',
            value,
            metadata: { pathname }
          });
        });
      }).catch(() => {
        console.warn('web-vitals library not available');
      });
    }
  }, [pathname, searchParams]);
  
  return (
    <>
      {children}
      {showDashboard && <PerformanceDashboard />}
    </>
  );
} 