/**
 * Unified quiz completion handler for both regular and daily quizzes
 */

import { submitQuizAttempt } from '@/app/actions/quizActions';

export interface QuizAnswerData {
  questionId: string;
  selectedAnswerIds: string[];
  timeSpent: number;
  wasSkipped: boolean;
}

export interface QuizCompletionData {
  quizId: string;
  startTime: number;
  endTime: number;
  answers: QuizAnswerData[];
  questionSequence: string[];
}

export interface QuizCompletionResult {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  xpEarned: number;
  coinsEarned: number;
}

/**
 * Submit quiz completion using the standardized flow
 * This function handles both regular and daily quiz submissions
 */
export async function submitQuizCompletion(
  completionData: QuizCompletionData
): Promise<QuizCompletionResult> {
  try {
    // Prepare form data for submission
    const formData = new FormData();
    formData.append('quizId', completionData.quizId);
    formData.append('startedAt', String(completionData.startTime));
    formData.append('completedAt', String(completionData.endTime));
    formData.append('questionSequence', JSON.stringify(completionData.questionSequence));
    formData.append('answers', JSON.stringify(completionData.answers));
    
    // Add device info for analytics
    formData.append('deviceType', navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop');
    formData.append('browser', navigator.userAgent);
    formData.append('os', navigator.platform);
    
    // Submit using the standard action
    const result = await submitQuizAttempt(formData);
    
    return result;
  } catch (error) {
    console.error('Error submitting quiz completion:', error);
    throw new Error('Failed to submit quiz results');
  }
}

/**
 * Calculate quiz results from user answers and questions
 * This provides a consistent way to calculate scores across different quiz types
 */
export function calculateQuizResults(
  answers: Record<string, string[]>,
  questions: any[],
  startTime: number,
  endTime?: number
): {
  correctCount: number;
  totalQuestions: number;
  score: number;
  formattedAnswers: QuizAnswerData[];
} {
  let correctCount = 0;
  const averageTimePerQuestion = endTime ? 
    Math.floor((endTime - startTime) / questions.length / 1000) : 30; // Default 30s per question
  
  const formattedAnswers: QuizAnswerData[] = questions.map((question, index) => {
    const userAnswerIds = answers[question.id] || [];
    const correctAnswerIds = question.answers
      ? question.answers.filter((answer: any) => answer.isCorrect).map((answer: any) => answer.id)
      : [];
    
    // Check if answer is correct
    const isCorrect = 
      userAnswerIds.length === correctAnswerIds.length && 
      userAnswerIds.every(id => correctAnswerIds.includes(id));
    
    if (isCorrect) {
      correctCount++;
    }
    
    return {
      questionId: question.id,
      selectedAnswerIds: userAnswerIds,
      timeSpent: averageTimePerQuestion,
      wasSkipped: userAnswerIds.length === 0
    };
  });
  
  const score = Math.round((correctCount / questions.length) * 100);
  
  return {
    correctCount,
    totalQuestions: questions.length,
    score,
    formattedAnswers
  };
}

/**
 * Enhanced quiz completion for daily quizzes that includes special handling
 */
export async function submitDailyQuizCompletion(
  quizId: string,
  answers: Record<string, string[]>,
  questions: any[],
  startTime: number,
  endTime?: number
): Promise<QuizCompletionResult> {
  const currentTime = endTime || Date.now();
  
  // Calculate results
  const results = calculateQuizResults(answers, questions, startTime, currentTime);
  
  // Prepare completion data
  const completionData: QuizCompletionData = {
    quizId,
    startTime,
    endTime: currentTime,
    answers: results.formattedAnswers,
    questionSequence: questions.map(q => q.id)
  };
  
  // Submit using standardized flow
  return await submitQuizCompletion(completionData);
}