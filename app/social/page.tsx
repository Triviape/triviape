'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { FriendsList } from '@/app/components/social/FriendsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Users, 
  Trophy, 
  MessageCircle, 
  Calendar,
  Activity,
  Award,
  TrendingUp,
  Zap,
  Star,
  Heart,
  Send,
  GamepadIcon
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useFriendActivity, usePresence } from '@/app/hooks/useFriends';
import { Friend, FriendActivity } from '@/app/types/social';
import { formatDistanceToNow } from 'date-fns';

export default function SocialPage() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const { data: activities, isLoading: activitiesLoading } = useFriendActivity();
  
  // Initialize presence tracking
  usePresence();

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const handleChallengeClick = (friend: Friend) => {
    // TODO: Implement challenge modal
    console.log('Challenge friend:', friend);
  };

  const renderActivity = (activity: FriendActivity) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'quiz_completed':
          return <Trophy className="h-4 w-4 text-blue-500" />;
        case 'achievement_unlocked':
          return <Award className="h-4 w-4 text-yellow-500" />;
        case 'challenge_sent':
          return <GamepadIcon className="h-4 w-4 text-purple-500" />;
        case 'challenge_completed':
          return <Trophy className="h-4 w-4 text-green-500" />;
        case 'level_up':
          return <TrendingUp className="h-4 w-4 text-orange-500" />;
        default:
          return <Activity className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
      <div key={activity.id} className="flex items-start gap-3 p-4 border-b border-border/50 last:border-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={activity.userAvatarUrl} alt={activity.userDisplayName} />
          <AvatarFallback>
            {activity.userDisplayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getActivityIcon(activity.type)}
            <span className="font-medium">{activity.userDisplayName}</span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="text-sm">
            <div className="font-medium mb-1">{activity.title}</div>
            <div className="text-muted-foreground">{activity.description}</div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Heart className="h-3 w-3" />
              <span>{activity.likes}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <MessageCircle className="h-3 w-3" />
              <span>{activity.comments}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background min-h-screen"
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Hub
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with friends, challenge them to quizzes, and share your achievements in the community.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Friends List */}
          <div className="lg:col-span-2">
            <FriendsList
              onFriendClick={handleFriendClick}
              onChallengeClick={handleChallengeClick}
            />
          </div>

          {/* Activity Feed & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" disabled>
                  <Trophy className="h-4 w-4 mr-2" />
                  Start Live Challenge
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Coming Soon
                  </Badge>
                </Button>
                
                <Button className="w-full justify-start" variant="outline" disabled>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Group Chat
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Coming Soon
                  </Badge>
                </Button>
                
                <Button className="w-full justify-start" variant="outline" disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Tournament
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Coming Soon
                  </Badge>
                </Button>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Friend Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {activitiesLoading ? (
                  <div className="space-y-4 p-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {activities.map(renderActivity)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      Add friends to see their quiz activities and achievements
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Friend Profile */}
            {selectedFriend && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Friend Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedFriend.avatarUrl} alt={selectedFriend.displayName} />
                        <AvatarFallback>
                          {selectedFriend.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {selectedFriend.isOnline && (
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedFriend.displayName}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">Level {selectedFriend.level}</Badge>
                        <span>•</span>
                        <span>
                          Friends since {formatDistanceToNow(new Date(selectedFriend.friendsSince), { addSuffix: false })} ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedFriend.showStats && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedFriend.totalQuizzes}</div>
                        <div className="text-sm text-muted-foreground">Quizzes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{Math.round(selectedFriend.averageScore || 0)}%</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleChallengeClick(selectedFriend)}
                      disabled={!selectedFriend.allowChallenges}
                      className="flex-1"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Challenge
                    </Button>
                    <Button size="sm" variant="outline" disabled className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Coming Soon Features */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <GamepadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">Live Multiplayer</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time quiz competitions with friends
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">Group Chats</h3>
                <p className="text-sm text-muted-foreground">
                  Chat rooms for quiz discussions
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">Tournaments</h3>
                <p className="text-sm text-muted-foreground">
                  Scheduled competitions and leagues
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}