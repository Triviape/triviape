import React from 'react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div className={cn(
      "flex flex-col items-start gap-6",
      className
    )}>
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
        Welcome to Triviape
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-[600px]">
        Test your knowledge with fun trivia games. Play daily quizzes, team challenges, 
        or face off against friends in thrilling competitions.
      </p>
      
      <div className="relative w-full h-40 sm:h-60 md:h-80 rounded-lg overflow-hidden">
        {/* This is a placeholder for a hero image - replace with your own image */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-20 z-10"></div>
        <div className="absolute inset-0 flex items-center justify-center z-20 text-white text-2xl font-bold">
          The Ultimate Trivia Experience
        </div>
      </div>
    </div>
  );
} 