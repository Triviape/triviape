'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { useCSRFToken } from '@/app/hooks/useCSRFToken';
import { handleAuthError } from '@/app/lib/errors/enhancedErrorHandling';
import { EnhancedErrorHandler } from '@/app/components/errors/EnhancedErrorHandler';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { initializeFirebaseAuth } from '@/app/lib/firebase';
import { CheckCircle, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const confirmPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export default function ResetPasswordPageClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedError, setEnhancedError] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token: csrfToken, isLoading: csrfLoading } = useCSRFToken();

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  // Verify the reset code on component mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        setEnhancedError({
          type: 'validation',
          message: 'Invalid or missing password reset link. Please request a new password reset email.',
          retryable: false,
          timestamp: Date.now()
        });
        return;
      }

      try {
        const auth = initializeFirebaseAuth();
        const email = await verifyPasswordResetCode(auth, oobCode);
        setUserEmail(email);
        setIsValidCode(true);
      } catch (error) {
        console.error('Error verifying reset code:', error);
        setIsValidCode(false);
        const enhancedErr = await handleAuthError(error);
        setEnhancedError({
          ...enhancedErr,
          message: 'This password reset link is invalid or has expired. Please request a new one.',
          retryable: false
        });
      }
    };

    verifyCode();
  }, [oobCode, mode]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      /[a-z]/.test(password), // lowercase
      /[A-Z]/.test(password), // uppercase
      /\d/.test(password),    // numbers
      /[@$!%*?&]/.test(password), // special chars
      password.length >= 8,   // length
      password.length >= 12   // extra length bonus
    ];
    
    strength = checks.filter(Boolean).length;
    return {
      score: strength,
      label: strength < 3 ? 'Weak' : strength < 5 ? 'Medium' : 'Strong',
      color: strength < 3 ? 'text-red-500' : strength < 5 ? 'text-yellow-500' : 'text-green-500'
    };
  };

  const validatePasswords = () => {
    try {
      confirmPasswordSchema.parse({ password, confirmPassword });
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Password validation failed';
      }
      return 'Password validation failed';
    }
  };

  const handlePasswordReset = async () => {
    const validationError = validatePasswords();
    if (validationError) {
      setEnhancedError({
        type: 'validation',
        message: validationError,
        retryable: false,
        timestamp: Date.now()
      });
      return;
    }

    if (!oobCode) {
      setEnhancedError({
        type: 'validation',
        message: 'Invalid reset code. Please request a new password reset email.',
        retryable: false,
        timestamp: Date.now()
      });
      return;
    }

    try {
      setIsLoading(true);
      setEnhancedError(null);
      
      const auth = initializeFirebaseAuth();
      await confirmPasswordReset(auth, oobCode, password);
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth?message=password-reset-success');
      }, 3000);
      
    } catch (error) {
      console.error('Password reset confirmation error:', error);
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

  // Loading state while verifying code
  if (isValidCode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-lg shadow-md text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Password Reset Successful!</h2>
            <p className="text-gray-600">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <div className="text-sm text-gray-500">
              Redirecting to sign in page in 3 seconds...
            </div>
            <Button
              onClick={() => router.push('/auth')}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Invalid code state
  if (isValidCode === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-lg shadow-md">
            {enhancedError && (
              <EnhancedErrorHandler 
                error={enhancedError}
                onDismiss={() => setEnhancedError(null)}
                className="mb-6"
              />
            )}
            <div className="text-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
              <p className="text-gray-600">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full"
              >
                Request New Reset Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form state
  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
            <p className="text-gray-600 mt-2">
              {userEmail ? `Create a new password for ${userEmail}` : 'Enter your new password below'}
            </p>
          </div>

          {enhancedError && (
            <EnhancedErrorHandler 
              error={enhancedError}
              onDismiss={() => setEnhancedError(null)}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score < 3 ? 'bg-red-500' : 
                          passwordStrength.score < 5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Password requirements:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || csrfLoading || !password || !confirmPassword}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
