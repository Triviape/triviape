"use client";

import React, { useState } from 'react';
import { useResponsiveUI } from '@/app/contexts/responsive-ui-context';
import { RiveAnimation } from '@/app/components/animation/rive-animation';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

export function AnimationPlayground() {
  const { deviceInfo, animationLevel, setAnimationLevel } = useResponsiveUI();
  const [selectedExample, setSelectedExample] = useState<string>('simple');
  
  // Set a placeholder for now - in a real app you would have actual Rive animations
  const animationSrc = '/animations/placeholder.riv';
  const fallbackImageSrc = '/animations/placeholder-fallback.png';
  
  // Sample animation inputs
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  
  // For multiple animations to demo
  const animations = {
    simple: {
      src: animationSrc,
      fallbackImageSrc: fallbackImageSrc,
      stateMachine: 'State Machine 1',
      description: 'A simple animation that works well on all devices.'
    },
    complex: {
      src: animationSrc,
      fallbackImageSrc: fallbackImageSrc,
      stateMachine: 'State Machine 2',
      description: 'A more complex animation that showcases performance scaling.'
    },
    interactive: {
      src: animationSrc,
      fallbackImageSrc: fallbackImageSrc,
      stateMachine: 'Interactive',
      description: 'An interactive animation with touch/mouse inputs.'
    }
  };
  
  const currentAnimation = animations[selectedExample as keyof typeof animations];
  
  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Animation Playground</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div>
            <h3 className="font-medium mb-2">Animation Examples</h3>
            <div className="flex flex-col space-y-2">
              {Object.entries(animations).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setSelectedExample(key)}
                  className={cn(
                    "py-2 px-4 rounded text-left",
                    selectedExample === key 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Animation Controls</h3>
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-sm">Playback</label>
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant="outline"
                  size="sm"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              </div>
              
              <div>
                <label className="block mb-1 text-sm">Speed</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0.25"
                    max="2"
                    step="0.25"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm">{speed}x</span>
                </div>
              </div>
              
              <div>
                <label className="block mb-1 text-sm">Animation Quality</label>
                <div className="space-y-1">
                  <Button 
                    size="sm" 
                    variant={animationLevel === 'minimal' ? 'default' : 'outline'}
                    onClick={() => setAnimationLevel('minimal')}
                    className="w-full justify-start"
                  >
                    Minimal (Low-end devices)
                  </Button>
                  <Button 
                    size="sm" 
                    variant={animationLevel === 'reduced' ? 'default' : 'outline'}
                    onClick={() => setAnimationLevel('reduced')}
                    className="w-full justify-start"
                  >
                    Reduced (Medium devices)
                  </Button>
                  <Button 
                    size="sm" 
                    variant={animationLevel === 'full' ? 'default' : 'outline'}
                    onClick={() => setAnimationLevel('full')}
                    className="w-full justify-start"
                  >
                    Full (High-end devices)
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Device Capabilities</h3>
            <div className="text-sm space-y-1">
              <p>Device: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</p>
              <p>Performance: {deviceInfo.devicePerformance}</p>
              <p>WebGL: {deviceInfo.supportsWebGL ? 'Supported' : 'Not supported'}</p>
              <p>Current animation level: {animationLevel}</p>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 flex flex-col">
          <div className="bg-secondary p-4 rounded-lg h-[300px] flex items-center justify-center mb-4">
            <div className="w-full h-full max-w-[500px] mx-auto relative">
              {/* Note: In a real app, you would use actual Rive animations */}
              {/* This is a placeholder showing the component structure */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
                <p className="text-center text-muted-foreground">
                  Placeholder for Rive animation<br />
                  (Actual implementation would use .riv files)
                </p>
              </div>
              
              {/* Commented out since we don't have actual .riv files
              <RiveAnimation
                src={currentAnimation.src}
                fallbackImageSrc={currentAnimation.fallbackImageSrc}
                stateMachine={currentAnimation.stateMachine}
                className="w-full h-full"
                autoplay={isPlaying}
                inputs={{
                  speed: speed,
                  isPlaying: isPlaying,
                }}
                benchmarkName={`Animation-${selectedExample}`}
              />
              */}
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded">
            <h3 className="font-medium mb-2">{selectedExample.charAt(0).toUpperCase() + selectedExample.slice(1)} Animation</h3>
            <p className="text-sm text-muted-foreground">{currentAnimation.description}</p>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-1">Performance Notes:</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                <li>Animations automatically scale quality based on device performance</li>
                <li>Static image fallbacks are used for extremely low-end devices</li>
                <li>Frame rate is monitored and optimized in real-time</li>
                <li>Touch input is optimized on mobile devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 