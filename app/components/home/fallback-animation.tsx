"use client";

import React from 'react';
import { cn } from '@/app/lib/utils';
import { Card } from '@/app/components/ui/card';
import { Trophy } from 'lucide-react';

interface FallbackAnimationProps {
  className?: string;
}

export function FallbackAnimation({ className }: FallbackAnimationProps) {
  return (
    <Card className={cn("relative w-full overflow-hidden rounded-lg shadow-md", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-[200px] p-4">
        <div className="animate-bounce mb-2">
          <Trophy size={48} className="text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-center">Trivia Champion</h3>
        <p className="text-sm text-center text-muted-foreground mt-2">
          Test your knowledge and become a trivia master!
        </p>
      </div>
    </Card>
  );
} 