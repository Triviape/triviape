'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { VirtualizedLeaderboard } from '@/app/components/leaderboard/VirtualizedLeaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  Globe, 
  Users, 
  TrendingUp,
  Settings,
  Zap,
  Filter
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { 
  LeaderboardPeriod, 
  LeaderboardType, 
  LeaderboardFilters,
  EnhancedLeaderboardEntry 
} from '@/app/types/leaderboard';
import { useAuth } from '@/app/hooks/useAuth';

interface PeriodOption {
  value: LeaderboardPeriod;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface TypeOption {
  value: LeaderboardType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  {
    value: 'daily',
    label: 'Today',
    icon: <Clock className="h-4 w-4" />,
    description: 'Rankings for today\'s quizzes'
  },
  {
    value: 'weekly',
    label: 'This Week',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Weekly rankings'
  },
  {
    value: 'monthly',
    label: 'This Month',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Monthly rankings'
  },
  {
    value: 'all-time',
    label: 'All Time',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'All-time rankings'
  }
];

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: 'global',
    label: 'Global',
    icon: <Globe className="h-4 w-4" />,
    description: 'Compete with everyone'
  },
  {
    value: 'friends',
    label: 'Friends',
    icon: <Users className="h-4 w-4" />,
    description: 'See how you rank among friends'
  },
  {
    value: 'category',
    label: 'Category',
    icon: <Filter className="h-4 w-4" />,
    description: 'Category-specific rankings'
  }
];

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('daily');
  const [selectedType, setSelectedType] = useState<LeaderboardType>('global');
  const [enableRealTime, setEnableRealTime] = useState(true);
  const [filters, setFilters] = useState<LeaderboardFilters>({});

  const handleEntryClick = (entry: EnhancedLeaderboardEntry) => {
    // Handle clicking on a leaderboard entry
    // Could navigate to user profile, show details, etc.
    console.log('Clicked entry:', entry);
  };

  const getCurrentUserFilters = (): LeaderboardFilters => {
    return {
      ...filters,
      userId: currentUser?.uid
    };
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
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Leaderboard
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compete with players around the world and see how you rank in various quiz categories and time periods.
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Leaderboard Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Period Selection */}
            <div className="space-y-3">
              <h3 className="font-medium">Time Period</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PERIOD_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedPeriod === option.value ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col gap-2"
                    onClick={() => setSelectedPeriod(option.value)}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-3">
              <h3 className="font-medium">Leaderboard Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedType === option.value ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col gap-2"
                    onClick={() => setSelectedType(option.value)}
                    disabled={option.value === 'friends'} // TODO: Enable when friends system is implemented
                  >
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                      {option.value === 'friends' && (
                        <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Real-time Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Real-time Updates</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get live updates as new scores are posted
                </p>
              </div>
              <Button
                variant={enableRealTime ? "default" : "outline"}
                size="sm"
                onClick={() => setEnableRealTime(!enableRealTime)}
              >
                {enableRealTime ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="my-stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              My Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* Main Leaderboard */}
            <VirtualizedLeaderboard
              type={selectedType}
              period={selectedPeriod}
              filters={getCurrentUserFilters()}
              height={600}
              enableRealTime={enableRealTime}
              showStats={true}
              onEntryClick={handleEntryClick}
              className="shadow-lg"
            />
          </TabsContent>

          <TabsContent value="my-stats" className="space-y-6">
            {/* User Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Your Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Personal Statistics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Track your progress, view detailed analytics, and see your improvement over time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
                <Trophy className="h-6 w-6" />
                <span className="font-medium">Take Daily Quiz</span>
                <span className="text-sm text-muted-foreground">Climb the daily rankings</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" disabled>
                <Users className="h-6 w-6" />
                <span className="font-medium">Challenge Friends</span>
                <span className="text-sm text-muted-foreground">Coming soon</span>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" disabled>
                <Zap className="h-6 w-6" />
                <span className="font-medium">Live Competitions</span>
                <span className="text-sm text-muted-foreground">Coming soon</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}