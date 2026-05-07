import { Suspense } from 'react';
import QuizResultsPageClient from './QuizResultsPageClient';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <QuizResultsPageClient />
    </Suspense>
  );
}
