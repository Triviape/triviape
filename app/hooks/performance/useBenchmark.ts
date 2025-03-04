"use client";

import { useEffect, useRef, useState } from 'react';
import { useResponsiveUI } from '@/app/contexts/responsive-ui-context';

interface BenchmarkOptions {
  name: string;
  enabled?: boolean;
  threshold?: number; // threshold in ms
  onThresholdExceeded?: (metrics: BenchmarkMetrics) => void;
}

export interface BenchmarkMetrics {
  name: string;
  renderTimeMs: number;
  frameDrops: number;
  memoryUsageMb?: number;
  renderCount: number;
  isPerformant: boolean;
}

// Extend Performance interface with Chrome-specific memory property
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * A hook for benchmarking component performance
 */
export function useBenchmark(options: BenchmarkOptions): BenchmarkMetrics {
  const { name, enabled = true, threshold = 16, onThresholdExceeded } = options;
  const { deviceInfo } = useResponsiveUI();
  
  const [metrics, setMetrics] = useState<BenchmarkMetrics>({
    name,
    renderTimeMs: 0,
    frameDrops: 0,
    renderCount: 0,
    isPerformant: true
  });
  
  const startTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const framesRef = useRef<number[]>([]);
  
  // Adjust threshold based on device performance
  const adjustedThreshold = deviceInfo.devicePerformance === 'low' 
    ? threshold * 1.5 
    : threshold;
  
  useEffect(() => {
    if (!enabled) return;

    // Mark start time
    startTimeRef.current = performance.now();
    
    // Setup frame drop detection
    let lastFrameTime = performance.now();
    let frameDrops = 0;
    
    const frameCallback = () => {
      const now = performance.now();
      const frameDuration = now - lastFrameTime;
      
      // If frame takes longer than 16.7ms (60fps), count it as dropped
      if (frameDuration > 16.7) {
        frameDrops += Math.floor(frameDuration / 16.7) - 1;
      }
      
      framesRef.current.push(frameDuration);
      lastFrameTime = now;
      
      if (enabled) {
        frameId = requestAnimationFrame(frameCallback);
      }
    };
    
    let frameId = requestAnimationFrame(frameCallback);
    
    return () => {
      cancelAnimationFrame(frameId);
      
      // Calculate render time
      const renderTime = performance.now() - startTimeRef.current;
      renderCountRef.current += 1;
      
      // Calculate metrics
      const isPerformant = renderTime < adjustedThreshold;
      
      // Update metrics
      const newMetrics: BenchmarkMetrics = {
        name,
        renderTimeMs: renderTime,
        frameDrops,
        renderCount: renderCountRef.current,
        isPerformant
      };
      
      // Add memory usage if available (Chrome-specific)
      const extendedPerformance = performance as ExtendedPerformance;
      if (extendedPerformance.memory) {
        newMetrics.memoryUsageMb = (extendedPerformance.memory.usedJSHeapSize / 1048576);
      }
      
      setMetrics(newMetrics);
      
      // Call callback if threshold exceeded
      if (!isPerformant && onThresholdExceeded) {
        onThresholdExceeded(newMetrics);
      }
    };
  }, [name, enabled, adjustedThreshold, onThresholdExceeded]);
  
  return metrics;
} 