'use client';

import React from 'react';
import Link from 'next/link';
import { useDailyQuiz } from '@/app/hooks/useQuizzes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Skeleton } from '@/app/components/ui/skeleton';

export function DailyQuizCard() {
  const { data: dailyQuiz, isLoading, error } = useDailyQuiz();
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  if (error || !dailyQuiz) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Daily Quiz</CardTitle>
          <CardDescription>
            {error ? 'Error loading daily quiz' : 'No daily quiz available'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{dailyQuiz.title}</CardTitle>
            <CardDescription className="mt-2">{dailyQuiz.description}</CardDescription>
          </div>
          <Badge variant="outline">{dailyQuiz.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium">{dailyQuiz.questionIds?.length || 0}</span> questions
            </div>
            {dailyQuiz.estimatedDuration && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{dailyQuiz.estimatedDuration}</span> minutes
              </div>
            )}
            {dailyQuiz.baseXP && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{dailyQuiz.baseXP}</span> XP
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/quiz/${dailyQuiz.id}`} className="w-full">
          <Button className="w-full">Start Quiz</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 