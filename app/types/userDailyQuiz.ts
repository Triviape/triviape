export interface UserDailyQuizData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletionDate: string | null;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

export interface DailyQuizStatus {
  hasCompletedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletionDate: string | null;
}

export interface RecordCompletionParams {
  userId: string;
  quizId: string;
  score?: number;
  maxScore?: number;
  completionDate?: string;
} 