'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { HeroSection } from '@/app/components/home/hero-section';
import { ShadcnSidebar } from '@/app/components/navigation/shadcn-sidebar';
import { PreQuizScreen } from '@/app/components/daily/pre-quiz-screen';
import { StageArea } from '@/app/components/home/stage-area';

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
          // Normal layout with hero on left and stage on right
          <div className="flex flex-col md:flex-row w-full gap-8 min-h-[calc(100vh-12rem)]">
            {/* Left side - Hero Section */}
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <HeroSection className="h-full" />
            </div>
            
            {/* Right side - Stage Area with Game Mode Buttons */}
            <div className="w-full md:w-1/2 flex flex-col">
              <StageArea 
                className="h-full" 
                isQuizMode={showPreQuiz}
                onDailyClick={handleStartDailyQuiz}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
