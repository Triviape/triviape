'use client';

import { useState, useEffect, useCallback } from 'react';

interface CSRFTokenData {
  token: string;
  headerName: string;
}

interface UseCSRFTokenReturn {
  token: string;
  headerName: string;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  getHeaders: () => Record<string, string>;
}

/**
 * Custom hook for managing CSRF tokens
 */
export function useCSRFToken(): UseCSRFTokenReturn {
  const [tokenData, setTokenData] = useState<CSRFTokenData>({
    token: '',
    headerName: 'x-csrf-token'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get CSRF token from various sources
   */
  const getTokenFromDOM = useCallback((): string => {
    // Try meta tag first
    const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (metaToken) return metaToken;

    // Try cookie as fallback
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1];
    
    return cookieToken || '';
  }, []);

  /**
   * Fetch CSRF token from API
   */
  const fetchToken = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.token) {
        setTokenData({
          token: data.data.token,
          headerName: data.data.headerName || 'x-csrf-token'
        });
      } else {
        throw new Error('Invalid CSRF token response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRF token';
      setError(errorMessage);
      console.error('CSRF token fetch error:', err);
      
      // Fallback to DOM token if API fails
      const domToken = getTokenFromDOM();
      if (domToken) {
        setTokenData({
          token: domToken,
          headerName: 'x-csrf-token'
        });
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getTokenFromDOM]);

  /**
   * Refresh token manually
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    await fetchToken();
  }, [fetchToken]);

  /**
   * Get headers for API requests
   */
  const getHeaders = useCallback((): Record<string, string> => {
    if (!tokenData.token) {
      return {};
    }

    return {
      [tokenData.headerName]: tokenData.token,
      'Content-Type': 'application/json',
    };
  }, [tokenData]);

  /**
   * Initialize token on mount
   */
  useEffect(() => {
    // First try to get token from DOM (faster)
    const domToken = getTokenFromDOM();
    if (domToken) {
      setTokenData({
        token: domToken,
        headerName: 'x-csrf-token'
      });
      setIsLoading(false);
    } else {
      // If no DOM token, fetch from API
      fetchToken();
    }
  }, [getTokenFromDOM, fetchToken]);

  /**
   * Auto-refresh token when it becomes empty
   */
  useEffect(() => {
    if (!isLoading && !tokenData.token && !error) {
      fetchToken();
    }
  }, [isLoading, tokenData.token, error, fetchToken]);

  return {
    token: tokenData.token,
    headerName: tokenData.headerName,
    isLoading,
    error,
    refreshToken,
    getHeaders,
  };
}

/**
 * Hook for getting headers with CSRF token
 */
export function useCSRFHeaders(): () => Record<string, string> {
  const { getHeaders } = useCSRFToken();
  return getHeaders;
}