'use client';

import React from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';

export default function PerformancePage() {
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background min-h-screen"
    >
      <div className="container mx-auto px-4 py-8">
        <h1>Performance Monitoring</h1>
        <p>Performance monitoring page content</p>
      </div>
    </AppLayout>
  );
}