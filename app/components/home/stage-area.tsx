'use client';

import React, { useState } from 'react';
import { cn } from '@/app/lib/utils';
import { CircleButtonGroup } from './circle-buttons';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

interface StageAreaProps {
  className?: string;
  isQuizMode?: boolean;
  onDailyClick?: () => void;
  onTeamClick?: () => void;
  onChallengeClick?: () => void;
}

export function StageArea({ 
  className,
  isQuizMode = false,
  onDailyClick,
  onTeamClick,
  onChallengeClick
}: StageAreaProps) {
  const [isRiveLoaded, setIsRiveLoaded] = useState(false);

  // Setup Rive for stage_base
  const { RiveComponent } = useRive({
    src: '/stage_base.riv', // This path is relative to the public directory
    autoplay: true,
    layout: new Layout({
      fit: Fit.FitWidth,
      alignment: Alignment.BottomCenter,
    }),
    onLoad: () => {
      console.log('Stage base Rive file loaded successfully');
      setIsRiveLoaded(true);
    },
    onLoadError: (err) => {
      console.error('Error loading stage base Rive file:', err);
    },
  });

  return (
    <div className={cn(
      "w-full h-full flex flex-col items-center justify-end relative",
      className
    )}>
      {/* Theme-aware background that matches the website background */}
      <div className="w-full h-full bg-background rounded-t-3xl relative overflow-hidden">
        {/* Game mode buttons - positioned at the top */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-10">
          <CircleButtonGroup 
            onDailyClick={onDailyClick}
            onTeamClick={onTeamClick}
            onChallengeClick={onChallengeClick}
          />
        </div>
        
        {/* Stage base at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full h-2/5">
          {!isRiveLoaded && (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-foreground/50">Loading stage...</p>
            </div>
          )}
          <div className="w-full h-full">
            <RiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
} 