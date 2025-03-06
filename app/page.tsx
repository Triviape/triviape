'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { HeroSection } from '@/app/components/home/hero-section';
import { GameModes } from '@/app/components/home/game-modes';
import { ShadcnSidebar } from '@/app/components/navigation/shadcn-sidebar';
import { FallbackAnimation } from '@/app/components/home/fallback-animation';
import { PreQuizScreen } from '@/app/components/daily/pre-quiz-screen';

export default function Home() {
  const [showPreQuiz, setShowPreQuiz] = useState(false);
  
  const handleStartDailyQuiz = () => {
    setShowPreQuiz(true);
  };
  
  const handleBackToHome = () => {
    setShowPreQuiz(false);
  };
  
  return (
    <AppLayout
      header={<Navbar />}
      sidebar={<ShadcnSidebar />}
      className="bg-background"
      useShadcnSidebar={true}
      maxWidth="xl"
    >
      <div className="w-full py-6 relative">
        {showPreQuiz ? (
          // When showing pre-quiz screen, it takes the full width
          <div className="w-full max-w-3xl mx-auto">
            <PreQuizScreen className="h-full" onBack={handleBackToHome} />
          </div>
        ) : (
          // Normal layout with hero on left and content on right
          <div className="flex flex-col md:flex-row w-full gap-8 min-h-[calc(100vh-12rem)]">
            {/* Left side - Hero Section */}
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <HeroSection className="h-full" />
            </div>
            
            {/* Right side content - Organized in a flex column */}
            <div className="w-full md:w-1/2 flex flex-col">
              {/* Game Modes section */}
              <div className="w-full mb-6">
                <GameModes 
                  className="bg-transparent shadow-none border-none" 
                  onDailyQuizClick={handleStartDailyQuiz}
                />
              </div>
              
              {/* Animation at the bottom right */}
              <div className="w-full mt-auto">
                <FallbackAnimation className="w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
