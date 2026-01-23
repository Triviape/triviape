'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { QUERY_CONFIGS, smartRetry } from '@/app/lib/query-config';

/**
 * Provides React Query functionality to the application
 * This enables efficient data fetching with automatic caching and state management
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Use STANDARD config as default
        ...QUERY_CONFIGS.STANDARD,
        // Override with smart retry logic
        retry: smartRetry,
        // Environment-specific overrides
        ...(process.env.NODE_ENV === 'production' && {
          refetchOnReconnect: true,
        }),
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 