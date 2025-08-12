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

export default function ResetPasswordPage() {
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

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
            {userEmail && (
              <p className="text-gray-600 mt-2">
                Setting new password for: <span className="font-medium">{userEmail}</span>
              </p>
            )}
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

            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Password strength:</span>
                    <span className={passwordStrength.color}>{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score < 3 ? 'bg-red-500' : 
                        passwordStrength.score < 5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="text-xs">
                  {password === confirmPassword ? (
                    <span className="text-green-600">✓ Passwords match</span>
                  ) : (
                    <span className="text-red-600">✗ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <Alert>
              <AlertDescription>
                <div className="text-sm">
                  <p className="font-medium mb-2">Password must contain:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      ✓ At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One lowercase letter
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One uppercase letter
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One number
                    </li>
                    <li className={/[@$!%*?&]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      ✓ One special character (@$!%*?&)
                    </li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={
                isLoading || 
                csrfLoading || 
                !csrfToken || 
                !password || 
                !confirmPassword || 
                password !== confirmPassword ||
                passwordStrength.score < 4
              }
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                disabled={isLoading}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}