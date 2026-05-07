import { z } from 'zod';

/** Shared between client (React Hook Form) and server (authActions). */

export const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
