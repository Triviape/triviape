"use client";

import React, { useState } from 'react';
import { cn } from '@/app/lib/utils';
import dynamic from 'next/dynamic';
import { useIsClient } from '@/app/hooks/useIsClient';

// Dynamically import Rive to avoid SSR issues
const Rive = dynamic(
  () => import('@rive-app/react-canvas').then(mod => mod.default),
  { ssr: false }
);

interface RiveAnimationProps {
  className?: string;
}

export function RiveAnimation({ className }: RiveAnimationProps) {
  const isClient = useIsClient();
  const [hasError, setHasError] = useState(false);

  if (!isClient || hasError) {
    return <div className={cn("w-full h-[200px] bg-muted/20 rounded-lg", className)} />;
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg shadow-md", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
      <div className="relative z-10">
        <Rive 
          src="https://cdn.rive.app/animations/vehicles.riv"
          className="w-full h-full"
          onError={() => setHasError(true)}
          style={{ 
            width: '100%', 
            height: '200px',
            borderRadius: '0.5rem'
          }}
        />
      </div>
    </div>
  );
} 