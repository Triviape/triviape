'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Home,
  BookOpen,
  Trophy,
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {isOnline ? (
              <Wifi className="w-16 h-16 text-green-500" />
            ) : (
              <WifiOff className="w-16 h-16 text-red-500" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </CardTitle>
          
          <div className="flex justify-center mt-2">
            <Badge 
              variant={isOnline ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isOnline ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Great! You're back online. You can now access all features of Triviape.
              </p>
              
              {lastOnline && (
                <p className="text-sm text-gray-500">
                  Last online: {lastOnline.toLocaleTimeString()}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button onClick={handleGoHome} className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  It looks like you've lost your internet connection. 
                  Don't worry - you can still access some features offline!
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Available Offline:
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Previously loaded quizzes
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Your progress and stats
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      App settings
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/" prefetch={false}>
                    <Button variant="outline" className="w-full">
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  
                  <Link href="/daily" prefetch={false}>
                    <Button variant="outline" className="w-full">
                      <Trophy className="w-4 h-4 mr-2" />
                      Daily Quiz
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>
                  Check your internet connection and try again. 
                  Some features may be limited while offline.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 