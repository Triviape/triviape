import { useEffect, useState } from 'react';

/**
 * Shared hook to detect client-side hydration
 * Returns true after the first render on the client
 * This prevents hydration mismatches between server and client renders
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient;
}
