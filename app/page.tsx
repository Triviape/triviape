import React from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { HeroSection } from '@/app/components/home/hero-section';
import { GameModes } from '@/app/components/home/game-modes';
import { DailyQuizCard } from '@/app/components/daily/daily-quiz-card';
import { ShadcnSidebar } from '@/app/components/navigation/shadcn-sidebar';

export default function Home() {
  return (
    <AppLayout
      header={<Navbar />}
      sidebar={<ShadcnSidebar />}
      className="bg-background"
      useShadcnSidebar={true}
      maxWidth="xl"
    >
      <div className="w-full py-6 relative">
        {/* Main content layout with hero on left and content on right */}
        <div className="flex flex-col md:flex-row w-full gap-8 min-h-[calc(100vh-12rem)]">
          {/* Hero Section - Left side, newspaper style */}
          <div className="w-full md:w-3/5 lg:w-3/5 flex flex-col">
            <HeroSection className="mb-8" />
          </div>
          
          {/* Right side content - Organized in a flex column */}
          <div className="w-full md:w-2/5 lg:w-2/5 flex flex-col">
            {/* Top section with Daily Quiz Card */}
            <div className="w-full mb-8">
              <h2 className="text-2xl font-bold mb-4">Today's Quiz</h2>
              <DailyQuizCard />
            </div>
            
            {/* Bottom section with Game Modes */}
            <div className="w-full mt-auto">
              <GameModes className="bg-transparent shadow-none border-none" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
