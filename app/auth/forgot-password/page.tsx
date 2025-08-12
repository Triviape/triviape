'use client';

import { PasswordResetForm } from '@/app/components/auth/PasswordResetForm';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <PasswordResetForm
            onBack={() => router.push('/auth')}
            onSuccess={(email) => {
              // Success is handled by the form itself
              console.log('Password reset email sent to:', email);
            }}
          />
        </div>
      </div>
    </div>
  );
}