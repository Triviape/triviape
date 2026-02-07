import { io, Socket } from 'socket.io-client';
import { measureMultiplayerAction, recordRealtimeLatency, socialPerformanceMonitor } from './socialPerformanceMonitor';
import { 
  MultiplayerSession,
  GameEvents,
  Player,
  PlayerRanking,
  GameState,
  QuestionData,
  GameSettings
} from '@/app/types/multiplayer';

/**
 * WebSocket service for real-time multiplayer features
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private eventListeners = new Map<string, Set<Function>>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(userId: string, authToken?: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    const startTime = performance.now();

    try {
      // For development, connect to local server; for production, use your domain
      const serverUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3032' 
        : process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3032';

      this.socket = io(serverUrl, {
        auth: {
          userId,
          token: authToken
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Record connection latency
          const latency = performance.now() - startTime;
          recordRealtimeLatency(latency, { action: 'websocket_connect', userId });
          
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.socket!.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.notifyListeners('connection-lost', { reason });
        });
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.sessionId = null;
      this.eventListeners.clear();
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a multiplayer session
   */
  async joinSession(sessionId: string, playerData: Partial<Player>): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    this.sessionId = sessionId;
    
    return new Promise((resolve, reject) => {
      this.socket!.emit('join-session', { sessionId, playerData }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join session'));
        }
      });
    });
  }

  /**
   * Leave current session
   */
  async leaveSession(): Promise<void> {
    if (!this.socket?.connected || !this.sessionId) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('leave-session', { sessionId: this.sessionId }, () => {
        this.sessionId = null;
        resolve();
      });
    });
  }

  /**
   * Create a new multiplayer session
   */
  async createSession(settings: GameSettings): Promise<{ sessionId: string; session: MultiplayerSession }> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('create-session', { settings }, (response: any) => {
        if (response.success) {
          this.sessionId = response.sessionId;
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to create session'));
        }
      });
    });
  }

  /**
   * Start the game in current session
   */
  async startGame(): Promise<void> {
    if (!this.socket?.connected || !this.sessionId) {
      throw new Error('Not connected to a session');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('start-game', { sessionId: this.sessionId }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to start game'));
        }
      });
    });
  }

  /**
   * Submit an answer
   */
  async submitAnswer(answer: string, timeSpent: number): Promise<void> {
    if (!this.socket?.connected || !this.sessionId) {
      throw new Error('Not connected to a session');
    }

    this.socket.emit('submit-answer', {
      sessionId: this.sessionId,
      answer,
      timeSpent,
      timestamp: Date.now()
    });
  }

  /**
   * Send a chat message
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.socket?.connected || !this.sessionId) {
      throw new Error('Not connected to a session');
    }

    this.socket.emit('chat-message', {
      sessionId: this.sessionId,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Find available sessions
   */
  async findSessions(filters?: { 
    difficulty?: string; 
    category?: string; 
    maxPlayers?: number; 
  }): Promise<MultiplayerSession[]> {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('find-sessions', filters, (response: any) => {
        if (response.success) {
          resolve(response.sessions);
        } else {
          reject(new Error(response.error || 'Failed to find sessions'));
        }
      });
    });
  }

  /**
   * Get current session data
   */
  async getSessionData(): Promise<MultiplayerSession | null> {
    if (!this.socket?.connected || !this.sessionId) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('get-session', { sessionId: this.sessionId }, (response: any) => {
        if (response.success) {
          resolve(response.session);
        } else {
          reject(new Error(response.error || 'Failed to get session data'));
        }
      });
    });
  }

  /**
   * Add event listener
   */
  on<K extends keyof GameEvents>(event: K, callback: (data: GameEvents[K]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Set up socket listener if not already set
    if (this.socket && !this.socket.hasListeners(event)) {
      this.socket.on(event as string, ((data: any) => {
        this.notifyListeners(event, data);
      }) as any);
    }
  }

  /**
   * Remove event listener
   */
  off<K extends keyof GameEvents>(event: K, callback: (data: GameEvents[K]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
        if (this.socket) {
          this.socket.off(event as string);
        }
      }
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      userId: this.userId,
      sessionId: this.sessionId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('reconnect', () => {
      console.log('WebSocket reconnected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('reconnected', {});
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.notifyListeners('reconnect-failed', {});
    });

    // Game events are handled by individual event listeners added via on()
  }

  private notifyListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Update player status
   */
  async updatePlayerStatus(status: 'ready' | 'not_ready' | 'playing' | 'finished'): Promise<void> {
    if (!this.socket?.connected || !this.sessionId) {
      throw new Error('Not connected to a session');
    }

    this.socket.emit('update-player-status', {
      sessionId: this.sessionId,
      status
    });
  }

  /**
   * Send heartbeat to maintain connection
   */
  private sendHeartbeat(): void {
    if (this.socket?.connected) {
      this.socket.emit('heartbeat', { timestamp: Date.now() });
    }
  }

  /**
   * Start heartbeat interval
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Handle errors gracefully
   */
  private handleError(error: Error, context: string): void {
    console.error(`WebSocket error in ${context}:`, error);
    this.notifyListeners('error', { error: error.message, context });
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
