import { z } from 'zod';

/**
 * Environment variable validation.
 * Import this module early (e.g. in layout.tsx or a top-level server component)
 * to catch missing vars at startup instead of at runtime.
 */

const envSchema = z.object({
  // ── Required: Firebase client config ─────────────────────────
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),

  // ── Optional: Firebase extras ────────────────────────────────
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: z.string().url().optional(),

  // ── Optional: Firebase Admin (server-side) ───────────────────
  FIREBASE_ADMIN_CREDENTIALS: z.string().optional(),

  // ── Optional: Services ───────────────────────────────────────
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_WEBSOCKET_URL: z.string().optional(),

  // ── Optional: Emulators / Dev ────────────────────────────────
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: z.enum(['true', 'false']).optional(),
  USE_FIREBASE_EMULATOR: z.enum(['true', 'false']).optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nCheck your .env file against .env.example.\n`
    );

    // In production, throw so the process fails fast.
    // In development/test, just warn — devs may have partial configs.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    }
  }

  return (result.success ? result.data : process.env) as Env;
}

export const env = validateEnv();
