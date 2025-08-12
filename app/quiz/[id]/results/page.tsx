'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle, XCircle, Award, Coins, Zap, Clock, TrendingUp } from 'lucide-react';

interface QuizResultsPageProps {
  params: { id: string };
}

export default function QuizResultsPage({ params }: QuizResultsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get results from URL parameters
  const score = searchParams.get('score');
  const totalQuestions = searchParams.get('totalQuestions');
  const correctAnswers = searchParams.get('correctAnswers');
  const xpEarned = searchParams.get('xpEarned');
  const coinsEarned = searchParams.get('coinsEarned');
  const error = searchParams.get('error');

  // Loading state for animations
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Add a small delay for better UX
    const timer = setTimeout(() => setShowResults(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Submission Failed</CardTitle>
            <CardDescription>
              There was an error submitting your quiz results. Your answers may not have been saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => router.push(`/quiz/${params.id}`)} variant="outline">
              Return to Quiz
            </Button>
            <Button onClick={() => router.push('/quiz')} className="w-full">
              Browse Other Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Missing results state
  if (!score || !totalQuestions || !correctAnswers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>No Results Found</CardTitle>
            <CardDescription>
              We couldn't find your quiz results. Please try taking the quiz again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => router.push(`/quiz/${params.id}`)} variant="outline">
              Retake Quiz
            </Button>
            <Button onClick={() => router.push('/quiz')} className="w-full">
              Browse Other Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse results
  const scoreNum = parseInt(score);
  const totalQuestionsNum = parseInt(totalQuestions);
  const correctAnswersNum = parseInt(correctAnswers);
  const xpEarnedNum = parseInt(xpEarned || '0');
  const coinsEarnedNum = parseInt(coinsEarned || '0');
  const percentage = Math.round((scoreNum / 100) * 100); // score is already a percentage

  // Determine performance level
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'bg-green-500', icon: Award };
    if (percentage >= 75) return { level: 'Good', color: 'bg-blue-500', icon: TrendingUp };
    if (percentage >= 60) return { level: 'Average', color: 'bg-yellow-500', icon: Clock };
    return { level: 'Needs Improvement', color: 'bg-red-500', icon: XCircle };
  };

  const performance = getPerformanceLevel(percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
          <p className="text-gray-600">Here are your results</p>
        </div>

        {/* Main Results Card */}
        <Card className={`transition-all duration-500 ${showResults ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className={`rounded-full p-4 ${performance.color} text-white`}>
                <PerformanceIcon className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {scoreNum}% Score
            </CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="text-sm">
                {performance.level}
              </Badge>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{correctAnswersNum}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{totalQuestionsNum - correctAnswersNum}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
            </div>

            {/* Rewards */}
            {(xpEarnedNum > 0 || coinsEarnedNum > 0) && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-center">Rewards Earned</h3>
                <div className="grid grid-cols-2 gap-4">
                  {xpEarnedNum > 0 && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{xpEarnedNum}</div>
                      <div className="text-sm text-gray-600">XP</div>
                    </div>
                  )}
                  {coinsEarnedNum > 0 && (
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Coins className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-600">{coinsEarnedNum}</div>
                      <div className="text-sm text-gray-600">Coins</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button 
                onClick={() => router.push(`/quiz/${params.id}`)} 
                variant="outline" 
                className="flex-1"
              >
                View Quiz Details
              </Button>
              <Button 
                onClick={() => router.push('/quiz')} 
                className="flex-1"
              >
                Take Another Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <div className="flex justify-center">
          <Button 
            onClick={() => router.push('/')} 
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}