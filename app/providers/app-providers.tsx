'use client';

import { ReactNode, useEffect, useState, Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { usePathname, useSearchParams } from 'next/navigation';
import { recordMetric, MetricType } from '@/app/lib/performanceAnalyzer';
import { useNetworkMonitor } from '@/app/hooks/performance/useNetworkMonitor';
import dynamic from 'next/dynamic';
import { ReactQueryProvider } from './query-provider';
import { ResponsiveUIProvider } from '../contexts/responsive-ui-context';

const PerformanceDashboard = dynamic(
  () => import('@/app/components/performance/PerformanceDashboard'),
  { 
    ssr: false,
    loading: () => <div className="hidden">Loading performance dashboard...</div>
  }
);

interface AppProvidersProps {
  children: ReactNode;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const shouldUseEmulators = () => process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

function NavigationMetricsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (!isClient) return;
    
    recordMetric({
      type: MetricType.NAVIGATION,
      name: pathname,
      value: 0,
      metadata: {
        pathname,
        searchParams: searchParams.toString()
      }
    });
    
    if (typeof window !== 'undefined') {
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
 * Consolidated App Providers
 * 
 * Combines all app-level providers into a single component:
 * - NextAuth SessionProvider
 * - React Query
 * - Responsive UI Context
 * - Firebase initialization
 * - Performance monitoring (dev only)
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [isClient, setIsClient] = useState(false);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);

  // Initialize Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        if (getApps().length === 0) {
          const app = initializeApp(firebaseConfig);
          const auth = getAuth(app);
          const firestore = getFirestore(app);
          const storage = getStorage(app);
          const functions = getFunctions(app);

          if (shouldUseEmulators()) {
            connectAuthEmulator(auth, 'http://localhost:9099');
            connectFirestoreEmulator(firestore, 'localhost', 8080);
            connectStorageEmulator(storage, 'localhost', 9199);
            connectFunctionsEmulator(functions, 'localhost', 5001);
          }
        }
      } catch (err) {
        console.error('Error initializing Firebase:', err);
        setFirebaseError(err instanceof Error ? err : new Error('Unknown error initializing Firebase'));
      }
    };

    initFirebase();
    setIsClient(true);
  }, []);

  // Performance monitoring
  const showDashboard = process.env.NODE_ENV === 'development' && isClient;
  useNetworkMonitor({
    trackFetch: showDashboard,
    trackResources: showDashboard,
    trackNavigation: showDashboard
  });

  if (firebaseError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold text-red-600">Firebase Initialization Error</h2>
          <p className="text-gray-700">{firebaseError.message}</p>
          <p className="text-sm text-gray-500">
            Please check your Firebase configuration and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <ReactQueryProvider>
        <ResponsiveUIProvider>
          {children}
          {showDashboard && (
            <>
              <Suspense fallback={null}>
                <NavigationMetricsTracker />
              </Suspense>
              <PerformanceDashboard />
            </>
          )}
        </ResponsiveUIProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
