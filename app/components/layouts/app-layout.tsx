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
}: AppLayoutProps) {
  const { deviceInfo } = useResponsiveUI();
  const isMobile = deviceInfo.isMobile;
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-background",
      className
    )}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
        <footer className="border-t bg-muted/50">
          <ResponsiveContainer maxWidth={maxWidth} padding={padding}>
            {footer}
          </ResponsiveContainer>
        </footer>
      )}
    </div>
  );
} 