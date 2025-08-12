'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { useCSRFToken } from '@/app/hooks/useCSRFToken';
import { handleAuthError } from '@/app/lib/errors/enhancedErrorHandling';
import { EnhancedErrorHandler } from '@/app/components/errors/EnhancedErrorHandler';
import { sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirebaseAuth } from '@/app/lib/firebase';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';

interface PasswordResetFormProps {
  onBack?: () => void;
  onSuccess?: (email: string) => void;
  initialEmail?: string;
}

const emailSchema = z.string().email('Please enter a valid email address');

export function PasswordResetForm({ onBack, onSuccess, initialEmail = '' }: PasswordResetFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  
  const { token: csrfToken, isLoading: csrfLoading } = useCSRFToken();

  // Cooldown timer
  useState(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  });

  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid email';
      }
      return 'Invalid email';
    }
  };

  const handlePasswordReset = async () => {
    const validationError = validateEmail(email);
    if (validationError) {
      setEnhancedError({
        type: 'validation',
        message: validationError,
        retryable: false,
        timestamp: Date.now()
      });
      return;
    }

    try {
      setIsLoading(true);
      setEnhancedError(null);
      
      const auth = initializeFirebaseAuth();
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth/reset-password`,
        handleCodeInApp: false,
      });
      
      setSuccess(true);
      setResendCount(prev => prev + 1);
      setCooldown(60); // 60 second cooldown
      onSuccess?.(email);
      
    } catch (error) {
      console.error('Password reset error:', error);
      const enhancedErr = await handleAuthError(error, handlePasswordReset);
      setEnhancedError(enhancedErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePasswordReset();
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await handlePasswordReset();
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-gray-600 mt-2">
            We've sent password reset instructions to:
          </p>
          <p className="font-medium text-gray-900 mt-1">{email}</p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>
                Click the link in the email to reset your password. 
                The link will expire in 24 hours for security.
              </p>
              <p className="text-sm text-gray-600">
                Don't see the email? Check your spam folder or try resending.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full"
          >
            {cooldown > 0 
              ? `Resend in ${cooldown}s` 
              : `Resend Email ${resendCount > 1 ? `(${resendCount})` : ''}`
            }
          </Button>
          
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CSRF Protection */}
        {csrfToken && (
          <input type="hidden" name="csrf-token" value={csrfToken} />
        )}

        {/* Enhanced Error Display */}
        {enhancedError && (
          <EnhancedErrorHandler 
            error={enhancedError}
            onRetry={enhancedError.retryable ? handlePasswordReset : undefined}
            onDismiss={() => setEnhancedError(null)}
            className="mb-4"
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-email">Email Address</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || csrfLoading || !csrfToken || !email.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Sending Reset Email...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Reset Email
            </>
          )}
        </Button>

        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        )}
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <button
            type="button"
            onClick={onBack}
            className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
            disabled={isLoading}
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}

/**
 * Standalone Password Reset Page Component
 */
export function PasswordResetPage() {
  const [showForm, setShowForm] = useState(true);
  const [resetEmail, setResetEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {showForm ? (
            <PasswordResetForm
              onBack={() => window.history.back()}
              onSuccess={(email) => {
                setResetEmail(email);
                setShowForm(false);
              }}
            />
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Email Sent!</h2>
              <p className="text-gray-600">
                Password reset instructions have been sent to {resetEmail}
              </p>
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="mt-4"
              >
                Send Another Email
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}