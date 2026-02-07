import { QuizDifficulty, Quiz, Question } from '@/app/types/quiz';

// Hard-coded daily quiz for development and testing
export const mockDailyQuiz: Quiz = {
  id: 'daily-quiz-1',
  title: 'Today\'s Trivia Challenge',
  description: 'Test your knowledge with today\'s selection of trivia questions covering various topics!',
  categoryId: 'general-knowledge',
  difficulty: 'medium' as QuizDifficulty,
  timeLimit: 300, // 5 minutes
  questionIds: [
    'question-1',
    'question-2',
    'question-3',
    'question-4',
    'question-5',
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  // Additional fields for daily quiz
  isDailyQuiz: true,
  dailyQuizDate: new Date().toISOString().split('T')[0],
  tags: ['daily', 'trivia'],
  estimatedDuration: 5, // 5 minutes
  maxAttempts: 3
};

// Mock questions for the daily quiz
export const mockQuestions: Question[] = [
  {
    id: 'question-1',
    text: 'What is the capital of France?',
    type: 'multiple-choice' as const,
    answers: [
      { id: '1', text: 'Paris', isCorrect: true },
      { id: '2', text: 'London', isCorrect: false },
      { id: '3', text: 'Berlin', isCorrect: false },
      { id: '4', text: 'Madrid', isCorrect: false },
    ],
    explanation: 'Paris is the capital and largest city of France.',
    points: 10,
    timeLimit: 30
  },
  {
    id: 'question-2',
    text: 'Which planet is known as the Red Planet?',
    type: 'multiple-choice' as const,
    answers: [
      { id: '1', text: 'Venus', isCorrect: false },
      { id: '2', text: 'Mars', isCorrect: true },
      { id: '3', text: 'Jupiter', isCorrect: false },
      { id: '4', text: 'Saturn', isCorrect: false },
    ],
    explanation: 'Mars is called the Red Planet due to its reddish appearance.',
    points: 10,
    timeLimit: 30
  },
  {
    id: 'question-3',
    text: 'What is the largest mammal on Earth?',
    type: 'multiple-choice' as const,
    answers: [
      { id: '1', text: 'African Elephant', isCorrect: false },
      { id: '2', text: 'Blue Whale', isCorrect: true },
      { id: '3', text: 'Giraffe', isCorrect: false },
      { id: '4', text: 'Polar Bear', isCorrect: false },
    ],
    explanation: 'The Blue Whale is the largest mammal on Earth.',
    points: 15,
    timeLimit: 45
  },
  {
    id: 'question-4',
    text: 'In which year did World War II end?',
    type: 'multiple-choice' as const,
    answers: [
      { id: '1', text: '1943', isCorrect: false },
      { id: '2', text: '1944', isCorrect: false },
      { id: '3', text: '1945', isCorrect: true },
      { id: '4', text: '1946', isCorrect: false },
    ],
    explanation: 'World War II ended in 1945 with the surrender of Germany and Japan.',
    points: 15,
    timeLimit: 45
  },
  {
    id: 'question-5',
    text: 'Who painted the Mona Lisa?',
    type: 'multiple-choice' as const,
    answers: [
      { id: '1', text: 'Vincent van Gogh', isCorrect: false },
      { id: '2', text: 'Pablo Picasso', isCorrect: false },
      { id: '3', text: 'Leonardo da Vinci', isCorrect: true },
      { id: '4', text: 'Michelangelo', isCorrect: false },
    ],
    explanation: 'Leonardo da Vinci painted the Mona Lisa between 1503 and 1519.',
    points: 10,
    timeLimit: 30
  }
]; 
