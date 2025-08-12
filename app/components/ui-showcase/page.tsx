"use client";

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { ResponsiveContainer } from '@/app/components/layouts/responsive-container';
import { useResponsiveUI } from '@/app/contexts/responsive-ui-context';
import { AnimationPlayground } from './animation-playground';
// Added extended primitive imports for showcase
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { Label } from '@/app/components/ui/label';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Spinner } from '@/app/components/ui/spinner';
import { toast } from '@/app/components/ui/use-toast';
import { Toaster } from '@/app/components/ui/toaster';

// Basic tailwind token references (adjust once design tokens formalized)
const colorTokens = [
  'bg-background','bg-foreground','bg-primary','bg-secondary','bg-accent','bg-muted','bg-destructive'
];

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

          {/* Avatar Showcase */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Avatars</h2>
            <div className="flex items-center gap-6">
              <Avatar>
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Avatar className="h-14 w-14">
                <AvatarFallback>LG</AvatarFallback>
              </Avatar>
            </div>
          </section>

          {/* Form Elements */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="demo-email">Email</Label>
              <input
                id="demo-email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">Helper: We'll never share your email.</p>
            </div>
          </section>

          {/* Spinner */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Spinners</h2>
              <div className="flex gap-6 items-center">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </div>
            </section>

          {/* Toasts */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Toasts</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button onClick={() => toast({ title: 'Default Toast', description: 'This is a sample message.' })}>Show Toast</Button>
              <Button variant="destructive" onClick={() => toast({ title: 'Error', description: 'Something went wrong.' })}>Error Toast</Button>
              <Button variant="outline" onClick={() => { const t = toast({ title: 'Updating', description: 'Will change in 2s...' }); setTimeout(()=> t.update({ id: t.id, description: 'Updated!', title: 'Done' }), 2000); }}>Updatable Toast</Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Demonstrates default, error, and programmatic update flows.</p>
            <Toaster />
          </section>

          {/* Scroll Area */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Scroll Area</h2>
            <ScrollArea className="h-44 w-full rounded-md border p-4">
              <ul className="space-y-2 text-sm">
                {Array.from({ length: 30 }).map((_, i) => (
                  <li key={i} className="rounded bg-muted/40 px-3 py-2">Item {i + 1}</li>
                ))}
              </ul>
            </ScrollArea>
          </section>

          {/* Color Tokens */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Color Tokens</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {colorTokens.map(tok => (
                <div key={tok} className="flex flex-col rounded border p-3 text-xs gap-2">
                  <div className={`h-14 w-full rounded ${tok} border`} />
                  <code className="text-muted-foreground">{tok}</code>
                </div>
              ))}
            </div>
          </section>

          {/* Focus Accessibility Demo */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Focus States</h2>
            <div className="flex gap-4 flex-wrap mb-2">
              <Button>Focus Me</Button>
              <button className="rounded-md border border-input px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Plain Button</button>
              <a href="#" className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-1">Focusable Link</a>
            </div>
            <p className="text-sm text-muted-foreground">Use Tab to verify visible focus outlines. Ensures accessibility compliance.</p>
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