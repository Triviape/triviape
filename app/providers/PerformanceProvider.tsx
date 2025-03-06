/**
 * Performance Provider Component
 * 
 * This component provides performance monitoring and debugging tools
 * in development mode.
 */

'use client';

import React, { ReactNode, useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { recordMetric, MetricType } from '@/app/lib/performanceAnalyzer';
import { useNetworkMonitor } from '@/app/hooks/performance/useNetworkMonitor';

// Dynamically import the performance dashboard to reduce bundle size
const PerformanceDashboard = dynamic(
  () => import('@/app/components/performance/PerformanceDashboard'),
  { 
    ssr: false,
    loading: () => <div className="hidden">Loading performance dashboard...</div>
  }
);

interface PerformanceProviderProps {
  children: ReactNode;
}

// Component that uses searchParams wrapped in Suspense
function NavigationMetricsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true on client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Track page navigation
  useEffect(() => {
    if (!isClient) return;
    
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
  }, [pathname, searchParams, isClient]);
  
  return null;
}

/**
 * Performance Provider Component
 */
export default function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true on client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Enable network monitoring in development mode
  const showDashboard = process.env.NODE_ENV === 'development' && isClient;
  useNetworkMonitor({
    trackFetch: showDashboard,
    trackResources: showDashboard,
    trackNavigation: showDashboard
  });
  
  return (
    <>
      {children}
      {showDashboard && (
        <>
          <Suspense fallback={null}>
            <NavigationMetricsTracker />
          </Suspense>
          <PerformanceDashboard />
        </>
      )}
    </>
  );
} 