"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/hooks/useAuth';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { 
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { currentUser, profile, signOut } = useAuth();
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

  // Get display name from profile or currentUser
  const displayName = profile?.displayName || currentUser?.displayName || 'User';
  
  // User dropdown menu for authenticated users
  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <span>{displayName}</span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User size={16} />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut.mutate()}
          className="flex items-center gap-2 cursor-pointer text-destructive"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
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
            
            {/* Auth Buttons or User Menu */}
            {currentUser ? (
              <UserMenu />
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