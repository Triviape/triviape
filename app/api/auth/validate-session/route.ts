import { NextRequest } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';
import { validateSessionFingerprint } from '@/app/lib/security/sessionFingerprinting';

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
      const body = await req.json();
      const { deviceFingerprint } = body;

      if (!deviceFingerprint) {
        throw new Error('Device fingerprint is required');
      }

      return validateSessionFingerprint(req, deviceFingerprint);
    });
  }, RateLimitConfigs.api);

  return rateLimitedHandler(request);
}
