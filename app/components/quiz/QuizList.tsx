import React from 'react';
import { DifficultyLevel } from '@/app/types/quiz';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

interface QuizListProps {
  categoryId?: string;
  difficulty?: DifficultyLevel;
  limit?: number;
}

const QuizList: React.FC<QuizListProps> = ({ 
  categoryId, 
  difficulty,
  limit = 10
}) => {
  return (
    <div className="w-full py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz List</CardTitle>
          <CardDescription>
            Quiz lists have been replaced with the Daily Quiz feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We've simplified our quiz experience to focus on the Daily Quiz feature. 
            Each day, a new quiz will be selected for you to enjoy.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/daily" className="w-full">
            <Button className="w-full">Go to Daily Quiz</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizList; 