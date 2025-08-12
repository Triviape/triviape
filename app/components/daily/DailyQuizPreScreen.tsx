'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Badge } from '@/app/components/ui/badge';
import { Award, Coins, Clock, HelpCircle, Trophy, ArrowLeft, Play } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useDailyQuiz } from '@/app/hooks/useQuizzes';
import { useHasCompletedDailyQuiz } from '@/app/hooks/useDailyQuizStatus';

interface DailyQuizPreScreenProps {
  className?: string;
  onStartQuiz: () => void;
  onBack: () => void;
}

/**
 * Pre-quiz screen displayed before starting the daily quiz,
 * showing information about the quiz and user's streak
 */
export function DailyQuizPreScreen({ className, onStartQuiz, onBack }: DailyQuizPreScreenProps) {
  const { data: dailyQuiz, isLoading: isQuizLoading } = useDailyQuiz();
  const { data: quizStatus, isLoading: isStatusLoading } = useHasCompletedDailyQuiz();
  
  const isLoading = isQuizLoading || isStatusLoading;
  
  // Default values for XP and coins if not available in the quiz data
  const potentialXP = dailyQuiz?.baseXP || 100;
  const potentialCoins = dailyQuiz?.baseCoins || 50;
  
  if (isLoading) {
    return (
      <div className={cn('max-w-4xl ml-0', className)}>
        <Card className="overflow-hidden border border-gray-200">
          <CardHeader className="bg-white text-black py-6">
            <Skeleton className="h-8 w-3/4 bg-gray-200 mb-2" />
            <Skeleton className="h-4 w-full bg-gray-200" />
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full bg-gray-200" />
              <div className="flex gap-3 justify-start mt-6">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
                <Skeleton className="h-12 w-12 rounded-full bg-gray-200" />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="bg-white p-4 gap-3 justify-between">
            <Skeleton className="h-10 w-1/4 bg-gray-200" />
            <Skeleton className="h-10 w-1/4 bg-gray-200" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!dailyQuiz) {
    return (
      <div className={cn('max-w-4xl ml-0', className)}>
        <Card className="overflow-hidden border border-gray-200">
          <CardHeader className="bg-white text-black py-6">
            <h2 className="text-3xl font-bold">The Daily Ape</h2>
            <p className="text-sm text-gray-500">No challenge available today</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              There is no daily challenge available right now. Please check back later.
            </p>
          </CardContent>
          
          <CardFooter className="bg-white p-4 flex justify-between">
            <Button 
              onClick={onBack} 
              variant="outline" 
              className="rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={cn('max-w-4xl ml-0', className)}>
      <Card className="overflow-hidden border border-gray-200">
        <CardHeader className="bg-white text-black pt-6 pb-4 px-8">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-bold text-gray-900">The Daily Ape #1</h2>
            <span className="text-gray-500 font-medium">
              {dailyQuiz?.estimatedDuration || 60} seconds, {dailyQuiz?.questionIds?.length || 10} questions
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 py-6">
          {/* Main quiz question preview */}
          <p className="text-xl font-medium text-gray-800 mb-16">
            {dailyQuiz?.description || 
             "In Greek mythology, why was Sisyphus condemned to eternal punishment? (Attempting to cheat death)"}
          </p>
          
          {/* Difficulty circles - now smaller and left aligned */}
          <div className="flex justify-start gap-8 mt-12 mb-8 pl-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center shadow-md">
                <span className="text-white font-medium">600+</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center shadow-md">
                <span className="text-gray-700 font-medium">720+</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                <span className="text-amber-900 font-medium">850+</span>
              </div>
            </div>
          </div>
          
          {/* Streak indicator - moved to align with circles */}
          <div className="flex justify-start mt-10 pl-6">
            <div className="bg-gray-50 p-3 rounded-lg text-center shadow-sm border border-gray-100">
              <div className="flex justify-center mb-1">
                <Trophy className="text-purple-500 h-5 w-5" />
              </div>
              <p className="text-sm text-gray-500">Your Streak</p>
              <p className="font-bold text-gray-700">
                {quizStatus?.currentStreak || 0}
              </p>
            </div>
          </div>
          
          {quizStatus?.hasCompleted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-amber-700 font-medium text-center">
                You've already completed today's challenge!
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-white p-6 justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-full px-5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Button 
            onClick={onStartQuiz} 
            className="rounded-full bg-green-600 hover:bg-green-700 px-5"
            disabled={isLoading || quizStatus?.hasCompleted}
          >
            {quizStatus?.hasCompleted ? 'Already Completed' : 
             <><Play className="mr-2 h-4 w-4" /> Start Challenge</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 