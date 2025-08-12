'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  TrendingUp, 
  Clock, 
  Users,
  Zap,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useEnhancedLeaderboard, useLeaderboardStats } from '@/app/hooks/useEnhancedLeaderboard';
import { 
  EnhancedLeaderboardEntry, 
  LeaderboardPeriod, 
  LeaderboardType, 
  LeaderboardFilters 
} from '@/app/types/leaderboard';
import { formatDistanceToNow } from 'date-fns';

interface VirtualizedLeaderboardProps {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  filters?: LeaderboardFilters;
  height?: number;
  enableRealTime?: boolean;
  showStats?: boolean;
  onEntryClick?: (entry: EnhancedLeaderboardEntry) => void;
  className?: string;
}

const ITEM_HEIGHT = 72; // Height of each leaderboard entry
const OVERSCAN = 5; // Number of items to render outside visible area

/**
 * Virtualized leaderboard component for optimal performance with large datasets
 */
export function VirtualizedLeaderboard({
  type,
  period,
  filters = {},
  height = 600,
  enableRealTime = false,
  showStats = true,
  onEntryClick,
  className
}: VirtualizedLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced leaderboard hook with infinite query
  const {
    allEntries,
    hasNextPage,
    loadMore,
    isLoading,
    isLoadingMore,
    error,
    isRealTimeConnected,
    refresh,
    totalCount
  } = useEnhancedLeaderboard(type, period, filters, {
    realtime: enableRealTime
  });

  // Stats hook
  const { data: stats } = useLeaderboardStats(period, {
    enabled: showStats
  });

  // Intersection observer for infinite loading
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Load more when in view
  React.useEffect(() => {
    if (inView && hasNextPage && !isLoadingMore) {
      loadMore();
    }
  }, [inView, hasNextPage, isLoadingMore, loadMore]);

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return allEntries;
    
    return allEntries.filter(entry =>
      entry.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allEntries, searchQuery]);

  // Virtual container ref
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Virtualizer
  const virtualizer = useVirtualizer({
    count: filteredEntries.length + (hasNextPage ? 1 : 0), // +1 for loading row
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: OVERSCAN,
  });

  const items = virtualizer.getVirtualItems();

  // Render leaderboard entry
  const renderEntry = useCallback((entry: EnhancedLeaderboardEntry, index: number) => {
    const isTopThree = entry.rank <= 3;
    const isCurrentUser = entry.isCurrentUser;
    const isFriend = entry.isFriend;

    const getRankIcon = (rank: number) => {
      switch (rank) {
        case 1:
          return <Crown className="h-6 w-6 text-yellow-500" />;
        case 2:
          return <Trophy className="h-6 w-6 text-gray-400" />;
        case 3:
          return <Medal className="h-6 w-6 text-amber-600" />;
        default:
          return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
      }
    };

    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 70) return 'text-blue-600';
      if (score >= 50) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div
        key={entry.id}
        className={cn(
          'flex items-center gap-4 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer',
          isCurrentUser && 'bg-primary/5 border-primary/20',
          isTopThree && 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20'
        )}
        onClick={() => onEntryClick?.(entry)}
      >
        {/* Rank */}
        <div className="flex items-center justify-center w-12 h-12">
          {getRankIcon(entry.rank)}
        </div>

        {/* Avatar and Name */}
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
            <AvatarFallback>
              {entry.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-medium truncate',
                isCurrentUser && 'text-primary font-semibold'
              )}>
                {entry.displayName}
              </span>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
              {isFriend && (
                <Badge variant="outline" className="text-xs">Friend</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(entry.completionTime)}</span>
              {entry.dateCompleted && (
                <span className="text-xs">
                  • {formatDistanceToNow(new Date(entry.dateCompleted), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="text-right">
          <div className={cn('text-xl font-bold', getScoreColor(entry.score))}>
            {entry.score}
          </div>
          <div className="text-xs text-muted-foreground">points</div>
        </div>
      </div>
    );
  }, [onEntryClick]);

  // Loading row
  const renderLoadingRow = () => (
    <div key="loading" className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-12" />
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Leaderboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <div className="text-destructive mb-2">Failed to load leaderboard</div>
            <Button onClick={() => refresh()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {type === 'global' ? 'Global' : type === 'friends' ? 'Friends' : 'Category'} Leaderboard
            {enableRealTime && (
              <Badge variant={isRealTimeConnected ? "default" : "secondary"} className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {isRealTimeConnected ? 'Live' : 'Offline'}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        {showStats && stats && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalPlayers.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Players
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(stats.averageScore)}</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.topScore}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Award className="h-3 w-3" />
                Top Score
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {showFilters && (
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Virtual List */}
        <div
          ref={parentRef}
          style={{ height }}
          className="overflow-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {items.map((virtualItem) => {
              const isLoadingItem = virtualItem.index >= filteredEntries.length;
              
              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {isLoadingItem ? (
                    <div ref={loadMoreRef}>
                      {renderLoadingRow()}
                    </div>
                  ) : (
                    renderEntry(filteredEntries[virtualItem.index], virtualItem.index)
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredEntries.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-muted-foreground">
              {searchQuery ? 'No players found matching your search' : 'No leaderboard entries yet'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}