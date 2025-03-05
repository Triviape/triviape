import React from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { HeroSection } from '@/app/components/home/hero-section';
import { GameModes } from '@/app/components/home/game-modes';

export default function Home() {
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        {/* Hero Section - Takes up 2/3 of the space on desktop */}
        <div className="md:col-span-2">
          <HeroSection />
        </div>
        
        {/* Game Modes - Takes up 1/3 of the space on desktop */}
        <div className="md:col-span-1">
          <GameModes />
        </div>
      </div>
    </AppLayout>
  );
}
