import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '@/app/lib/services/websocketService';
import { 
  MultiplayerSession,
  Player,
  GameEvents,
  GameSettings,
  GameState,
  QuestionData,
  PlayerRanking,
  ChatMessage,
  ConnectionStatus
} from '@/app/types/multiplayer';
import { useAuth } from './useAuth';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onError?: (error: string) => void;
  onConnectionLost?: () => void;
  onReconnected?: () => void;
}

/**
 * Hook for managing WebSocket connection and real-time game features
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { currentUser } = useAuth();
  const { autoConnect = true, onError, onConnectionLost, onReconnected } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    latency: 0,
    quality: 'poor',
    reconnectAttempts: 0,
    lastHeartbeat: 0
  });
  
  // Track if we've attempted connection to avoid duplicate attempts
  const connectionAttempted = useRef(false);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!currentUser?.uid || connectionAttempted.current) return;
    
    try {
      connectionAttempted.current = true;
      await webSocketService.connect(currentUser.uid);
      setIsConnected(true);
      webSocketService.startHeartbeat();
      
      // Set up global event listeners
      webSocketService.on('error', (data) => {
        onError?.(data.error);
      });
      
      webSocketService.on('connection-lost', () => {
        setIsConnected(false);
        onConnectionLost?.();
      });
      
      webSocketService.on('reconnected', () => {
        setIsConnected(true);
        onReconnected?.();
      });
      
    } catch (error) {
      connectionAttempted.current = false;
      console.error('Failed to connect to WebSocket:', error);
      onError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [currentUser?.uid, onError, onConnectionLost, onReconnected]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
    connectionAttempted.current = false;
  }, []);

  // Auto-connect when user is available
  useEffect(() => {
    if (autoConnect && currentUser?.uid && !connectionAttempted.current) {
      connect();
    }

    return () => {
      if (!autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, currentUser?.uid, connect, disconnect]);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = webSocketService.getStatus();
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: status.connected,
        reconnectAttempts: status.reconnectAttempts,
        lastHeartbeat: Date.now()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    service: webSocketService
  };
}

/**
 * Hook for managing multiplayer game sessions
 */
export function useMultiplayerSession() {
  const { service, isConnected } = useWebSocket();
  const [currentSession, setCurrentSession] = useState<MultiplayerSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Create a new session
  const createSession = useCallback(async (settings: GameSettings) => {
    if (!isConnected) throw new Error('Not connected to WebSocket');
    
    try {
      const result = await service.createSession(settings);
      setCurrentSession(result.session);
      setGameState(result.session.gameState);
      setPlayers(result.session.players);
      return result;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }, [isConnected, service]);

  // Join an existing session
  const joinSession = useCallback(async (sessionId: string, playerData: Partial<Player>) => {
    if (!isConnected) throw new Error('Not connected to WebSocket');
    
    try {
      await service.joinSession(sessionId, playerData);
      const sessionData = await service.getSessionData();
      if (sessionData) {
        setCurrentSession(sessionData);
        setGameState(sessionData.gameState);
        setPlayers(sessionData.players);
        setRankings(sessionData.rankings);
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  }, [isConnected, service]);

  // Leave current session
  const leaveSession = useCallback(async () => {
    try {
      await service.leaveSession();
      setCurrentSession(null);
      setPlayers([]);
      setGameState('waiting');
      setCurrentQuestion(null);
      setRankings([]);
      setTimeRemaining(0);
      setChatMessages([]);
    } catch (error) {
      console.error('Failed to leave session:', error);
      throw error;
    }
  }, [service]);

  // Start the game
  const startGame = useCallback(async () => {
    if (!isConnected || !currentSession) {
      throw new Error('Not connected or no session');
    }
    
    try {
      await service.startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }, [isConnected, currentSession, service]);

  // Submit an answer
  const submitAnswer = useCallback(async (answer: string, timeSpent: number) => {
    if (!isConnected || !currentSession) {
      throw new Error('Not connected or no session');
    }
    
    try {
      await service.submitAnswer(answer, timeSpent);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }, [isConnected, currentSession, service]);

  // Send chat message
  const sendMessage = useCallback(async (message: string) => {
    if (!isConnected || !currentSession) {
      throw new Error('Not connected or no session');
    }
    
    try {
      await service.sendMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [isConnected, currentSession, service]);

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return;

    const eventHandlers: { [K in keyof GameEvents]?: (data: GameEvents[K]) => void } = {
      'player-joined': (data) => {
        setPlayers(data.session.players);
        setCurrentSession(data.session);
      },
      'player-left': (data) => {
        setPlayers(data.session.players);
        setCurrentSession(data.session);
      },
      'game-started': (data) => {
        setGameState('active');
        setCurrentQuestion(data.question);
      },
      'question-changed': (data) => {
        setCurrentQuestion(data.question);
      },
      'game-ended': (data) => {
        setGameState('completed');
        setRankings(data.finalRankings);
      },
      'rankings-updated': (data) => {
        setRankings(data.rankings);
      },
      'timer-update': (data) => {
        setTimeRemaining(data.timeRemaining);
      },
      'chat-message': (data) => {
        setChatMessages(prev => [...prev, {
          id: `${data.timestamp}-${data.playerId}`,
          playerId: data.playerId,
          playerName: data.playerName,
          message: data.message,
          timestamp: data.timestamp,
          type: 'player'
        }]);
      },
      'system-message': (data) => {
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-system`,
          playerId: 'system',
          playerName: 'System',
          message: data.message,
          timestamp: Date.now(),
          type: 'system'
        }]);
      }
    };

    // Register event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      if (handler) {
        service.on(event as keyof GameEvents, handler);
      }
    });

    // Cleanup function
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        if (handler) {
          service.off(event as keyof GameEvents, handler);
        }
      });
    };
  }, [isConnected, service]);

  return {
    // Session data
    currentSession,
    players,
    gameState,
    currentQuestion,
    rankings,
    timeRemaining,
    chatMessages,
    
    // Actions
    createSession,
    joinSession,
    leaveSession,
    startGame,
    submitAnswer,
    sendMessage,
    
    // State
    isConnected,
    isInSession: !!currentSession,
    canStartGame: gameState === 'waiting' && players.length > 1,
  };
}

/**
 * Hook for finding and managing available sessions
 */
export function useSessionBrowser() {
  const { service, isConnected } = useWebSocket();
  const [availableSessions, setAvailableSessions] = useState<MultiplayerSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Find available sessions
  const findSessions = useCallback(async (filters?: {
    difficulty?: string;
    category?: string;
    maxPlayers?: number;
  }) => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const sessions = await service.findSessions(filters);
      setAvailableSessions(sessions);
    } catch (error) {
      console.error('Failed to find sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, service]);

  // Refresh sessions list
  const refreshSessions = useCallback(() => {
    findSessions();
  }, [findSessions]);

  return {
    availableSessions,
    isLoading,
    findSessions,
    refreshSessions,
    isConnected
  };
}