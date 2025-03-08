"use client";

import React from 'react';
import { useResponsiveUI } from '@/app/contexts/responsive-ui-context';
import { ResponsiveContainer } from './responsive-container';
import { cn } from '@/app/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  contentClassName?: string;
  showSidebar?: boolean;
  useShadcnSidebar?: boolean;
}

export function AppLayout({
  children,
  header,
  footer,
  sidebar,
  maxWidth = 'xl',
  padding = 'lg',
  className,
  contentClassName,
  showSidebar = true,
  useShadcnSidebar = false,
}: AppLayoutProps) {
  const { deviceInfo } = useResponsiveUI();
  const isMobile = deviceInfo.isMobile;
  
  // If using shadcn sidebar, we render a simpler layout
  if (useShadcnSidebar) {
    return (
      <div className={cn(
        "min-h-screen flex flex-col bg-background",
        className
      )}>
        {/* Header */}
        {header && (
          <header className="sticky top-0 z-40 w-full border-b bg-background">
            <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
              {header}
            </ResponsiveContainer>
          </header>
        )}
        
        {/* Main content with sidebar */}
        <div className="flex-1 flex relative">
          {/* Sidebar is rendered by the SidebarProvider and will overlay content */}
          {sidebar}
          
          {/* Main content - takes full width regardless of sidebar state */}
          <main className={cn(
            "flex-1 w-full relative z-0",
            contentClassName
          )}>
            <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
              {children}
            </ResponsiveContainer>
          </main>
        </div>
        
        {/* Footer */}
        {footer && (
          <footer className="border-t bg-muted/50 relative z-0">
            <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
              {footer}
            </ResponsiveContainer>
          </footer>
        )}
      </div>
    );
  }
  
  // Original layout for backward compatibility
  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      className
    )}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
            {header}
          </ResponsiveContainer>
        </header>
      )}
      
      {/* Main content with optional sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar - only shown if provided and showSidebar is true */}
        {sidebar && showSidebar && !isMobile && (
          <aside className="w-64 shrink-0 border-r h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <div className="p-4 h-full">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <main className={cn(
          "flex-1",
          contentClassName
        )}>
          <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
            {/* Mobile sidebar toggle could be added here */}
            {children}
          </ResponsiveContainer>
        </main>
      </div>
      
      {/* Footer */}
      {footer && (
        <footer className="border-t bg-muted/50 relative z-0">
          <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
            {footer}
          </ResponsiveContainer>
        </footer>
      )}
    </div>
  );
} 