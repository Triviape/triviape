"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useDeviceInfo, DeviceInfo } from '@/app/lib/device';

interface ResponsiveUIContextType {
  deviceInfo: DeviceInfo;
  isTouch: boolean;
  uiScale: 'compact' | 'regular' | 'large';
  animationLevel: 'full' | 'reduced' | 'minimal';
  setAnimationLevel: (level: 'full' | 'reduced' | 'minimal') => void;
  setUIScale: (scale: 'compact' | 'regular' | 'large') => void;
}

// Default values for server-side rendering to prevent hydration mismatch
const defaultContextValue: ResponsiveUIContextType = {
  deviceInfo: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    browserName: 'unknown',
    supportsTouch: false,
    supportsWebGL: false,
    devicePerformance: 'medium',
    screenSize: 'medium'
  },
  isTouch: false,
  uiScale: 'regular',
  animationLevel: 'full',
  setAnimationLevel: () => {},
  setUIScale: () => {}
};

const ResponsiveUIContext = createContext<ResponsiveUIContextType>(defaultContextValue);

export function ResponsiveUIProvider({ children }: { children: React.ReactNode }) {
  const deviceInfo = useDeviceInfo();
  const [isClient, setIsClient] = useState(false);
  
  // Determine default UI scale based on device info
  const getDefaultUIScale = useCallback((): 'compact' | 'regular' | 'large' => {
    if (deviceInfo.screenSize === 'small') return 'compact';
    if (deviceInfo.screenSize === 'xlarge') return 'large';
    return 'regular';
  }, [deviceInfo.screenSize]);

  // Determine default animation level based on device performance
  const getDefaultAnimationLevel = useCallback((): 'full' | 'reduced' | 'minimal' => {
    if (deviceInfo.devicePerformance === 'low') return 'minimal';
    if (deviceInfo.devicePerformance === 'medium') return 'reduced';
    return 'full';
  }, [deviceInfo.devicePerformance]);

  // Start with default values to prevent hydration mismatch
  const [uiScale, setUIScale] = useState<'compact' | 'regular' | 'large'>('regular');
  const [animationLevel, setAnimationLevel] = useState<'full' | 'reduced' | 'minimal'>('full');
  
  // Only update values after initial client-side render to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setUIScale(getDefaultUIScale());
    setAnimationLevel(getDefaultAnimationLevel());
  }, [getDefaultUIScale, getDefaultAnimationLevel]);
  
  // Update defaults when device info changes, but only after initial render
  useEffect(() => {
    if (isClient) {
      setUIScale(getDefaultUIScale());
      setAnimationLevel(getDefaultAnimationLevel());
    }
  }, [isClient, getDefaultUIScale, getDefaultAnimationLevel]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    deviceInfo,
    isTouch: isClient ? deviceInfo.supportsTouch : false,
    uiScale,
    animationLevel,
    setAnimationLevel,
    setUIScale,
  }), [deviceInfo, isClient, uiScale, animationLevel]);

  return (
    <ResponsiveUIContext.Provider value={contextValue}>
      {children}
    </ResponsiveUIContext.Provider>
  );
}

export function useResponsiveUI() {
  const context = useContext(ResponsiveUIContext);
  return context;
}

/**
 * Context selector hook for better performance
 * Only re-renders when the selected value changes
 */
export function useResponsiveUISelector<T>(
  selector: (state: ResponsiveUIContextType) => T
): T {
  const context = useContext(ResponsiveUIContext);
  return useMemo(() => selector(context), [context, selector]);
}

/**
 * Predefined selectors for common use cases
 */
export const useDeviceInfo = () => useResponsiveUISelector(state => state.deviceInfo);
export const useIsTouch = () => useResponsiveUISelector(state => state.isTouch);
export const useUIScale = () => useResponsiveUISelector(state => state.uiScale);
export const useAnimationLevel = () => useResponsiveUISelector(state => state.animationLevel); 