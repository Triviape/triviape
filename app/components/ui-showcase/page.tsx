"use client";

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { ResponsiveContainer } from '@/app/components/layouts/responsive-container';
import { useResponsiveUI } from '@/app/contexts/responsive-ui-context';
import { AnimationPlayground } from './animation-playground';

export default function UIShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <ResponsiveContainer maxWidth="xl" padding="lg" centerContent>
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8 text-center">Responsive UI Components</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Device Information</h2>
            <DeviceInfoDisplay />
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
            <ButtonShowcase />
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Animation System</h2>
            <AnimationPlayground />
          </section>
        </div>
      </ResponsiveContainer>
    </div>
  );
}

function DeviceInfoDisplay() {
  const { deviceInfo, uiScale, animationLevel, setAnimationLevel, setUIScale } = useResponsiveUI();
  
  return (
    <div className="bg-card p-6 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-lg mb-2">Device Properties</h3>
          <ul className="space-y-2">
            <li>Device Type: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</li>
            <li>Browser: {deviceInfo.browserName}</li>
            <li>Screen Size: {deviceInfo.screenSize}</li>
            <li>Touch Support: {deviceInfo.supportsTouch ? 'Yes' : 'No'}</li>
            <li>WebGL Support: {deviceInfo.supportsWebGL ? 'Yes' : 'No'}</li>
            <li>Performance Level: {deviceInfo.devicePerformance}</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-2">UI Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">UI Scale</label>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant={uiScale === 'compact' ? 'default' : 'outline'}
                  onClick={() => setUIScale('compact')}
                >
                  Compact
                </Button>
                <Button 
                  size="sm" 
                  variant={uiScale === 'regular' ? 'default' : 'outline'}
                  onClick={() => setUIScale('regular')}
                >
                  Regular
                </Button>
                <Button 
                  size="sm" 
                  variant={uiScale === 'large' ? 'default' : 'outline'}
                  onClick={() => setUIScale('large')}
                >
                  Large
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block mb-2">Animation Level</label>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant={animationLevel === 'minimal' ? 'default' : 'outline'}
                  onClick={() => setAnimationLevel('minimal')}
                >
                  Minimal
                </Button>
                <Button 
                  size="sm" 
                  variant={animationLevel === 'reduced' ? 'default' : 'outline'}
                  onClick={() => setAnimationLevel('reduced')}
                >
                  Reduced
                </Button>
                <Button 
                  size="sm" 
                  variant={animationLevel === 'full' ? 'default' : 'outline'}
                  onClick={() => setAnimationLevel('full')}
                >
                  Full
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonShowcase() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-medium">Button Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button>Default Button</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Button Sizes</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🔍</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Button States</h3>
        <div className="flex flex-wrap gap-4">
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leftIcon="👈">Left Icon</Button>
          <Button rightIcon="👉">Right Icon</Button>
        </div>
      </div>
    </div>
  );
} 