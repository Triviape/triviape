'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { DashboardSidebar } from '@/app/components/navigation/dashboard-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth?redirect=/dashboard');
    }
  }, [currentUser, isLoading, router]);
  
  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }
  
  if (!currentUser) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <AppLayout
      header={<Navbar />}
      sidebar={<DashboardSidebar />}
      className="bg-background"
    >
      {children}
    </AppLayout>
  );
} 