'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * Provides React Query functionality to the application
 * This enables efficient data fetching with automatic caching and state management
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default staleTime to 5 minutes for most queries
        staleTime: 5 * 60 * 1000,
        // Retry failed queries 3 times
        retry: 3,
        // Use more conservative caching in production
        ...(process.env.NODE_ENV === 'production' && {
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        }),
        // Better error handling in development
        ...(process.env.NODE_ENV === 'development' && {
          refetchOnWindowFocus: false,
        }),
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 