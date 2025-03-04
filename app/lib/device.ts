"use client";

import { isMobile, isTablet, deviceDetect, browserName } from 'react-device-detect';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  browserName: string;
  supportsTouch: boolean;
  supportsWebGL: boolean;
  devicePerformance: 'low' | 'medium' | 'high';
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
}

/**
 * Detects device information and capabilities
 */
export function getDeviceInfo(): DeviceInfo {
  // In SSR context, we need to safely handle browser APIs
  const isClient = typeof window !== 'undefined';
  
  // Check for touch support
  const supportsTouch = isClient && (
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0
  );
  
  // Check for WebGL support
  let supportsWebGL = false;
  if (isClient) {
    try {
      const canvas = document.createElement('canvas');
      supportsWebGL = !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      supportsWebGL = false;
    }
  }
  
  // Determine device performance level
  let devicePerformance: 'low' | 'medium' | 'high' = 'medium';
  if (isClient) {
    // Simple heuristic based on hardware concurrency
    const cores = navigator.hardwareConcurrency || 2;
    if (cores <= 2) devicePerformance = 'low';
    else if (cores <= 4) devicePerformance = 'medium';
    else devicePerformance = 'high';
  }
  
  // Determine screen size category
  let screenSize: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  if (isClient) {
    const width = window.innerWidth;
    if (width < 640) screenSize = 'small';
    else if (width < 1024) screenSize = 'medium';
    else if (width < 1280) screenSize = 'large';
    else screenSize = 'xlarge';
  }
  
  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    browserName: browserName || 'unknown',
    supportsTouch,
    supportsWebGL,
    devicePerformance,
    screenSize
  };
}

/**
 * React hook to get and update device information
 */
export function useDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    // Default values for SSR
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      browserName: 'unknown',
      supportsTouch: false,
      supportsWebGL: false,
      devicePerformance: 'medium',
      screenSize: 'medium'
    };
  }
  
  return getDeviceInfo();
} 