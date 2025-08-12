'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Trophy, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Zap,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useFriends, useFriendRequests, useFriendSearch, useFriendStats } from '@/app/hooks/useFriends';
import { Friend, FriendRequest } from '@/app/types/social';
import { formatDistanceToNow } from 'date-fns';

interface FriendsListProps {
  className?: string;
  onFriendClick?: (friend: Friend) => void;
  onChallengeClick?: (friend: Friend) => void;
}

export function FriendsList({ 
  className, 
  onFriendClick, 
  onChallengeClick 
}: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('friends');

  const { 
    friends, 
    onlineFriends, 
    offlineFriends, 
    isLoading: friendsLoading 
  } = useFriends();

  const {
    sentRequests,
    receivedRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    isSending,
    isAccepting,
    isDeclining
  } = useFriendRequests();

  const { 
    data: searchResults, 
    isLoading: searchLoading 
  } = useFriendSearch(searchQuery, searchQuery.length >= 2);

  const stats = useFriendStats();

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest({ toUserId: userId });
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptRequest(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineRequest(requestId);
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const renderFriend = (friend: Friend) => (
    <div
      key={friend.userId}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onFriendClick?.(friend)}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={friend.avatarUrl} alt={friend.displayName} />
          <AvatarFallback>
            {friend.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {friend.isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{friend.displayName}</span>
          <Badge variant="outline" className="text-xs">
            Level {friend.level}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {friend.isOnline ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span>Online</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>
                  {friend.lastSeen 
                    ? formatDistanceToNow(new Date(friend.lastSeen), { addSuffix: true })
                    : 'Offline'
                  }
                </span>
              </>
            )}
          </div>
          
          {friend.showStats && (
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{Math.round(friend.averageScore || 0)}% avg</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onChallengeClick?.(friend);
          }}
          disabled={!friend.allowChallenges}
        >
          <Trophy className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement messaging
          }}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderFriendRequest = (request: FriendRequest, type: 'sent' | 'received') => (
    <div
      key={request.id}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage 
          src={type === 'sent' ? request.toUserAvatarUrl : request.fromUserAvatarUrl} 
          alt={type === 'sent' ? request.toUserDisplayName : request.fromUserDisplayName} 
        />
        <AvatarFallback>
          {(type === 'sent' ? request.toUserDisplayName : request.fromUserDisplayName)
            .slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {type === 'sent' ? request.toUserDisplayName : request.fromUserDisplayName}
        </div>
        <div className="text-sm text-muted-foreground">
          {type === 'sent' ? 'Request sent' : 'Request received'} •{' '}
          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
        </div>
        {request.message && (
          <div className="text-sm text-muted-foreground mt-1 italic">
            "{request.message}"
          </div>
        )}
      </div>

      {type === 'received' && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleAcceptRequest(request.id)}
            disabled={isAccepting}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeclineRequest(request.id)}
            disabled={isDeclining}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderSearchResult = (result: any) => (
    <div
      key={result.userId}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={result.avatarUrl} alt={result.displayName} />
        <AvatarFallback>
          {result.displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{result.displayName}</div>
        <div className="text-sm text-muted-foreground">
          {result.mutualFriends > 0 && (
            <span>{result.mutualFriends} mutual friends</span>
          )}
        </div>
      </div>

      <div>
        {result.isAlreadyFriend ? (
          <Badge variant="secondary">Friends</Badge>
        ) : result.hasPendingRequest ? (
          <Badge variant="outline">
            {result.requestFromCurrentUser ? 'Request Sent' : 'Request Received'}
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => handleSendRequest(result.userId)}
            disabled={isSending}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Friend
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends & Social
        </CardTitle>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalFriends}</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              {stats.onlineFriends}
            </div>
            <div className="text-sm text-muted-foreground">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <div className="text-sm text-muted-foreground">Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.activeChallenges}</div>
            <div className="text-sm text-muted-foreground">Challenges</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {(sentRequests.length + receivedRequests.length > 0) && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {sentRequests.length + receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search">Find Friends</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {friendsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your network by searching for friends!
                </p>
                <Button onClick={() => setSelectedTab('search')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </div>
            ) : (
              <>
                {onlineFriends.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      Online ({onlineFriends.length})
                    </h4>
                    {onlineFriends.map(renderFriend)}
                  </div>
                )}
                
                {offlineFriends.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Offline ({offlineFriends.length})
                    </h4>
                    {offlineFriends.map(renderFriend)}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {receivedRequests.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Received Requests ({receivedRequests.length})
                </h4>
                {receivedRequests.map(request => renderFriendRequest(request, 'received'))}
              </div>
            )}

            {sentRequests.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  Sent Requests ({sentRequests.length})
                </h4>
                {sentRequests.map(request => renderFriendRequest(request, 'sent'))}
              </div>
            )}

            {receivedRequests.length === 0 && sentRequests.length === 0 && (
              <div className="text-center py-8">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No friend requests</h3>
                <p className="text-muted-foreground">
                  Send friend requests to connect with other players
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for friends by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {searchQuery.length >= 2 && (
              <div className="space-y-3">
                {searchLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map(renderSearchResult)
                ) : (
                  <div className="text-center py-4">
                    <div className="text-muted-foreground">
                      No users found matching "{searchQuery}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {searchQuery.length < 2 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Search for Friends</h3>
                <p className="text-muted-foreground">
                  Enter at least 2 characters to start searching
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}