import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { submitQuizAttempt } from '@/app/actions/quizActions';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';

/**
 * POST endpoint for submitting quiz attempts
 * This ensures the UI can submit quiz attempts without directly
 * exposing the server action.
 */
export async function POST(request: NextRequest) {
  const rateLimitedHandler = withRateLimit(async (req: NextRequest) => {
    return withApiErrorHandling(req, async () => {
      // First, authenticate the request
      const session = await auth();

      if (!session?.user) {
        throw new Error('Authentication required');
      }

      // Forward the form data to the server action
      const formData = await req.formData();
      const result = await submitQuizAttempt(formData);

      return result;
    });
  }, RateLimitConfigs.api);
  return rateLimitedHandler(request);
} 