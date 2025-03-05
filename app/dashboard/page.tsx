'use client';

import React from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

export default function Dashboard() {
  const { profile } = useAuth();
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Game Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Game Statistics</CardTitle>
            <CardDescription>Your trivia performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Games Played</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Score</span>
                <span className="font-medium">720</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Games Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
            <CardDescription>Your latest trivia matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((game) => (
                <div key={game} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">Game #{game}</div>
                    <div className="text-sm text-muted-foreground">2 hours ago</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">Won</div>
                    <div className="text-sm">Score: 850</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump back into the game</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/challenge" className="w-full">
                <Button className="w-full">New Challenge</Button>
              </Link>
              <Link href="/daily" className="w-full">
                <Button variant="outline" className="w-full">Daily Trivia</Button>
              </Link>
              <Link href="/team" className="w-full">
                <Button variant="outline" className="w-full">Team Games</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 