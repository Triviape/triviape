"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/hooks/useAuth';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { currentUser, signOut } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true on client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleShare = () => {
    if (!isMounted) return;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Triviape - The Ultimate Trivia Game',
        text: 'Check out Triviape - The Ultimate Trivia Game!',
        url: window.location.href,
      })
        .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert('Share this page: ' + window.location.href);
    }
  };
  
  return (
    <nav className={cn(
      "w-full py-3 flex items-center justify-between",
      className
    )}>
      {/* Logo/Brand */}
      <div className="flex items-center">
        <Link href="/" className="text-xl font-bold">
          Triviape
        </Link>
      </div>
      
      {/* Navigation Actions */}
      <div className="flex items-center gap-3">
        {/* Only render interactive elements after client-side hydration */}
        {isMounted ? (
          <>
            {/* Share Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
            >
              Share
            </Button>
            
            {/* Auth Buttons */}
            {currentUser ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut.mutate()}
              >
                Sign Out
              </Button>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm">
                  Sign In/Up
                </Button>
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Static placeholders for server-side rendering */}
            <div className="h-9 px-3 rounded-md border border-input bg-transparent inline-flex items-center justify-center">
              Share
            </div>
            <div className="h-9 px-3 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center">
              Sign In/Up
            </div>
          </>
        )}
      </div>
    </nav>
  );
} 