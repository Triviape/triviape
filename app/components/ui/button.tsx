"use client";

import React, { forwardRef } from "react";
import { useResponsiveUI } from "@/app/contexts/responsive-ui-context";
import { cn } from "@/app/lib/utils";
import { useBenchmark } from "@/app/hooks/performance/useBenchmark";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  ariaLabel?: string;
  ariaDescribedby?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      leftIcon,
      rightIcon,
      loadingText = "Loading...",
      children,
      disabled,
      ariaLabel,
      ariaDescribedby,
      ariaExpanded,
      ariaControls,
      ...props
    },
    ref
  ) => {
    const { deviceInfo, isTouch, uiScale } = useResponsiveUI();
    
    // Performance benchmarking
    const metrics = useBenchmark({
      name: `Button-${variant}-${size}`,
      enabled: process.env.NODE_ENV === 'development',
      threshold: 16,
      onThresholdExceeded: (metrics) => {
        console.warn(`Button render time exceeded threshold: ${metrics.renderTimeMs}ms`);
      }
    });
    
    // Adjust size based on uiScale
    const getAdjustedSize = () => {
      if (uiScale === 'compact') {
        return size === 'lg' ? 'default' : size === 'default' ? 'sm' : size;
      }
      if (uiScale === 'large') {
        return size === 'sm' ? 'default' : size === 'default' ? 'lg' : size;
      }
      return size;
    };
    
    const adjustedSize = getAdjustedSize();
    
    // Optimize for touch devices
    const touchOptimizedClass = isTouch
      ? "py-3 min-h-[48px] min-w-[48px]" // Larger hit target for touch
      : "";
    
    // Generate accessible label
    const accessibleLabel = ariaLabel || (typeof children === 'string' ? children : undefined);
    
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-label={accessibleLabel}
        aria-describedby={isLoading ? 'loading-description' : ariaDescribedby}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          
          // Variants
          variant === "default" &&
            "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          variant === "outline" &&
            "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
          variant === "secondary" &&
            "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          variant === "ghost" &&
            "hover:bg-accent hover:text-accent-foreground",
          variant === "link" &&
            "text-primary underline-offset-4 hover:underline",
          
          // Sizes
          adjustedSize === "default" && "h-10 px-4 py-2",
          adjustedSize === "sm" && "h-9 rounded-md px-3",
          adjustedSize === "lg" && "h-11 rounded-md px-8",
          adjustedSize === "icon" && "h-10 w-10",
          
          // Touch optimization
          isTouch && touchOptimizedClass,
          
          // Animation optimization based on device performance
          deviceInfo.devicePerformance === 'low' ? "transition-none" : "transition-colors duration-200",
          
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 animate-spin" aria-hidden="true">⧗</span>
            <span id="loading-description" className="sr-only">{loadingText}</span>
          </>
        ) : leftIcon ? (
          <span className="mr-2" aria-hidden="true">{leftIcon}</span>
        ) : null}
        
        {children}
        
        {rightIcon && <span className="ml-2" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button }; 