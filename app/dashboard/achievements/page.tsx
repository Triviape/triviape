'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Trophy, Star, Award, Medal, Target, Zap, BookOpen, Users } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: 'gameplay' | 'knowledge' | 'social' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export default function AchievementsPage() {
  const achievements: Achievement[] = [
    {
      id: 'first-win',
      title: 'First Victory',
      description: 'Win your first trivia game',
      icon: <Trophy size={24} />,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      category: 'gameplay',
      rarity: 'common'
    },
    {
      id: 'win-streak',
      title: 'On Fire',
      description: 'Win 5 games in a row',
      icon: <Zap size={24} />,
      progress: 3,
      maxProgress: 5,
      unlocked: false,
      category: 'gameplay',
      rarity: 'uncommon'
    },
    {
      id: 'perfect-score',
      title: 'Perfect Score',
      description: 'Answer all questions correctly in a game',
      icon: <Star size={24} />,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      category: 'gameplay',
      rarity: 'rare'
    },
    {
      id: 'history-buff',
      title: 'History Buff',
      description: 'Answer 50 history questions correctly',
      icon: <BookOpen size={24} />,
      progress: 32,
      maxProgress: 50,
      unlocked: false,
      category: 'knowledge',
      rarity: 'uncommon'
    },
    {
      id: 'team-player',
      title: 'Team Player',
      description: 'Participate in 10 team games',
      icon: <Users size={24} />,
      progress: 4,
      maxProgress: 10,
      unlocked: false,
      category: 'social',
      rarity: 'common'
    },
    {
      id: 'daily-streak',
      title: 'Consistency is Key',
      description: 'Complete daily challenges for 7 consecutive days',
      icon: <Target size={24} />,
      progress: 5,
      maxProgress: 7,
      unlocked: false,
      category: 'special',
      rarity: 'uncommon'
    },
    {
      id: 'trivia-master',
      title: 'Trivia Master',
      description: 'Reach level 20',
      icon: <Award size={24} />,
      progress: 12,
      maxProgress: 20,
      unlocked: false,
      category: 'gameplay',
      rarity: 'epic'
    },
    {
      id: 'champion',
      title: 'Champion',
      description: 'Win 100 games',
      icon: <Medal size={24} />,
      progress: 24,
      maxProgress: 100,
      unlocked: false,
      category: 'gameplay',
      rarity: 'legendary'
    }
  ];
  
  const rarityColors = {
    common: 'bg-slate-200 text-slate-800',
    uncommon: 'bg-green-200 text-green-800',
    rare: 'bg-blue-200 text-blue-800',
    epic: 'bg-purple-200 text-purple-800',
    legendary: 'bg-amber-200 text-amber-800'
  };
  
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const inProgressAchievements = achievements.filter(a => !a.unlocked);
  
  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Achievements</h1>
        <div className="mt-2 md:mt-0">
          <span className="text-muted-foreground mr-2">Unlocked:</span>
          <span className="font-bold">{unlockedAchievements.length} / {achievements.length}</span>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <AchievementCard 
                key={achievement.id} 
                achievement={achievement} 
                rarityColors={rarityColors}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="unlocked">
          {unlockedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {unlockedAchievements.map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  rarityColors={rarityColors}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No achievements unlocked yet. Keep playing to earn your first achievement!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress">
          {inProgressAchievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inProgressAchievements.map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  rarityColors={rarityColors}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">You've unlocked all available achievements. Congratulations!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AchievementCard({ 
  achievement, 
  rarityColors 
}: { 
  achievement: Achievement; 
  rarityColors: Record<string, string>;
}) {
  const progressPercentage = Math.round((achievement.progress / achievement.maxProgress) * 100);
  
  return (
    <Card className={achievement.unlocked ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${achievement.unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {achievement.icon}
            </div>
            <div>
              <CardTitle className="text-lg">{achievement.title}</CardTitle>
              <CardDescription>{achievement.description}</CardDescription>
            </div>
          </div>
          <Badge className={rarityColors[achievement.rarity]}>
            {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>{achievement.unlocked ? 'Completed' : 'Progress'}</span>
            <span>{achievement.progress} / {achievement.maxProgress}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
} 