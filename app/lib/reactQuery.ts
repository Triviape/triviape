/**
 * Centralized React Query client configuration
 * Exports a queryClient instance that can be used across the application
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Shared query client instance
 * Note: For client components, prefer using useQueryClient() hook from '@tanstack/react-query'
 * This export should only be used in places where hooks cannot be used
 */
export const queryClient = new QueryClient({
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
}); 