import { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordPageClient from './ResetPasswordPageClient';

export const metadata: Metadata = {
  title: 'Reset Password | Triviape',
  description: 'Reset your Triviape account password.',
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
