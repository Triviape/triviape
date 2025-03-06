'use client';

import React from 'react';
import Link from 'next/link';
import { useDailyQuiz } from '@/app/hooks/useQuizzes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';

interface DailyQuizCardProps {
  onStartClick?: () => void;
}

export function DailyQuizCard({ onStartClick }: DailyQuizCardProps) {
  const { data: dailyQuiz, isLoading, error } = useDailyQuiz();
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  if (error || !dailyQuiz) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Daily Quiz</CardTitle>
          <CardDescription>
            {error ? 'Error loading daily quiz' : 'No daily quiz available'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-2">
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  const handleStartClick = () => {
    if (onStartClick) {
      onStartClick();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{dailyQuiz.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{dailyQuiz.description}</CardDescription>
          </div>
          <Badge variant="outline">{dailyQuiz.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">{dailyQuiz.questionIds?.length || 0}</span> questions
          </div>
          {dailyQuiz.estimatedDuration && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{dailyQuiz.estimatedDuration}</span> min
            </div>
          )}
          {dailyQuiz.baseXP && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{dailyQuiz.baseXP}</span> XP
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {onStartClick ? (
          <Button className="w-full" onClick={handleStartClick}>Start Quiz</Button>
        ) : (
          <Link href={`/quiz/${dailyQuiz.id}`} className="w-full">
            <Button className="w-full">Start Quiz</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
} 