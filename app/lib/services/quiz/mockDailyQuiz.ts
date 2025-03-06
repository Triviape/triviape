import { DifficultyLevel, Quiz } from '@/app/types/quiz';

// Hard-coded daily quiz for development and testing
export const mockDailyQuiz: Quiz = {
  id: 'daily-quiz-1',
  title: 'Today\'s Trivia Challenge',
  description: 'Test your knowledge with today\'s selection of trivia questions covering various topics!',
  coverImage: '/images/daily-quiz-cover.jpg',
  timeLimit: 300, // 5 minutes
  passingScore: 70,
  shuffleQuestions: true,
  questionIds: [
    'question-1',
    'question-2',
    'question-3',
    'question-4',
    'question-5',
  ],
  difficulty: DifficultyLevel.Medium,
  categoryIds: ['general-knowledge', 'science', 'history'],
  estimatedDuration: 5, // 5 minutes
  baseXP: 150,
  baseCoins: 75,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isActive: true,
  timesPlayed: 245,
  averageScore: 78.5,
  completionRate: 92.3
};

// Mock questions for the daily quiz
export const mockQuestions = [
  {
    id: 'question-1',
    text: 'What is the capital of France?',
    type: 'multiple_choice',
    difficulty: DifficultyLevel.Easy,
    answers: [
      { id: 'a1', text: 'Paris', isCorrect: true },
      { id: 'a2', text: 'London', isCorrect: false },
      { id: 'a3', text: 'Berlin', isCorrect: false },
      { id: 'a4', text: 'Madrid', isCorrect: false }
    ]
  },
  {
    id: 'question-2',
    text: 'Which planet is known as the Red Planet?',
    type: 'multiple_choice',
    difficulty: DifficultyLevel.Easy,
    answers: [
      { id: 'a1', text: 'Venus', isCorrect: false },
      { id: 'a2', text: 'Mars', isCorrect: true },
      { id: 'a3', text: 'Jupiter', isCorrect: false },
      { id: 'a4', text: 'Saturn', isCorrect: false }
    ]
  },
  {
    id: 'question-3',
    text: 'What is the largest mammal on Earth?',
    type: 'multiple_choice',
    difficulty: DifficultyLevel.Medium,
    answers: [
      { id: 'a1', text: 'African Elephant', isCorrect: false },
      { id: 'a2', text: 'Blue Whale', isCorrect: true },
      { id: 'a3', text: 'Giraffe', isCorrect: false },
      { id: 'a4', text: 'Polar Bear', isCorrect: false }
    ]
  },
  {
    id: 'question-4',
    text: 'In which year did World War II end?',
    type: 'multiple_choice',
    difficulty: DifficultyLevel.Medium,
    answers: [
      { id: 'a1', text: '1943', isCorrect: false },
      { id: 'a2', text: '1944', isCorrect: false },
      { id: 'a3', text: '1945', isCorrect: true },
      { id: 'a4', text: '1946', isCorrect: false }
    ]
  },
  {
    id: 'question-5',
    text: 'Who painted the Mona Lisa?',
    type: 'multiple_choice',
    difficulty: DifficultyLevel.Easy,
    answers: [
      { id: 'a1', text: 'Vincent van Gogh', isCorrect: false },
      { id: 'a2', text: 'Pablo Picasso', isCorrect: false },
      { id: 'a3', text: 'Leonardo da Vinci', isCorrect: true },
      { id: 'a4', text: 'Michelangelo', isCorrect: false }
    ]
  }
]; 