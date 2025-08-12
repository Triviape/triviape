'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { useHasCompletedDailyQuiz } from '@/app/hooks/useDailyQuizStatus';
import { Skeleton } from '@/app/components/ui/skeleton';
import { FaClock, FaFire, FaTrophy } from 'react-icons/fa';

interface DailyQuizCardProps {
  className?: string;
}

/**
 * Component displaying a card for the daily quiz with status information
 */
export function DailyQuizCard({ className }: DailyQuizCardProps) {
  const router = useRouter();
  const { data: quizStatus, isLoading } = useHasCompletedDailyQuiz();
  
  const handleStartQuiz = () => {
    router.push('/daily');
  };
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <h3 className="text-xl font-bold">Daily Challenge</h3>
        <p className="text-sm opacity-90">New questions every day!</p>
      </CardHeader>
      
      <CardContent className="p-4 pt-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h4 className="font-medium text-lg">
                {quizStatus?.hasCompleted 
                  ? "Today's Challenge Completed!" 
                  : "Ready for Today's Challenge?"}
              </h4>
              <p className="text-gray-500 text-sm">
                {quizStatus?.hasCompleted 
                  ? "Great job! Come back tomorrow for more questions."
                  : "Play the daily quiz for bonus XP and special rewards!"}
              </p>
            </div>
            
            <div className="flex gap-6 mb-2">
              <div className="flex items-center gap-2">
                <FaFire className="text-orange-500" />
                <div>
                  <p className="text-sm text-gray-500">Streak</p>
                  <p className="font-bold">{quizStatus?.currentStreak || 0}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">Best</p>
                  <p className="font-bold">{quizStatus?.bestStreak || 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-3">
        <Button 
          onClick={handleStartQuiz} 
          className="w-full"
          disabled={isLoading || quizStatus?.hasCompleted}
        >
          {quizStatus?.hasCompleted ? 'Completed Today' : 'Start Daily Quiz'}
        </Button>
      </CardFooter>
    </Card>
  );
} 