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
            
            {/* Character illustration at the bottom */}
            <div className="flex-grow flex items-end justify-center pb-8">
              <div className="relative">
                {/* Simple character illustration */}
                <div className="w-48 h-48 rounded-full bg-amber-200 absolute bottom-0 z-0"></div>
                <div className="relative z-10 flex flex-col items-center">
                  {/* Character */}
                  <div className="w-32 h-48 flex flex-col items-center justify-center">
                    {/* Head */}
                    <div className="w-16 h-16 bg-amber-800 rounded-full flex items-center justify-center">
                      {/* Face */}
                      <div className="flex space-x-4">
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                      </div>
                    </div>
                    {/* Body */}
                    <div className="w-20 h-24 bg-gray-100 mt-2"></div>
                    {/* Legs */}
                    <div className="flex space-x-2 mt-1">
                      <div className="w-6 h-12 bg-blue-500"></div>
                      <div className="w-6 h-12 bg-blue-500"></div>
                    </div>
                  </div>
                  
                  {/* Microphone stand */}
                  <div className="absolute left-[-20px] bottom-12 h-32 w-1 bg-gray-700"></div>
                  <div className="absolute left-[-24px] bottom-44 h-6 w-4 bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>
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
