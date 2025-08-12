/**
 * Types for questions in the quiz application
 */

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionAnalytics {
  timesAnswered: number;
  timesCorrect: number;
  timesSkipped: number;
  averageAnswerTime: number;
}

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  answers: AnswerOption[];
  difficulty: string;
  categoryId: string;
  analytics?: QuestionAnalytics;
  createdAt: Date;
  updatedAt: Date;
} 