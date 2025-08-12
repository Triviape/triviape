'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { useHasCompletedDailyQuiz } from '@/app/hooks/useDailyQuizStatus';
import { Skeleton } from '@/app/components/ui/skeleton';
import { FaFire, FaTrophy } from 'react-icons/fa';
import { useBenchmark } from '@/app/hooks/performance/useBenchmark';

interface DailyQuizCardProps {
  className?: string;
  onStart?: () => void;
  onComplete?: () => void;
  variant?: 'default' | 'compact' | 'featured';
  showStats?: boolean;
  ariaLabel?: string;
}

/**
 * Component displaying a card for the daily quiz with status information
 */
export function DailyQuizCard({ 
  className, 
  onStart, 
  onComplete, 
  variant = 'default',
  showStats = true,
  ariaLabel
}: DailyQuizCardProps) {
  const router = useRouter();
  const { data: quizStatus, isLoading } = useHasCompletedDailyQuiz();
  
  // Performance benchmarking
  const metrics = useBenchmark({
    name: 'DailyQuizCard',
    enabled: process.env.NODE_ENV === 'development',
    threshold: 32,
    onThresholdExceeded: (metrics) => {
      console.warn(`DailyQuizCard render time exceeded threshold: ${metrics.renderTimeMs}ms`);
    }
  });
  
  const handleStartQuiz = () => {
    onStart?.();
    router.push('/daily');
  };
  
  const isCompleted = quizStatus?.hasCompleted;
  const currentStreak = quizStatus?.currentStreak || 0;
  const bestStreak = quizStatus?.bestStreak || 0;
  
  // Determine card styling based on variant
  const getCardStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-3';
      case 'featured':
        return 'ring-2 ring-primary/20 shadow-lg';
      default:
        return '';
    }
  };
  
  return (
    <Card 
      className={cn('overflow-hidden', getCardStyles(), className)}
      aria-label={ariaLabel || 'Daily Challenge Card'}
    >
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h3 className="text-xl font-bold">Daily Challenge</h3>
        <p className="text-sm opacity-90">New questions every day!</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-6">
        {isLoading ? (
          <div className="space-y-4" data-testid="loading-skeleton">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            {showStats && (
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h4 className="font-medium text-lg">
                {isCompleted 
                  ? "Today's Challenge Completed!" 
                  : "Ready for Today's Challenge?"}
              </h4>
              <p className="text-gray-500 text-sm">
                {isCompleted 
                  ? "Great job! Come back tomorrow for more questions."
                  : "Play the daily quiz for bonus XP and special rewards!"}
              </p>
            </div>
            
            {showStats && (
              <div className="flex gap-6 mb-2" role="group" aria-label="Quiz Statistics">
                <div className="flex items-center gap-2">
                  <FaFire className="text-orange-500" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Streak</p>
                    <p className="font-bold" aria-live="polite">{currentStreak}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-gray-500">Best</p>
                    <p className="font-bold" aria-live="polite">{bestStreak}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-3">
        <Button 
          onClick={handleStartQuiz} 
          className="w-full"
          disabled={isLoading || isCompleted}
          aria-label={isCompleted ? 'Daily quiz completed' : 'Start daily quiz'}
          aria-describedby={isCompleted ? 'completed-message' : undefined}
        >
          {isCompleted ? 'Completed Today' : 'Start Daily Quiz'}
        </Button>
        {isCompleted && (
          <span id="completed-message" className="sr-only">
            You have already completed today's daily quiz
          </span>
        )}
      </CardFooter>
    </Card>
  );
} 