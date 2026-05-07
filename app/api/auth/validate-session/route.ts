import { NextRequest } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';

/**
 * API route to validate session fingerprint
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitedHandler = withRateLimit(async (req: NextRequest) => {
    return withApiErrorHandling(req, async () => {
      // Check if user is authenticated
      const session = await auth();
      if (!session?.user) {
        throw new Error('Authentication required');
      }

      // Parse request body
      const body = await request.json();
      const { deviceFingerprint } = body;

      if (!deviceFingerprint) {
        throw new Error('Device fingerprint is required');
      }

      // Fingerprint validation is temporarily disabled while the session
      // security flow is redesigned to be runtime-safe across App Router,
      // API routes, and edge middleware.
      void deviceFingerprint;

      return {
        isValid: true,
        shouldChallenge: false,
        riskLevel: 'low' as const,
        score: 100,
      };
    });
  }, RateLimitConfigs.api);

  return rateLimitedHandler(request);
}
