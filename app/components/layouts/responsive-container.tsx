import React from "react";
import { useResponsiveUI } from "@/app/contexts/responsive-ui-context";
import { cn } from "@/app/lib/utils";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  padding?: "none" | "sm" | "md" | "lg";
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  centerContent?: boolean;
  containerQueries?: boolean;
  aspectRatio?: "auto" | "square" | "video" | "portrait";
}

const PADDING_MAP = {
  none: "",
  sm: "px-2 py-2 tablet:px-4 tablet:py-3",
  md: "px-4 py-4 tablet:px-6 tablet:py-5",
  lg: "px-5 py-6 tablet:px-8 tablet:py-8",
};

const MAX_WIDTH_MAP = {
  xs: "max-w-[320px]",
  sm: "max-w-[640px]",
  md: "max-w-[768px]",
  lg: "max-w-[1024px]",
  xl: "max-w-[1280px]",
  full: "max-w-full",
};

const ASPECT_RATIO_MAP = {
  auto: "",
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
};

export function ResponsiveContainer({
  children,
  className,
  as: Component = "div",
  padding = "md",
  maxWidth = "lg",
  centerContent = false,
  containerQueries = false,
  aspectRatio = "auto",
}: ResponsiveContainerProps) {
  const { deviceInfo, uiScale } = useResponsiveUI();

  // Adjust padding based on UI scale
  const getAdjustedPadding = () => {
    if (uiScale === 'compact') {
      return padding === 'lg' ? 'md' : padding === 'md' ? 'sm' : padding;
    }
    if (uiScale === 'large') {
      return padding === 'sm' ? 'md' : padding === 'md' ? 'lg' : padding;
    }
    return padding;
  };

  const adjustedPadding = getAdjustedPadding();
  
  // Determine if we should optimize for touch
  const touchOptimized = deviceInfo.supportsTouch;
  
  // Apply different spacing for touch devices
  const touchSpacing = touchOptimized ? "gap-6" : "gap-4";

  // Container queries classes
  const containerQueryClasses = containerQueries ? [
    "@container",
    "@[320px]:px-2",
    "@[480px]:px-4", 
    "@[768px]:px-6",
    "@[1024px]:px-8"
  ].join(" ") : "";

  return (
    <Component
      className={cn(
        "w-full mx-auto",
        MAX_WIDTH_MAP[maxWidth],
        PADDING_MAP[adjustedPadding],
        ASPECT_RATIO_MAP[aspectRatio],
        centerContent && "flex flex-col items-center",
        touchOptimized && "touch-manipulation",
        containerQueryClasses,
        className
      )}
    >
      <div className={cn("w-full", touchSpacing)}>
        {children}
      </div>
    </Component>
  );
}

/**
 * Container query wrapper for responsive components
 */
export function ContainerQuery({
  children,
  className,
  breakpoints = {
    sm: "320px",
    md: "768px", 
    lg: "1024px"
  }
}: {
  children: React.ReactNode;
  className?: string;
  breakpoints?: Record<string, string>;
}) {
  return (
    <div 
      className={cn("@container", className)}
      style={{
        containerType: "inline-size"
      }}
    >
      {children}
    </div>
  );
}

/**
 * Responsive text component with container queries
 */
export function ResponsiveText({
  children,
  className,
  sizes = {
    sm: "text-sm",
    md: "text-base", 
    lg: "text-lg",
    xl: "text-xl"
  }
}: {
  children: React.ReactNode;
  className?: string;
  sizes?: Record<string, string>;
}) {
  const sizeClasses = Object.entries(sizes)
    .map(([breakpoint, size]) => `@${breakpoint}:${size}`)
    .join(" ");

  return (
    <span className={cn(sizeClasses, className)}>
      {children}
    </span>
  );
} 