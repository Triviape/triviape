'use client';

import React from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { MultiplayerLobby } from '@/app/components/multiplayer/MultiplayerLobby';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  Clock,
  Zap,
  Globe,
  MessageCircle,
  Crown,
  Target,
  TrendingUp
} from 'lucide-react';

export default function MultiplayerPage() {
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background min-h-screen"
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-500">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Multiplayer Arena
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Challenge players from around the world in real-time quiz competitions. Test your knowledge and climb the rankings!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Real-time Competition</h3>
              <p className="text-sm text-muted-foreground">
                Play against up to 8 players simultaneously
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Low-latency WebSocket connections for instant responses
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Rankings</h3>
              <p className="text-sm text-muted-foreground">
                Watch rankings update in real-time as you play
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-purple-500 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground">
                Chat with other players during matches
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Multiplayer Lobby */}
          <div className="lg:col-span-2">
            <MultiplayerLobby />
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Game Modes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Game Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">Quick Match</div>
                    <div className="text-sm text-muted-foreground">Fast-paced 10-question rounds</div>
                  </div>
                  <Badge variant="default">Available</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <div className="font-medium">Tournament Mode</div>
                    <div className="text-sm text-muted-foreground">Bracket-style elimination</div>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium">Ranked Matches</div>
                    <div className="text-sm text-muted-foreground">Competitive ranking system</div>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            {/* How to Play */}
            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Create or Join a Game</div>
                    <div className="text-muted-foreground">Browse available games or create your own</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Wait for Players</div>
                    <div className="text-muted-foreground">Games start when enough players join</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Answer Questions</div>
                    <div className="text-muted-foreground">Race against time and other players</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    4
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Climb the Rankings</div>
                    <div className="text-muted-foreground">Watch your position update in real-time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebSocket Server</span>
                  <Badge variant="secondary">Development Mode</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Features</span>
                  <Badge variant="outline">Beta</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chat System</span>
                  <Badge variant="outline">Beta</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-4">
                  Note: This is a demo implementation. In production, you would need to set up a proper WebSocket server.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Development Notice */}
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-800">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  🚀 Development Implementation
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  This is a complete front-end implementation of the multiplayer system. To make it fully functional, you'll need to:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 ml-4">
                  <li>• Set up a WebSocket server (Socket.io recommended)</li>
                  <li>• Implement server-side game logic and session management</li>
                  <li>• Add question fetching and validation logic</li>
                  <li>• Configure real-time database for game state</li>
                  <li>• Add proper authentication and authorization</li>
                </ul>
                <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                  All the client-side infrastructure is ready - just connect to your WebSocket server!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}