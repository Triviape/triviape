import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { withApiErrorHandling } from '@/app/lib/apiUtils';
import { withRateLimit, RateLimitConfigs } from '@/app/lib/rateLimiter';
import { UserStats } from '@/app/types/user';

interface QuizAttemptSummary {
  id: string;
  quizId?: string;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  completedAt: string | null;
}

function toIsoString(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value).toISOString();
  }

  return null;
}

export async function GET(request: NextRequest) {
  const rateLimitedHandler = withRateLimit(async (req: NextRequest) => {
    return withApiErrorHandling(req, async () => {
      const session = await auth();

      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      const uid = session.user.id as string;
      const db = FirebaseAdminService.getFirestore();

      // Fetch user profile summary from users collection
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }

      const profile = userDoc.data() as Partial<UserStats> & {
        displayName?: string;
        email?: string;
        photoURL?: string | null;
        level?: number;
        xp?: number;
        xpToNextLevel?: number;
        coins?: number;
        quizzesTaken?: number;
        questionsAnswered?: number;
        correctAnswers?: number;
        lastLoginAt?: { toDate?: () => Date } | Date | string | number | null;
        createdAt?: { toDate?: () => Date } | Date | string | number | null;
      };

      // Fetch recent quiz attempts
      const attemptsSnap = await db
        .collection('quiz_attempts')
        .where('userId', '==', uid)
        .orderBy('completedAt', 'desc')
        .limit(10)
        .get();

      const recentAttempts: QuizAttemptSummary[] = attemptsSnap.docs.map((snapshot) => {
        const data = snapshot.data() as {
          quizId?: string;
          score?: number;
          totalQuestions?: number;
          correctAnswers?: number;
          completedAt?: { toDate?: () => Date } | Date | string | number | null;
        };
        return {
          id: snapshot.id,
          quizId: data.quizId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers,
          completedAt: toIsoString(data.completedAt),
        };
      });

      const questionsAnswered = Number(profile.questionsAnswered || 0);
      const correctAnswers = Number(profile.correctAnswers || 0);
      const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;

      const summary = {
        uid,
        displayName: profile.displayName || session.user.name || 'Player',
        email: profile.email || session.user.email || '',
        photoURL: profile.photoURL || session.user.image || null,
        level: profile.level || 1,
        xp: profile.xp || 0,
        xpToNextLevel: profile.xpToNextLevel || 100,
        coins: profile.coins || 0,
        quizzesTaken: profile.quizzesTaken || 0,
        questionsAnswered,
        correctAnswers,
        accuracy,
        lastLoginAt: toIsoString(profile.lastLoginAt),
        createdAt: toIsoString(profile.createdAt),
      };

      return { summary, recentAttempts };
    });
  }, RateLimitConfigs.api);
  return rateLimitedHandler(request);
}
