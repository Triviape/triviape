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

const ResponsiveUIContext = createContext<ResponsiveUIContextType | undefined>(undefined);

export function ResponsiveUIProvider({ children }: { children: React.ReactNode }) {
  const deviceInfo = useDeviceInfo();
  
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

  const [uiScale, setUIScale] = useState<'compact' | 'regular' | 'large'>(getDefaultUIScale());
  const [animationLevel, setAnimationLevel] = useState<'full' | 'reduced' | 'minimal'>(getDefaultAnimationLevel());
  
  // Update defaults when device info changes
  useEffect(() => {
    setUIScale(getDefaultUIScale());
    setAnimationLevel(getDefaultAnimationLevel());
  }, [deviceInfo.screenSize, deviceInfo.devicePerformance]);

  return (
    <ResponsiveUIContext.Provider
      value={{
        deviceInfo,
        isTouch: deviceInfo.supportsTouch,
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
  
  if (context === undefined) {
    throw new Error('useResponsiveUI must be used within a ResponsiveUIProvider');
  }
  
  return context;
} 