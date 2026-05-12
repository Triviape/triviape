/**
 * Performance Provider Component
 * 
 * This component provides performance monitoring and debugging tools
 * in development mode.
 */

'use client';

import React, { ReactNode, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { recordMetric, MetricType, subscribeWebVitalsForPath } from '@/app/lib/performance';
import { useNetworkMonitor } from '@/app/hooks/performance/useNetworkMonitor';
import { useIsClient } from '@/app/hooks/useIsClient';

// Dynamically import the performance dashboard to reduce bundle size
const PerformanceDashboard = dynamic(
  () => import('@/app/components/performance/PerformanceDashboard').then((m) => m.PerformanceDashboard),
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
  const isClient = useIsClient();
  
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
    
    if (typeof window !== 'undefined') {
      subscribeWebVitalsForPath(pathname);
    }
  }, [pathname, searchParams, isClient]);
  
  return null;
}

/**
 * Performance Provider Component
 */
export default function PerformanceProvider({ children }: PerformanceProviderProps) {
  const isClient = useIsClient();
  
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
