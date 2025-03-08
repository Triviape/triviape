'use client';

import React, { useState, useEffect } from 'react';
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
  const [riveError, setRiveError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Setup Rive for stage_base
  const { RiveComponent, rive } = useRive({
    src: '/stage_base.riv',
    autoplay: true,
    layout: new Layout({
      fit: Fit.FitWidth,
      alignment: Alignment.BottomCenter,
    }),
    onLoad: () => {
      console.log('Stage base Rive file loaded successfully');
      setIsRiveLoaded(true);
      setRiveError(null);
      setIsInitialLoad(false);
    },
    onLoadError: (err) => {
      console.error('Error loading stage base Rive file:', err);
      setRiveError('Failed to load stage visuals');
      setIsRiveLoaded(false);
      setIsInitialLoad(false);
    },
  });

  // Retry loading Rive on error
  useEffect(() => {
    if (riveError && rive) {
      const retryTimeout = setTimeout(() => {
        console.log('Retrying Rive load...');
        rive.load({
          src: '/stage_base.riv',
          autoplay: true
        });
      }, 2000);

      return () => clearTimeout(retryTimeout);
    }
  }, [riveError, rive]);

  return (
    <div className={cn(
      "w-full h-full flex flex-col items-center justify-end relative",
      className
    )}>
      {/* Theme-aware background that matches the website background */}
      <div className="w-full h-full bg-background rounded-t-3xl relative overflow-hidden">
        {/* Game mode buttons - positioned at the top */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-20">
          <CircleButtonGroup 
            onDailyClick={onDailyClick}
            onTeamClick={onTeamClick}
            onChallengeClick={onChallengeClick}
            isLoading={isInitialLoad}
          />
        </div>
        
        {/* Stage base at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full h-2/5">
          {!isRiveLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-transparent to-primary/10">
              {riveError ? (
                <div className="text-center">
                  <p className="text-foreground/50">Stage visuals unavailable</p>
                  <p className="text-xs text-foreground/30 mt-1">Don't worry, all features still work!</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-foreground/50">Loading stage...</p>
                  {isInitialLoad && (
                    <p className="text-xs text-foreground/30 mt-1">Preparing your quiz experience</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full">
              <RiveComponent />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 