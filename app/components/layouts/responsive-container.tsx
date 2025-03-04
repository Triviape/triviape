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

export function ResponsiveContainer({
  children,
  className,
  as: Component = "div",
  padding = "md",
  maxWidth = "lg",
  centerContent = false,
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

  return (
    <Component
      className={cn(
        "w-full mx-auto",
        MAX_WIDTH_MAP[maxWidth],
        PADDING_MAP[adjustedPadding],
        centerContent && "flex flex-col items-center",
        touchOptimized && "touch-manipulation",
        className
      )}
    >
      <div className={cn("w-full", touchSpacing)}>
        {children}
      </div>
    </Component>
  );
} 