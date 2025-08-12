'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DeviceFingerprint {
  timezone: string;
  screenResolution: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  sessionStorageEnabled: boolean;
}

interface UseDeviceFingerprintReturn {
  fingerprint: DeviceFingerprint | null;
  isLoading: boolean;
  error: string | null;
  regenerateFingerprint: () => void;
}

/**
 * Hook to collect device fingerprint data for session security
 */
export function useDeviceFingerprint(): UseDeviceFingerprintReturn {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateFingerprint = useCallback((): DeviceFingerprint | null => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return null;
      }

      // Get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get screen resolution
      const screenResolution = `${window.screen.width}x${window.screen.height}`;

      // Get platform information
      const platform = navigator.platform || 'unknown';

      // Get language
      const language = navigator.language || 'unknown';

      // Test browser capabilities
      const cookiesEnabled = navigator.cookieEnabled;
      
      // Test localStorage availability
      let localStorageEnabled = false;
      try {
        const testKey = '__test_localStorage__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        localStorageEnabled = true;
      } catch {
        localStorageEnabled = false;
      }

      // Test sessionStorage availability
      let sessionStorageEnabled = false;
      try {
        const testKey = '__test_sessionStorage__';
        sessionStorage.setItem(testKey, 'test');
        sessionStorage.removeItem(testKey);
        sessionStorageEnabled = true;
      } catch {
        sessionStorageEnabled = false;
      }

      return {
        timezone,
        screenResolution,
        platform,
        language,
        cookiesEnabled,
        localStorageEnabled,
        sessionStorageEnabled,
      };
    } catch (err) {
      console.error('Error generating device fingerprint:', err);
      return null;
    }
  }, []);

  const regenerateFingerprint = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newFingerprint = generateFingerprint();
      setFingerprint(newFingerprint);
      
      if (!newFingerprint) {
        setError('Failed to generate device fingerprint');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [generateFingerprint]);

  // Generate fingerprint on mount
  useEffect(() => {
    // Add a small delay to ensure all browser APIs are available
    const timer = setTimeout(() => {
      regenerateFingerprint();
    }, 100);

    return () => clearTimeout(timer);
  }, [regenerateFingerprint]);

  return {
    fingerprint,
    isLoading,
    error,
    regenerateFingerprint,
  };
}

/**
 * Send device fingerprint to server for validation
 */
export async function sendDeviceFingerprint(fingerprint: DeviceFingerprint): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/fingerprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(fingerprint),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending device fingerprint:', error);
    return false;
  }
}

/**
 * Hook for session validation with fingerprinting
 */
export function useSessionFingerprint() {
  const { fingerprint, isLoading } = useDeviceFingerprint();
  const [validationStatus, setValidationStatus] = useState<'pending' | 'valid' | 'invalid' | 'challenge'>('pending');

  const validateSession = useCallback(async () => {
    if (!fingerprint || isLoading) {
      return;
    }

    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ deviceFingerprint: fingerprint }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.shouldChallenge) {
          setValidationStatus('challenge');
        } else if (data.isValid) {
          setValidationStatus('valid');
        } else {
          setValidationStatus('invalid');
        }
      } else {
        setValidationStatus('invalid');
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setValidationStatus('invalid');
    }
  }, [fingerprint, isLoading]);

  // Validate session when fingerprint is ready
  useEffect(() => {
    if (fingerprint && !isLoading) {
      validateSession();
    }
  }, [fingerprint, isLoading, validateSession]);

  return {
    fingerprint,
    validationStatus,
    validateSession,
    isLoading,
  };
}

/**
 * Utility to get a simplified device fingerprint string
 */
export function getSimplifiedFingerprint(fingerprint: DeviceFingerprint): string {
  return [
    fingerprint.platform,
    fingerprint.screenResolution,
    fingerprint.language,
    fingerprint.timezone.split('/')[0], // Just the continent
  ].join('|');
}