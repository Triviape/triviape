/**
 * Multiplayer game types for real-time quiz competitions
 */

export type GameState = 'waiting' | 'starting' | 'active' | 'paused' | 'completed' | 'cancelled';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'finished' | 'disconnected';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed';

/**
 * Player in a multiplayer session
 */
export interface Player {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  status: PlayerStatus;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
  lastActivity: string;
  // Real-time data
  currentAnswer?: string;
  responseTime?: number;
  streak: number;
  position: number; // Current ranking position
}

/**
 * Question data for multiplayer games
 */
export interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  category: string;
  difficulty: DifficultyLevel;
  timeLimit: number; // seconds
  points: number;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Game settings for multiplayer sessions
 */
export interface GameSettings {
  maxPlayers: number;
  questionCount: number;
  timePerQuestion: number; // seconds
  difficulty: DifficultyLevel;
  categoryId?: string;
  isPrivate: boolean;
  allowSpectators: boolean;
  autoStart: boolean;
  pointsPerCorrect: number;
  bonusForSpeed: boolean;
  title?: string;
  description?: string;
}

/**
 * Multiplayer session
 */
export interface MultiplayerSession {
  id: string;
  hostId: string;
  hostDisplayName: string;
  title: string;
  description?: string;
  gameState: GameState;
  settings: GameSettings;
  players: Player[];
  spectators: Player[];
  currentQuestion: number;
  totalQuestions: number;
  questions: QuestionData[];
  timeRemaining: number;
  scores: Record<string, number>;
  rankings: PlayerRanking[];
  // Timestamps
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  // Session metadata
  isPrivate: boolean;
  inviteCode?: string;
  region: string;
  gameMode: 'standard' | 'speed' | 'survival' | 'tournament';
}

/**
 * Player ranking in a session
 */
export interface PlayerRanking {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  position: number;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  streak: number;
  badges: string[]; // Achievement badges earned during game
}

/**
 * Answer submission
 */
export interface AnswerSubmission {
  playerId: string;
  questionId: string;
  answer: string;
  timeSpent: number;
  timestamp: number;
  isCorrect?: boolean; // Calculated on server
  points?: number; // Points awarded
}

/**
 * Game events for WebSocket communication
 */
export interface GameEvents {
  // Connection events
  'player-joined': { player: Player; session: MultiplayerSession };
  'player-left': { playerId: string; session: MultiplayerSession };
  'player-disconnected': { playerId: string; reason: string };
  'player-reconnected': { playerId: string };
  
  // Game state events
  'game-starting': { countdown: number };
  'game-started': { question: QuestionData; questionNumber: number };
  'question-changed': { question: QuestionData; questionNumber: number };
  'game-paused': { reason: string };
  'game-resumed': {};
  'game-ended': { finalRankings: PlayerRanking[]; statistics: GameStatistics };
  
  // Answer events
  'answer-submitted': { playerId: string; playerName: string; timeSpent: number };
  'answer-revealed': { correctAnswer: string; explanation?: string; playerAnswers: Record<string, string> };
  'question-completed': { rankings: PlayerRanking[]; nextQuestion?: QuestionData };
  
  // Real-time updates
  'score-updated': { playerId: string; score: number; change: number };
  'rankings-updated': { rankings: PlayerRanking[] };
  'timer-update': { timeRemaining: number };
  'player-status-changed': { playerId: string; status: PlayerStatus };
  
  // Chat events
  'chat-message': { playerId: string; playerName: string; message: string; timestamp: number };
  'system-message': { message: string; type: 'info' | 'warning' | 'error' };
  
  // Error events
  'error': { message: string; code?: string };
  'connection-lost': { reason: string };
  'reconnected': {};
  'reconnect-failed': {};
}

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'player' | 'system' | 'achievement';
}

/**
 * Game statistics
 */
export interface GameStatistics {
  totalPlayers: number;
  totalQuestions: number;
  averageScore: number;
  averageResponseTime: number;
  completionRate: number;
  difficultyDistribution: Record<DifficultyLevel, number>;
  categoryPerformance: Record<string, {
    correct: number;
    total: number;
    averageTime: number;
  }>;
  playerStatistics: Record<string, PlayerGameStats>;
}

/**
 * Individual player statistics for a game
 */
export interface PlayerGameStats {
  playerId: string;
  finalScore: number;
  finalPosition: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  fastestResponse: number;
  longestStreak: number;
  pointsFromSpeed: number;
  categoriesPlayed: string[];
  achievements: string[];
}

/**
 * Spectator data
 */
export interface Spectator {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: string;
  permissions: {
    canChat: boolean;
    canSeeAnswers: boolean;
  };
}

/**
 * Session invitation
 */
export interface SessionInvitation {
  id: string;
  sessionId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  inviteCode: string;
  message?: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

/**
 * Matchmaking preferences
 */
export interface MatchmakingPreferences {
  preferredDifficulty: DifficultyLevel[];
  preferredCategories: string[];
  maxPlayers: number;
  allowPrivateSessions: boolean;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  region: string;
  language: string;
}

/**
 * Live tournament data
 */
export interface Tournament {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  status: 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
  rounds: TournamentRound[];
  startTime: string;
  endTime?: string;
  rules: TournamentRules;
  participants: TournamentParticipant[];
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  name: string;
  status: 'pending' | 'active' | 'completed';
  sessions: MultiplayerSession[];
  winners: string[]; // Player IDs
  startTime?: string;
  endTime?: string;
}

export interface TournamentRules {
  eliminationStyle: 'single' | 'double' | 'swiss' | 'round_robin';
  questionsPerRound: number;
  timePerQuestion: number;
  maxPlayersPerSession: number;
  tieBreaker: 'time' | 'accuracy' | 'additional_questions';
}

export interface TournamentParticipant {
  playerId: string;
  playerName: string;
  avatarUrl?: string;
  registeredAt: string;
  status: 'registered' | 'active' | 'eliminated' | 'winner';
  currentRound: number;
  totalScore: number;
  wins: number;
  losses: number;
}

/**
 * Real-time connection status
 */
export interface ConnectionStatus {
  isConnected: boolean;
  latency: number; // milliseconds
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  reconnectAttempts: number;
  lastHeartbeat: number;
}