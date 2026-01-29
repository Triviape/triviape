'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { 
  Trophy, 
  Swords, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Play,
  Crown,
  Target,
  Timer,
  Send,
  AlertCircle,
  Loader2,
  ArrowRight,
  History,
  Zap
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useChallenges, useFriends } from '@/app/hooks/useFriends';
import { useAuth } from '@/app/hooks/useAuth';
import { Challenge, Friend } from '@/app/types/social';
import { formatDistanceToNow, format, isAfter, parseISO } from 'date-fns';

export default function ChallengePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { friends, isLoading: friendsLoading } = useFriends();
  const {
    sentChallenges,
    receivedChallenges,
    pendingReceived,
    activeChallenges,
    completedChallenges,
    isLoading: challengesLoading,
    sendChallenge,
    respondToChallenge,
    cancelChallenge,
    isSending,
    isResponding,
    isCanceling,
  } = useChallenges();

  const [selectedTab, setSelectedTab] = useState('active');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  const [challengeMessage, setChallengeMessage] = useState('');
  const [selectedQuizId] = useState('daily'); // Default to daily quiz for now

  // Calculate stats
  const stats = useMemo(() => {
    const completed = completedChallenges || [];
    const wins = completed.filter(c => c.winner === currentUser?.uid).length;
    const losses = completed.filter(c => c.winner !== currentUser?.uid && c.winner !== 'tie').length;
    const ties = completed.filter(c => c.winner === 'tie').length;
    const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

    return {
      active: activeChallenges?.length || 0,
      pending: pendingReceived?.length || 0,
      wins,
      losses,
      ties,
      winRate,
      total: completed.length,
    };
  }, [activeChallenges, pendingReceived, completedChallenges, currentUser?.uid]);

  const handleSendChallenge = async () => {
    if (!selectedFriend) return;
    
    try {
      await sendChallenge({
        toUserId: selectedFriend,
        quizId: selectedQuizId,
        message: challengeMessage || undefined,
      });
      setCreateDialogOpen(false);
      setSelectedFriend('');
      setChallengeMessage('');
    } catch (error) {
      console.error('Error sending challenge:', error);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await respondToChallenge({ challengeId, response: 'accepted' });
    } catch (error) {
      console.error('Error accepting challenge:', error);
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await respondToChallenge({ challengeId, response: 'declined' });
    } catch (error) {
      console.error('Error declining challenge:', error);
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    try {
      await cancelChallenge(challengeId);
    } catch (error) {
      console.error('Error canceling challenge:', error);
    }
  };

  const handlePlayChallenge = (challenge: Challenge) => {
    // Navigate to quiz with challenge context
    router.push(`/quiz/${challenge.quizId}?challengeId=${challenge.id}`);
  };

  const getStatusBadge = (challenge: Challenge) => {
    const isExpired = isAfter(new Date(), parseISO(challenge.expiresAt));
    
    if (isExpired && challenge.status === 'pending') {
      return <Badge variant="secondary">Expired</Badge>;
    }

    switch (challenge.status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>;
      case 'accepted':
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-500 text-white">Completed</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return null;
    }
  };

  const getWinnerBadge = (challenge: Challenge) => {
    if (challenge.status !== 'completed' || !challenge.winner) return null;
    
    if (challenge.winner === 'tie') {
      return <Badge variant="outline">Tie</Badge>;
    }
    
    const isWinner = challenge.winner === currentUser?.uid;
    return (
      <Badge className={cn(
        isWinner ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-200 text-gray-700'
      )}>
        {isWinner ? (
          <><Crown className="h-3 w-3 mr-1" /> Won</>
        ) : (
          'Lost'
        )}
      </Badge>
    );
  };

  const renderChallengeCard = (challenge: Challenge, type: 'sent' | 'received') => {
    const otherUser = type === 'sent' 
      ? { name: challenge.toUserDisplayName, id: challenge.toUserId }
      : { name: challenge.fromUserDisplayName, id: challenge.fromUserId };
    
    const isPending = challenge.status === 'pending';
    const isActive = challenge.status === 'in_progress' || challenge.status === 'accepted';
    const isCompleted = challenge.status === 'completed';
    const isExpired = isAfter(new Date(), parseISO(challenge.expiresAt));
    
    // Determine if current user has submitted their score
    const userScore = type === 'sent' ? challenge.fromUserScore : challenge.toUserScore;
    const hasSubmitted = userScore !== undefined;

    return (
      <Card key={challenge.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {otherUser.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold truncate">{otherUser.name}</span>
                {getStatusBadge(challenge)}
                {getWinnerBadge(challenge)}
              </div>
              
              <div className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">{challenge.quizTitle}</span>
              </div>

              {challenge.message && (
                <p className="text-sm text-muted-foreground italic mb-2">
                  "{challenge.message}"
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(parseISO(challenge.createdAt), { addSuffix: true })}
                </div>
                {!isCompleted && !isExpired && (
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    Expires {formatDistanceToNow(parseISO(challenge.expiresAt), { addSuffix: true })}
                  </div>
                )}
              </div>

              {/* Scores for completed challenges */}
              {isCompleted && (
                <div className="flex items-center gap-4 mt-3 p-2 bg-muted/50 rounded-lg">
                  <div className="text-center flex-1">
                    <div className="text-xs text-muted-foreground">
                      {type === 'sent' ? 'You' : otherUser.name}
                    </div>
                    <div className="text-lg font-bold">
                      {type === 'sent' ? challenge.fromUserScore : challenge.toUserScore}%
                    </div>
                  </div>
                  <div className="text-muted-foreground">vs</div>
                  <div className="text-center flex-1">
                    <div className="text-xs text-muted-foreground">
                      {type === 'sent' ? otherUser.name : 'You'}
                    </div>
                    <div className="text-lg font-bold">
                      {type === 'sent' ? challenge.toUserScore : challenge.fromUserScore}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Received pending challenge */}
              {type === 'received' && isPending && !isExpired && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptChallenge(challenge.id)}
                    disabled={isResponding}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineChallenge(challenge.id)}
                    disabled={isResponding}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </>
              )}

              {/* Sent pending challenge - can cancel */}
              {type === 'sent' && isPending && !isExpired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelChallenge(challenge.id)}
                  disabled={isCanceling}
                >
                  Cancel
                </Button>
              )}

              {/* Active challenge - can play */}
              {isActive && !hasSubmitted && (
                <Button
                  size="sm"
                  onClick={() => handlePlayChallenge(challenge)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </Button>
              )}

              {/* Active but already submitted */}
              {isActive && hasSubmitted && (
                <Badge variant="outline" className="whitespace-nowrap">
                  <Clock className="h-3 w-3 mr-1" />
                  Waiting...
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = friendsLoading || challengesLoading;

  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background min-h-screen"
    >
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500">
              <Swords className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Challenge Arena
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test your knowledge against friends in head-to-head trivia battles!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold">{stats.winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Challenge Button */}
        <div className="flex justify-center">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Swords className="h-5 w-5" />
                Challenge a Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Challenge</DialogTitle>
                <DialogDescription>
                  Select a friend to challenge to a trivia battle
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Friend</label>
                  <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a friend..." />
                    </SelectTrigger>
                    <SelectContent>
                      {friends?.filter(f => f.allowChallenges).map(friend => (
                        <SelectItem key={friend.userId} value={friend.userId}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={friend.avatarUrl} />
                              <AvatarFallback>
                                {friend.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {friend.displayName}
                            {friend.isOnline && (
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {friends?.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No friends yet. <Link href="/social" className="text-primary underline">Add some friends</Link> first!
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message (optional)</label>
                  <Textarea
                    placeholder="Add a friendly taunt..."
                    value={challengeMessage}
                    onChange={(e) => setChallengeMessage(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendChallenge}
                  disabled={!selectedFriend || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Challenge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Challenges Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="gap-2">
              <Zap className="h-4 w-4" />
              Active
              {(stats.active + stats.pending) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.active + stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Active Challenges */}
          <TabsContent value="active" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Pending Received */}
                {pendingReceived.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Waiting for Your Response ({pendingReceived.length})
                    </h3>
                    {pendingReceived.map(challenge => renderChallengeCard(challenge, 'received'))}
                  </div>
                )}

                {/* Active In Progress */}
                {activeChallenges.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      In Progress ({activeChallenges.length})
                    </h3>
                    {activeChallenges.map(challenge => {
                      const type = challenge.fromUserId === currentUser?.uid ? 'sent' : 'received';
                      return renderChallengeCard(challenge, type);
                    })}
                  </div>
                )}

                {/* Empty State */}
                {pendingReceived.length === 0 && activeChallenges.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Swords className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Active Challenges</h3>
                      <p className="text-muted-foreground mb-4">
                        Challenge a friend to start a trivia battle!
                      </p>
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Swords className="h-4 w-4 mr-2" />
                        Create Challenge
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Sent Challenges */}
          <TabsContent value="sent" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sentChallenges.length > 0 ? (
              <div className="space-y-3">
                {sentChallenges.map(challenge => renderChallengeCard(challenge, 'sent'))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Sent Challenges</h3>
                  <p className="text-muted-foreground">
                    You haven't challenged anyone yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : completedChallenges.length > 0 ? (
              <div className="space-y-3">
                {completedChallenges
                  .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                  .map(challenge => {
                    const type = challenge.fromUserId === currentUser?.uid ? 'sent' : 'received';
                    return renderChallengeCard(challenge, type);
                  })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Challenge History</h3>
                  <p className="text-muted-foreground">
                    Complete some challenges to see your battle history!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 