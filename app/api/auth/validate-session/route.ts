import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth/auth';
import { validateSessionFingerprint } from '@/app/lib/security/sessionFingerprinting';
import { withApiErrorHandling, ApiErrorCode } from '@/app/lib/apiUtils';
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
        throw {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Authentication required',
          statusCode: 401
        };
      }

      // Parse request body
      const body = await request.json();
      const { deviceFingerprint } = body;

      if (!deviceFingerprint) {
        throw {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Device fingerprint is required',
          statusCode: 400
        };
      }

      // Validate session fingerprint
      const comparison = await validateSessionFingerprint(request, deviceFingerprint);

      // Log suspicious activity for high-risk sessions
      if (comparison.riskLevel === 'high') {
        console.warn('High-risk session detected:', {
          userId: session.user.id,
          userEmail: session.user.email,
          score: comparison.score,
          differences: comparison.differences,
          riskLevel: comparison.riskLevel,
          timestamp: new Date().toISOString()
        });
      }

      // Return validation result
      return NextResponse.json({
        success: true,
        data: {
          isValid: comparison.isValid,
          shouldChallenge: comparison.shouldChallenge,
          riskLevel: comparison.riskLevel,
          score: comparison.score,
          // Don't expose differences for security reasons
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    });
  }, RateLimitConfigs.api);

  return rateLimitedHandler(request);
}