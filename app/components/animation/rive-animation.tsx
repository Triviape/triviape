"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import Image from "next/image";
import { useResponsiveUI } from "@/app/contexts/responsive-ui-context";
import { useBenchmark } from "@/app/hooks/performance/useBenchmark";
import { cn } from "@/app/lib/utils";
import { memoWithPerf } from "@/app/lib/componentUtils";

interface RiveAnimationProps {
  src: string;
  stateMachine?: string;
  artboard?: string;
  className?: string;
  autoplay?: boolean;
  fallbackImageSrc?: string; // For low-end devices
  fallbackImageAlt?: string; // Alt text for fallback image
  width?: number;
  height?: number;
  inputs?: {
    [key: string]: boolean | number | string;
  };
  fit?: keyof typeof Fit;
  alignment?: keyof typeof Alignment;
  onRiveEventReceived?: (event: unknown) => void;
  benchmarkName?: string;
}

function RiveAnimationBase({
  src,
  stateMachine,
  artboard,
  className,
  autoplay = true,
  fallbackImageSrc,
  fallbackImageAlt = "Animation fallback",
  width,
  height,
  inputs = {},
  fit = 'Contain',
  alignment = 'Center',
  onRiveEventReceived,
  benchmarkName,
}: RiveAnimationProps) {
  const { deviceInfo, animationLevel } = useResponsiveUI();

  // Choose the animation quality based on performance level
  const [quality, setQuality] = useState<number>(1);
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const loadAttemptRef = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Performance benchmark
  const metrics = useBenchmark({
    name: benchmarkName || `RiveAnimation-${src.split('/').pop()?.split('.')[0] || 'unknown'}`,
    threshold: 32, // Higher threshold for animations
    onThresholdExceeded: (metrics) => {
      // Automatically reduce quality if performance is poor
      if (metrics.frameDrops > 5 && quality > 0.25) {
        setQuality(prev => Math.max(0.25, prev - 0.25));
      }
      // Use fallback if extremely poor performance
      if (metrics.frameDrops > 15 && fallbackImageSrc) {
        setUseFallback(true);
      }
    }
  });

  // Initialize quality based on device performance and animation level
  useEffect(() => {
    if (deviceInfo.devicePerformance === 'low' || animationLevel === 'minimal') {
      setQuality(0.5);
      if (fallbackImageSrc && animationLevel === 'minimal') {
        setUseFallback(true);
      }
    } else if (deviceInfo.devicePerformance === 'medium' || animationLevel === 'reduced') {
      setQuality(0.75);
    } else {
      setQuality(1);
    }
  }, [deviceInfo.devicePerformance, animationLevel, fallbackImageSrc]);

  // Initialize Rive
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine ? [stateMachine] : undefined,
    artboard,
    autoplay,
    layout: new Layout({
      fit: Fit[fit],
      alignment: Alignment[alignment],
    }),
    onLoad: () => {
      // Clear any pending timeout when load is successful
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      
      // Mark as successfully loaded
      loadAttemptRef.current = true;
      console.log(`Rive animation loaded: ${src}`);
    }
  });

  // Set up error detection via timeout
  useEffect(() => {
    // Only set up timeout if we haven't already tried loading
    if (!loadAttemptRef.current && !useFallback) {
      // Set a timeout to check if rive loaded successfully
      loadTimeoutRef.current = setTimeout(() => {
        // If rive is still null after timeout, assume error
        if (!rive) {
          console.error(`Error loading Rive animation: ${src} (timeout)`);
          setUseFallback(true);
        }
      }, 5000); // 5 second timeout
    }
    
    return () => {
      // Clean up timeout on unmount or when dependencies change
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [rive, src, useFallback]);

  // Create inputs
  const inputRefs: Record<string, any> = {};
  if (rive && stateMachine) {
    Object.entries(inputs).forEach(([key, value]) => {
      const input = useStateMachineInput(rive, stateMachine, key);
      if (input) {
        inputRefs[key] = input;
        
        // Set input value
        if (typeof value === 'boolean') {
          input.value = value;
        } else if (typeof value === 'number') {
          input.value = value;
        } else {
          // For string triggers
          if (value === 'fire') {
            input.fire();
          }
        }
      }
    });
  }

  // Register event listeners
  useEffect(() => {
    if (rive && onRiveEventReceived) {
      const eventCallback = (event: unknown) => {
        onRiveEventReceived(event);
      };
      
      // Since EventType isn't directly exposed as we expected,
      // we'll handle it by checking rive.eventTypes if available,
      // or just use manually defined events
      const events = ['play', 'pause', 'stop', 'loop'];
      
      // Safely register available events
      events.forEach(eventName => {
        try {
          // Use any as a workaround for strict type checking
          rive.on(eventName as any, eventCallback);
        } catch (error) {
          console.warn(`Event type ${eventName} not supported`);
        }
      });
      
      return () => {
        events.forEach(eventName => {
          try {
            rive.off(eventName as any, eventCallback);
          } catch {
            // Ignore errors when unregistering potentially unsupported events
          }
        });
      };
    }
  }, [rive, onRiveEventReceived]);

  // Apply quality scaling to the container element instead of direct canvas manipulation
  useEffect(() => {
    if (rive && quality !== 1) {
      // Instead of trying to access the private canvas property,
      // apply scaling to the container element via CSS
      const containerElement = document.querySelector(`[data-animation-id="${benchmarkName || src}"]`);
      if (containerElement && containerElement instanceof HTMLElement) {
        // Apply CSS filter for low quality rendering
        if (quality <= 0.5) {
          containerElement.style.filter = 'blur(0.5px)';
        } else {
          containerElement.style.filter = '';
        }
        
        // Scale the animation if necessary (can help with performance)
        if (quality < 0.75) {
          containerElement.style.transform = `scale(${quality * 1.1})`;
          containerElement.style.transformOrigin = 'center';
        } else {
          containerElement.style.transform = '';
        }
      }
    }
  }, [rive, quality, benchmarkName, src]);

  // Render fallback image if needed
  if (useFallback && fallbackImageSrc) {
    return (
      <div 
        className={cn(
          "relative overflow-hidden",
          className
        )}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%'
        }}
      >
        <Image 
          src={fallbackImageSrc} 
          alt={fallbackImageAlt} 
          fill
          sizes={`${width || 300}px`}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Render Rive animation
  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        className
      )}
      data-animation-id={benchmarkName || src}
      data-testid="rive-component-container"
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%'
      }}
    >
      <RiveComponent />
      
      {/* Performance indicator in dev mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
          {metrics.frameDrops > 0 ? `${metrics.frameDrops} drops` : 'Perf: OK'}
          {quality < 1 && ` (${quality * 100}%)`}
        </div>
      )}
    </div>
  );
}

// Export memoized version
export const RiveAnimation = memoWithPerf(RiveAnimationBase, {
  name: 'RiveAnimation',
  warnAfterRenders: 3
}); 