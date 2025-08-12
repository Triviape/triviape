'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { FaCheck, FaCoins, FaTrophy, FaStar, FaFireAlt } from 'react-icons/fa';
import { updateDailyQuizCompletion } from '@/app/hooks/useDailyQuizStatus';
import { queryClient } from '@/app/lib/reactQuery';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { Spinner } from '@/app/components/ui/spinner';
import { RiErrorWarningFill } from 'react-icons/ri';
import { safeAsync } from '@/app/lib/errorHandling';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from '@/app/components/ui/use-toast';
import confetti from 'canvas-confetti';

interface DailyQuizResultsProps {
  // Accept either a results object or individual properties
  results?: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  };
  // Individual properties (used in tests)
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  xpEarned?: number;
  coinsEarned?: number;
  // Common properties
  onBack: () => void;
  quizId?: string;
}

/**
 * Component to display the results of a completed daily quiz
 */
export function DailyQuizResults({
  results,
  score: scoreProp,
  totalQuestions: totalQuestionsProp,
  correctAnswers: correctAnswersProp,
  xpEarned: xpEarnedProp,
  coinsEarned: coinsEarnedProp,
  onBack,
  quizId = 'daily-quiz'
}: DailyQuizResultsProps) {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Use either the results object or the individual props
  const score = results?.score ?? scoreProp ?? 0;
  const totalQuestions = results?.totalQuestions ?? totalQuestionsProp ?? 0;
  const correctAnswers = results?.correctAnswers ?? correctAnswersProp ?? 0;
  const xpEarned = results?.xpEarned ?? xpEarnedProp ?? 0;
  const coinsEarned = results?.coinsEarned ?? coinsEarnedProp ?? 0;
  
  // Trigger confetti effect on load for high scores
  React.useEffect(() => {
    if (score >= 80) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;
      
      const runConfetti = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42']
        });
        
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42']
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(runConfetti);
        }
      };
      
      runConfetti();
    }
  }, [score]);
  
  const handleSubmitResults = async () => {
    if (isSubmitting || isSubmitted || !currentUser) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    const [success, error] = await safeAsync(async () => {
      // Note: Quiz results are now submitted automatically via the standardized completion flow
      // This function now just handles additional daily quiz specific tasks
      
      // Record the completion in our database for daily quiz specific tracking
      await updateDailyQuizCompletion(quizId, score);
      
      // Invalidate related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['dailyQuizStatus'] });
      await queryClient.invalidateQueries({ queryKey: ['userStats'] });
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      toast({
        title: "Quiz completed!",
        description: `You earned ${xpEarned} XP and ${coinsEarned} coins.`,
        variant: "default",
      });
      
      return true;
    }, { 
      showToast: false,
      onError: (err) => {
        console.error('Failed to submit quiz results:', err);
        setSubmitError(err.message);
        
        toast({
          title: "Error submitting results",
          description: "There was a problem submitting your quiz results. Please try again.",
          variant: "destructive",
        });
      }
    });
    
    if (success) {
      setIsSubmitted(true);
    }
    
    setIsSubmitting(false);
  };
  
  // Calculate performance level based on score
  const getPerformanceLevel = () => {
    if (score >= 90) return { text: 'Outstanding!', color: 'text-green-500' };
    if (score >= 75) return { text: 'Great job!', color: 'text-blue-500' };
    if (score >= 60) return { text: 'Good effort!', color: 'text-yellow-500' };
    if (score >= 40) return { text: 'Nice try!', color: 'text-orange-500' };
    return { text: 'Keep practicing!', color: 'text-red-500' };
  };
  
  const performance = getPerformanceLevel();
  
  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <h2 className="text-2xl font-bold">Quiz Results</h2>
        <p className="text-lg font-medium">
          Daily Challenge Complete!
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-gray-100 p-5">
            <div className={`text-4xl font-bold ${performance.color}`}>
              {score}%
            </div>
          </div>
        </div>
        
        <h3 className={`text-xl font-bold text-center mb-6 ${performance.color}`}>
          {performance.text}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FaCheck className="text-green-500" />
              <span className="text-gray-500">Correct</span>
            </div>
            <div className="text-xl font-bold">{correctAnswers} / {totalQuestions}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FaFireAlt className="text-orange-500" />
              <span className="text-gray-500">Streak</span>
            </div>
            <div className="text-xl font-bold">+1</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FaStar className="text-blue-500" />
              <span className="text-gray-500">XP Earned</span>
            </div>
            <div className="text-xl font-bold">+{xpEarned}</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FaCoins className="text-yellow-500" />
              <span className="text-gray-500">Coins Earned</span>
            </div>
            <div className="text-xl font-bold">+{coinsEarned}</div>
          </div>
        </div>
        
        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <RiErrorWarningFill className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        
        {isSubmitted && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <FaCheck className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your results have been saved successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4 gap-3">
        {!isSubmitted && (
          <Button 
            onClick={handleSubmitResults} 
            className="flex-1"
            disabled={isSubmitting || !currentUser}
          >
            {isSubmitting ? <Spinner className="mr-2" size="sm" /> : null}
            {isSubmitting ? 'Submitting...' : 'Save Results'}
          </Button>
        )}
        <Button 
          variant={isSubmitted ? "default" : "outline"} 
          onClick={onBack} 
          className="flex-1"
        >
          {isSubmitted ? 'Continue' : 'Back to Home'}
        </Button>
      </CardFooter>
    </Card>
  );
} 