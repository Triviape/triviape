"use client";

import React from 'react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

interface GameModesProps {
  className?: string;
}

export function GameModes({ className }: GameModesProps) {
  const gameModes = [
    {
      id: 'daily',
      name: 'Daily Quiz',
      description: 'Test your knowledge with a new quiz every day',
      href: '/daily',
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
    },
    {
      id: 'team',
      name: 'Team Play',
      description: 'Collaborate with friends in team-based challenges',
      href: '/team',
      color: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
    },
    {
      id: 'challenge',
      name: 'Challenge',
      description: 'Face off against others in thrilling competitions',
      href: '/challenge',
      color: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
    }
  ];
  
  return (
    <div className={cn(
      "flex flex-col gap-4",
      className
    )}>
      <h2 className="text-2xl font-bold">Game Modes</h2>
      <div className="flex flex-col gap-3 w-full">
        {gameModes.map((mode) => (
          <Link 
            key={mode.id} 
            href={mode.href} 
            className="w-full"
          >
            <Button
              className={cn(
                "w-full text-white justify-start h-16 px-4 rounded-lg shadow-md transition-all",
                mode.color
              )}
            >
              <div className="flex flex-col items-start">
                <span className="font-bold text-lg">{mode.name}</span>
                <span className="text-xs opacity-90">{mode.description}</span>
              </div>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
} 