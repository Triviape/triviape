"use client";

import React from 'react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { Card } from '@/app/components/ui/card';

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
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
      icon: '🗓️'
    },
    {
      id: 'team',
      name: 'Team Play',
      description: 'Collaborate with friends in team-based challenges',
      href: '/team',
      color: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      icon: '👥'
    },
    {
      id: 'challenge',
      name: 'Challenge',
      description: 'Face off against others in thrilling competitions',
      href: '/challenge',
      color: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700',
      icon: '🏆'
    }
  ];
  
  return (
    <Card className={cn(
      "p-4 bg-card",
      className
    )}>
      <div className="flex justify-center gap-4 w-full">
        {gameModes.map((mode) => (
          <Link 
            key={mode.id} 
            href={mode.href} 
            className="flex flex-col items-center"
          >
            <Button
              className={cn(
                "w-16 h-16 rounded-full text-white flex items-center justify-center shadow-md transition-all",
                mode.color
              )}
              title={mode.name}
            >
              <span className="text-2xl">{mode.icon}</span>
            </Button>
            <span className="mt-2 text-xs font-medium text-center">{mode.name}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
} 