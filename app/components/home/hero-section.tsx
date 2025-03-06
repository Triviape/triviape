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
      "flex flex-col items-start text-left w-full gap-6 pr-4 pt-8",
      className
    )}>
      {/* Empty box at the top (like in the image) */}
      <div className="w-full border border-blue-400 h-20 mb-4"></div>
      
      {/* Newspaper title */}
      <div className="w-full">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif tracking-wide leading-none text-center" 
            style={{ 
              fontWeight: 300,
              fontStyle: 'italic',
              letterSpacing: '-0.02em',
              color: 'transparent',
              WebkitTextStroke: '1px #333',
              textShadow: 'none'
            }}>
          Triviape
        </h1>
        <div className="text-xs text-right mt-1 pr-2">2023 Kahuna Gaming</div>
      </div>
      
      {/* Location, date and volume info */}
      <div className="w-full flex justify-between items-center mt-2 text-sm">
        <div className="text-gray-700">{locationDate}</div>
        <div className="text-gray-700">{volumeInfo}</div>
      </div>
      
      {/* Optional: Add some decorative line or element */}
      <div className="w-full border-t border-gray-300 mt-2"></div>
    </div>
  );
} 