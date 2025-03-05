import React from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function DailyQuizPage() {
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background"
    >
      <div className="py-8 flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Daily Quiz</h1>
        <p className="text-muted-foreground">
          Coming soon! This page will feature daily quizzes with new challenges every day.
        </p>
        
        <Link href="/">
          <Button variant="outline">
            Back to Home
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
} 