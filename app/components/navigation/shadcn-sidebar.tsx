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
  Home,
  BookOpen,
  Gamepad2
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarInset
} from "@/app/components/ui/sidebar";

type SidebarNavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
};

export function ShadcnSidebar() {
  const pathname = usePathname();
  
  // Main navigation items
  const mainNavItems = [
    {
      href: '/',
      icon: <Home size={16} />,
      label: 'Home'
    },
    {
      href: '/dashboard',
      icon: <LayoutDashboard size={16} />,
      label: 'Dashboard'
    },
    {
      href: '/dashboard/stats',
      icon: <BarChart size={16} />,
      label: 'Statistics'
    },
    {
      href: '/dashboard/achievements',
      icon: <Trophy size={16} />,
      label: 'Achievements'
    }
  ];
  
  // Game-related navigation items
  const gameNavItems = [
    {
      href: '/quiz',
      icon: <BookOpen size={16} />,
      label: 'Quizzes'
    },
    {
      href: '/team',
      icon: <Users size={16} />,
      label: 'Teams'
    },
    {
      href: '/daily',
      icon: <Calendar size={16} />,
      label: 'Daily Challenge'
    },
    {
      href: '/challenge',
      icon: <Gamepad2 size={16} />,
      label: 'Challenges'
    }
  ];
  
  // Support navigation items
  const supportNavItems = [
    {
      href: '/settings',
      icon: <Settings size={16} />,
      label: 'Settings'
    },
    {
      href: '/help',
      icon: <HelpCircle size={16} />,
      label: 'Help & Support'
    }
  ];
  
  // Render navigation items
  const renderNavItems = (items: SidebarNavItem[]) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.href}
          tooltip={item.label}
        >
          <Link href={item.href} className="flex items-center gap-1.5 text-sm">
            {item.icon}
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };
  
  return (
    <SidebarProvider 
      defaultOpen={false}
      enableHover={true}
      hoverDelay={300}
    >
      {/* Add a hover trigger area at the edge of the screen */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-2 z-40 bg-transparent"
        onMouseEnter={() => {
          console.log("Edge hover triggered");
          // Use the global function to trigger the sidebar
          const win = window as any;
          if (win.__triggerSidebarHover) {
            win.__triggerSidebarHover();
          }
        }}
      />
      
      <Sidebar 
        collapsible="offcanvas" 
        variant="floating"
        className="z-50 shadow-lg transition-all duration-300 ease-in-out bg-gray-200 border-r"
      >
        <SidebarHeader className="px-2 py-2 border-b">
          {/* Removed the Triviape text */}
        </SidebarHeader>
        
        <SidebarContent className="bg-gray-200">
          {/* Main Navigation Group */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
              Main
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItems(mainNavItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Game Navigation Group */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
              Games
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItems(gameNavItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          {/* Support Navigation Group */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
              Support
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItems(supportNavItems)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="px-2 py-2 border-t">
          <div className="text-xs text-muted-foreground">
            © 2023 Kahuna Gaming
          </div>
        </SidebarFooter>
      </Sidebar>
      
      {/* Make sure the rail is visible */}
      <SidebarRail className="hover:bg-muted/10 bg-gray-200" />
      
      {/* Only show trigger on mobile */}
      <SidebarTrigger className="fixed bottom-4 right-4 z-50 md:hidden" />
      
      {/* Main content area - doesn't shift with sidebar */}
      <div className="flex-1 w-full">
        {/* Your page content goes here */}
      </div>
    </SidebarProvider>
  );
} 
