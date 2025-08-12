"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  HelpCircle,
  BarChart,
  TrendingUp,
  UserPlus,
  Gamepad2,
  Activity
} from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ href, icon, label, isActive }: SidebarItemProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "hover:bg-muted"
      )}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      label: 'Overview'
    },
    {
      href: '/dashboard/stats',
      icon: <BarChart size={18} />,
      label: 'Statistics'
    },
    {
      href: '/dashboard/achievements',
      icon: <Trophy size={18} />,
      label: 'Achievements'
    },
    {
      href: '/leaderboard',
      icon: <TrendingUp size={18} />,
      label: 'Leaderboard'
    },
    {
      href: '/social',
      icon: <UserPlus size={18} />,
      label: 'Social Hub'
    },
    {
      href: '/multiplayer',
      icon: <Gamepad2 size={18} />,
      label: 'Multiplayer'
    },
    {
      href: '/team',
      icon: <Users size={18} />,
      label: 'Teams'
    },
    {
      href: '/daily',
      icon: <Calendar size={18} />,
      label: 'Daily Challenges'
    },
    {
      href: '/performance',
      icon: <Activity size={18} />,
      label: 'Performance'
    },
    {
      href: '/settings',
      icon: <Settings size={18} />,
      label: 'Settings'
    },
    {
      href: '/help',
      icon: <HelpCircle size={18} />,
      label: 'Help & Support'
    }
  ];
  
  return (
    <div className="space-y-6 py-2">
      <div className="px-3 py-2">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage your trivia journey</p>
      </div>
      
      <div className="space-y-1 px-1">
        {navItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </div>
  );
} 