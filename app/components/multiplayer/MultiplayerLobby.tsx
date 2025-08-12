'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Users, 
  Play, 
  Plus, 
  Search,
  Crown,
  Clock,
  Trophy,
  MessageCircle,
  Settings,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Gamepad2,
  Timer
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useMultiplayerSession, useSessionBrowser } from '@/app/hooks/useWebSocket';
import { 
  MultiplayerSession, 
  Player, 
  GameSettings, 
  GameState,
  DifficultyLevel 
} from '@/app/types/multiplayer';
import { useAuth } from '@/app/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface MultiplayerLobbyProps {
  className?: string;
}

const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 4,
  questionCount: 10,
  timePerQuestion: 30,
  difficulty: 'medium',
  isPrivate: false,
  allowSpectators: true,
  autoStart: false,
  pointsPerCorrect: 100,
  bonusForSpeed: true,
  title: 'Quick Match'
};

export function MultiplayerLobby({ className }: MultiplayerLobbyProps) {
  const { currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState('browse');
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  const [chatMessage, setChatMessage] = useState('');

  const {
    currentSession,
    players,
    gameState,
    timeRemaining,
    chatMessages,
    createSession,
    joinSession,
    leaveSession,
    startGame,
    sendMessage,
    isConnected,
    isInSession,
    canStartGame
  } = useMultiplayerSession();

  const {
    availableSessions,
    isLoading: sessionsLoading,
    findSessions,
    refreshSessions
  } = useSessionBrowser();

  // Auto-refresh sessions when browsing
  useEffect(() => {
    if (selectedTab === 'browse' && !isInSession) {
      findSessions();
      const interval = setInterval(findSessions, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTab, isInSession, findSessions]);

  const handleCreateSession = async () => {
    try {
      const sessionData = {
        ...gameSettings,
        title: gameSettings.title || `${currentUser?.displayName || 'Player'}'s Game`
      };
      await createSession(sessionData);
      setSelectedTab('lobby');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      await joinSession(sessionId, {
        userId: currentUser!.uid,
        displayName: currentUser!.displayName || 'Anonymous',
        avatarUrl: currentUser!.photoURL || undefined,
        status: 'waiting',
        score: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        averageResponseTime: 0,
        isHost: false,
        isReady: false,
        streak: 0,
        position: 0
      });
      setSelectedTab('lobby');
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleLeaveSession = async () => {
    try {
      await leaveSession();
      setSelectedTab('browse');
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      await sendMessage(chatMessage);
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderPlayer = (player: Player) => {
    const isCurrentUser = player.userId === currentUser?.uid;
    
    return (
      <div
        key={player.id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          isCurrentUser && 'border-primary bg-primary/5'
        )}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={player.avatarUrl} alt={player.displayName} />
            <AvatarFallback>
              {player.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {player.isHost && (
            <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{player.displayName}</span>
            {isCurrentUser && (
              <Badge variant="secondary" className="text-xs">You</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {player.status === 'ready' ? 'Ready' : 'Waiting'}
          </div>
        </div>

        <Badge 
          variant={player.isReady ? "default" : "outline"}
          className="text-xs"
        >
          {player.isReady ? 'Ready' : 'Not Ready'}
        </Badge>
      </div>
    );
  };

  const renderSessionCard = (session: MultiplayerSession) => (
    <Card key={session.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium">{session.title}</h3>
            <p className="text-sm text-muted-foreground">
              Host: {session.hostDisplayName}
            </p>
          </div>
          <Badge variant="outline">
            {session.players.length}/{session.settings.maxPlayers}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            <span>{session.settings.difficulty}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{session.settings.timePerQuestion}s</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{session.settings.questionCount} questions</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
          </div>
          <Button
            size="sm"
            onClick={() => handleJoinSession(session.id)}
            disabled={session.players.length >= session.settings.maxPlayers}
          >
            Join Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Connection status indicator
  const ConnectionIndicator = () => (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Disconnected</span>
        </>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Multiplayer Hub
          </CardTitle>
          <ConnectionIndicator />
        </div>
      </CardHeader>

      <CardContent>
        {!isConnected ? (
          <div className="text-center py-8">
            <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Connection Required</h3>
            <p className="text-muted-foreground">
              Please check your internet connection to play multiplayer games.
            </p>
          </div>
        ) : isInSession ? (
          // Session Lobby View
          <div className="space-y-6">
            {/* Session Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{currentSession?.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Game State: <Badge variant="outline">{gameState}</Badge>
                </p>
              </div>
              <Button variant="outline" onClick={handleLeaveSession}>
                Leave Game
              </Button>
            </div>

            {/* Game Timer */}
            {gameState === 'active' && timeRemaining > 0 && (
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-bold text-blue-600">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </Card>
            )}

            {/* Players List */}
            <div>
              <h3 className="font-medium mb-3">
                Players ({players.length}/{currentSession?.settings.maxPlayers})
              </h3>
              <div className="space-y-2">
                {players.map(renderPlayer)}
              </div>
            </div>

            {/* Game Controls */}
            {gameState === 'waiting' && (
              <div className="flex gap-3">
                <Button
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Game
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Chat */}
            <div className="border rounded-lg">
              <div className="p-3 border-b">
                <h4 className="font-medium">Chat</h4>
              </div>
              <div className="h-32 p-3 overflow-y-auto space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-medium">{msg.playerName}:</span>
                    <span className="ml-1">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Main Lobby View
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Games</TabsTrigger>
              <TabsTrigger value="create">Create Game</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Available Games</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshSessions}
                  disabled={sessionsLoading}
                >
                  {sessionsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {sessionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-8 bg-muted rounded w-20 ml-auto" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : availableSessions.length > 0 ? (
                <div className="space-y-3">
                  {availableSessions.map(renderSessionCard)}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Games Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a multiplayer game!
                  </p>
                  <Button onClick={() => setSelectedTab('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Game
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Game Title</label>
                  <Input
                    value={gameSettings.title || ''}
                    onChange={(e) => setGameSettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter game title..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Max Players</label>
                    <Input
                      type="number"
                      min="2"
                      max="8"
                      value={gameSettings.maxPlayers}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        maxPlayers: parseInt(e.target.value) || 2 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Questions</label>
                    <Input
                      type="number"
                      min="5"
                      max="50"
                      value={gameSettings.questionCount}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        questionCount: parseInt(e.target.value) || 10 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Time per Question (seconds)</label>
                    <Input
                      type="number"
                      min="10"
                      max="120"
                      value={gameSettings.timePerQuestion}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        timePerQuestion: parseInt(e.target.value) || 30 
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                      value={gameSettings.difficulty}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        difficulty: e.target.value as DifficultyLevel 
                      }))}
                      className="w-full px-3 py-2 border border-input rounded-md"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <Button onClick={handleCreateSession} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Game
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}