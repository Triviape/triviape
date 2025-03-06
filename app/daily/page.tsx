import React from 'react';
import { AppLayout } from '@/app/components/layouts/app-layout';
import { Navbar } from '@/app/components/navigation/navbar';
import { DailyQuizCard } from '@/app/components/daily/daily-quiz-card';

export default function DailyQuizPage() {
  return (
    <AppLayout
      header={<Navbar />}
      className="bg-background"
    >
      <div className="py-8 flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Daily Quiz</h1>
        <DailyQuizCard />
      </div>
    </AppLayout>
  );
} 