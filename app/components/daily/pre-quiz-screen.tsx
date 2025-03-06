'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { useDailyQuiz } from '@/app/hooks/useQuizzes';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';
import Link from 'next/link';
import { Award, Coins, Clock, HelpCircle } from 'lucide-react';

interface PreQuizScreenProps {
  className?: string;
  onBack?: () => void;
}

export function PreQuizScreen({ className, onBack }: PreQuizScreenProps) {
  const { data: dailyQuiz, isLoading, error } = useDailyQuiz();
  
  // Default values for XP and coins if not available in the quiz data
  const potentialXP = dailyQuiz?.baseXP || 100;
  const potentialCoins = dailyQuiz?.baseCoins || 50;
  
  if (isLoading) {
    return (
      <div className={cn(
        "flex flex-col items-start justify-center w-full h-full p-6 bg-card rounded-lg border",
        className
      )}>
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-6" />
        
        <div className="flex gap-4 mb-6 w-full">
          <Skeleton className="h-24 w-1/2" />
          <Skeleton className="h-24 w-1/2" />
        </div>
        
        <div className="flex gap-4 w-full mt-auto">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      </div>
    );
  }
  
  if (error || !dailyQuiz) {
    return (
      <div className={cn(
        "flex flex-col items-start justify-center w-full h-full p-6 bg-card rounded-lg border",
        className
      )}>
        <h2 className="text-2xl font-bold mb-2">Daily Quiz</h2>
        <p className="text-muted-foreground mb-6">
          {error ? 'Error loading daily quiz' : 'No daily quiz available today'}
        </p>
        
        <Button onClick={onBack} className="mt-auto">
          Back to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex flex-col items-start justify-center w-full h-full p-8 bg-card rounded-lg",
      className
    )}>
      {/* Header with title and difficulty */}
      <div className="w-full mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold">{dailyQuiz.title}</h2>
          <Badge variant="outline" className="text-base px-3 py-1">{dailyQuiz.difficulty}</Badge>
        </div>
        <p className="text-muted-foreground text-lg mt-2">{dailyQuiz.description}</p>
      </div>
      
      {/* Rewards section */}
      <div className="grid grid-cols-2 gap-6 w-full my-8">
        <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-lg">
          <Award className="w-10 h-10 text-primary mb-3" />
          <span className="text-5xl font-bold text-primary">{potentialXP}</span>
          <span className="text-sm text-muted-foreground mt-2">Potential XP</span>
        </div>
        <div className="flex flex-col items-center justify-center p-6 bg-amber-500/5 rounded-lg">
          <Coins className="w-10 h-10 text-amber-500 mb-3" />
          <span className="text-5xl font-bold text-amber-500">{potentialCoins}</span>
          <span className="text-sm text-muted-foreground mt-2">Potential Coins</span>
        </div>
      </div>
      
      {/* Quiz details */}
      <div className="flex flex-wrap gap-8 mb-10 text-base text-muted-foreground">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">{dailyQuiz.questionIds?.length || 0}</span> questions
        </div>
        {dailyQuiz.estimatedDuration && (
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-medium">{dailyQuiz.estimatedDuration}</span> min
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-6 w-full mt-auto">
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="w-1/2 py-6 text-lg"
        >
          Back
        </Button>
        <Link href={`/quiz/${dailyQuiz.id}`} className="w-1/2">
          <Button className="w-full py-6 text-lg">Start Quiz</Button>
        </Link>
      </div>
    </div>
  );
} 