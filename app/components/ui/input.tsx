"use client";

import * as React from "react";
import { useResponsiveUI } from "@/app/contexts/responsive-ui-context";
import { cn } from "@/app/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, autoComplete = "off", ...props }, ref) => {
    const { isTouch, deviceInfo } = useResponsiveUI();
    
    // Adjust padding based on presence of icons
    const paddingLeft = leftIcon ? "pl-10" : "pl-4";
    const paddingRight = rightIcon ? "pr-10" : "pr-4";
    
    // Adjust for touch devices
    const touchClass = isTouch ? "py-3 min-h-[48px]" : "";
    
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background file:border-0 file:bg-transparent",
            "file:text-sm file:font-medium placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            paddingLeft,
            paddingRight,
            touchClass,
            // Optimize animations based on device performance
            deviceInfo.devicePerformance === 'low' ? "transition-none" : "transition-colors duration-200",
            className
          )}
          ref={ref}
          autoComplete={autoComplete}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input }; 