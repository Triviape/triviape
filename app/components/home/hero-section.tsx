import React from 'react';
import { cn } from '@/app/lib/utils';
import { format } from 'date-fns';

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  // Get current date
  const today = new Date();
  const formattedDate = format(today, "MMMM d, yyyy");
  const dayOfWeek = format(today, "EEEE");
  
  // Format location and date like a newspaper
  const locationDate = `San Francisco, ${dayOfWeek}, ${formattedDate}`;
  
  // Volume and issue information
  const volumeInfo = "VOL. I... No. 1";
  
  return (
    <div className={cn(
      "flex flex-col items-start justify-center text-left w-full h-full",
      className
    )}>
      {/* Main newspaper title - much larger and centered vertically */}
      <div className="w-full flex flex-col justify-center items-start my-auto">
        <h1 
          className="text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[15rem] font-serif tracking-wide leading-none text-left" 
          style={{ 
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '-0.05em',
            color: 'transparent',
            WebkitTextStroke: '2px #333',
            textShadow: 'none',
            lineHeight: '0.9'
          }}
        >
          Triviape
        </h1>
        
        {/* Company info moved to bottom of the section */}
        <div className="text-xs text-right self-end mt-2 pr-2">2023 Kahuna Gaming</div>
      </div>
      
      {/* Location, date and volume info on same y-axis */}
      <div className="w-full flex justify-between items-center mt-8 text-base">
        <div className="text-gray-700">{locationDate}</div>
        <div className="text-gray-700">{volumeInfo}</div>
      </div>
      
      {/* Decorative line */}
      <div className="w-full border-t border-gray-300 mt-4"></div>
    </div>
  );
} 