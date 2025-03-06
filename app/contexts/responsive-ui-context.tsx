"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const getDefaultUIScale = (): 'compact' | 'regular' | 'large' => {
    if (deviceInfo.screenSize === 'small') return 'compact';
    if (deviceInfo.screenSize === 'xlarge') return 'large';
    return 'regular';
  };

  // Determine default animation level based on device performance
  const getDefaultAnimationLevel = (): 'full' | 'reduced' | 'minimal' => {
    if (deviceInfo.devicePerformance === 'low') return 'minimal';
    if (deviceInfo.devicePerformance === 'medium') return 'reduced';
    return 'full';
  };

  // Start with default values to prevent hydration mismatch
  const [uiScale, setUIScale] = useState<'compact' | 'regular' | 'large'>('regular');
  const [animationLevel, setAnimationLevel] = useState<'full' | 'reduced' | 'minimal'>('full');
  
  // Only update values after initial client-side render to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setUIScale(getDefaultUIScale());
    setAnimationLevel(getDefaultAnimationLevel());
  }, []);
  
  // Update defaults when device info changes, but only after initial render
  useEffect(() => {
    if (isClient) {
      setUIScale(getDefaultUIScale());
      setAnimationLevel(getDefaultAnimationLevel());
    }
  }, [isClient, deviceInfo.screenSize, deviceInfo.devicePerformance]);

  return (
    <ResponsiveUIContext.Provider
      value={{
        deviceInfo,
        isTouch: isClient ? deviceInfo.supportsTouch : false,
        uiScale,
        animationLevel,
        setAnimationLevel,
        setUIScale,
      }}
    >
      {children}
    </ResponsiveUIContext.Provider>
  );
}

export function useResponsiveUI() {
  const context = useContext(ResponsiveUIContext);
  return context;
} 