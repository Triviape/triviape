import { NextRequest } from 'next/server';
import { getDailyQuiz } from '@/app/actions/quizActions';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';

/**
 * GET /api/daily-quiz
 * Returns the quiz designated for the current day
 */
export async function GET(request: NextRequest) {
  const rateLimitedHandler = withRateLimit(async (req: NextRequest) => {
    return withApiErrorHandling(req, async () => {
      const dailyQuiz = await getDailyQuiz();

      if (!dailyQuiz) {
        throw new Error('No daily quiz available');
      }

      return dailyQuiz;
    });
  }, RateLimitConfigs.api);
  return rateLimitedHandler(request);
} 