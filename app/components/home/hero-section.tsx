import React from 'react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div className={cn(
      "flex flex-col items-start text-left w-full gap-8 pr-4",
      className
    )}>
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
          Welcome to <span className="text-primary">Triviape</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-[600px]">
          Test your knowledge with fun trivia games. Play daily quizzes, team challenges, 
          or face off against friends in thrilling competitions.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <Button size="lg">Start Playing</Button>
          <Button size="lg" variant="outline">Explore Games</Button>
        </div>
      </div>
      
      <div className="relative w-full h-48 sm:h-60 md:h-80 rounded-lg overflow-hidden shadow-lg mt-4">
        {/* This is a placeholder for a hero image - replace with your own image */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-20 z-10"></div>
        <div className="absolute inset-0 flex items-center justify-center z-20 text-white text-2xl font-bold p-4 text-center">
          The Ultimate Trivia Experience
        </div>
      </div>
    </div>
  );
} 