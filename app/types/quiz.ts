/**
 * Represents a quiz category for organization and filtering
 */
export interface QuizCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  parentCategoryId?: string; // For hierarchical categories
}

/**
 * Difficulty levels for questions
 */
export enum DifficultyLevel {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
  Expert = 'expert'
}

/**
 * Types of questions supported by the system
 */
export enum QuestionType {
  MultipleChoice = 'multiple_choice',
  TrueFalse = 'true_false',
  ShortAnswer = 'short_answer',
  Matching = 'matching'
}

/**
 * Represents an answer option for a question
 */
export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string; // Explanation for why this answer is correct/incorrect
}

/**
 * Represents a question with metadata
 */
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  categoryIds: string[]; // A question can belong to multiple categories
  answers: AnswerOption[];
  points: number; // Base points for answering correctly
  timeLimit?: number; // Time limit in seconds (optional)
  hint?: string; // Optional hint for the question
  
  // Metadata for analytics
  timesAnswered: number;
  timesAnsweredCorrectly: number;
  averageAnswerTime: number; // Average time in seconds
  skipRate: number; // Percentage of times this question was skipped
  
  // Tags for additional filtering and organization
  tags: string[];
  
  // Administrative metadata
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
  isActive: boolean; // Whether the question is currently active
}

/**
 * Represents a complete quiz with questions
 */
export interface Quiz {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  
  // Quiz configuration
  timeLimit?: number; // Total time limit in seconds (optional)
  passingScore?: number; // Minimum score to pass (optional)
  shuffleQuestions: boolean; // Whether to randomize question order
  
  // Question selection
  questionIds: string[]; // IDs of questions in this quiz
  
  // Quiz metadata
  difficulty: DifficultyLevel;
  categoryIds: string[];
  estimatedDuration: number; // Estimated time to complete in seconds
  
  // Rewards
  baseXP: number;
  baseCoins: number;
  
  // Administrative metadata
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  
  // Usage statistics
  timesPlayed: number;
  averageScore: number;
  completionRate: number; // Percentage of users who complete this quiz
}

/**
 * Represents a user's attempt at a quiz
 */
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  
  // Timing information
  startedAt: number;
  completedAt?: number;
  
  // Questions as presented to the user (might be shuffled)
  questionSequence: string[];
  
  // User's answers for each question
  answers: {
    questionId: string;
    selectedAnswerIds: string[];
    timeSpent: number; // Time spent on this question in seconds
    wasSkipped: boolean;
    wasCorrect: boolean;
    pointsEarned: number;
  }[];
  
  // Results
  score: number;
  maxPossibleScore: number;
  xpEarned: number;
  coinsEarned: number;
  
  // Additional metadata
  deviceInfo?: {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
  };
}

/**
 * Partial representation of a question for list views
 * (optimized for efficient loading of question lists)
 */
export interface QuestionSummary {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  categoryIds: string[];
  points: number;
  isActive: boolean;
} 