import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';
import { withApiErrorHandling } from '@/app/lib/apiUtils';

export async function GET(req: NextRequest) {
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

    const profile = userDoc.data() || {};

    // Fetch recent quiz attempts
    const attemptsSnap = await db
      .collection('quiz_attempts')
      .where('userId', '==', uid)
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    const recentAttempts = attemptsSnap.docs.map((doc: any) => {
      const d = doc.data() as any;
      return {
        id: doc.id,
        quizId: d.quizId,
        score: d.score,
        totalQuestions: d.totalQuestions,
        correctAnswers: d.correctAnswers,
        completedAt: (d.completedAt instanceof Date)
          ? d.completedAt.toISOString()
          : (d.completedAt?.toDate ? d.completedAt.toDate().toISOString() : null),
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
      lastLoginAt: profile.lastLoginAt ? (profile.lastLoginAt.toDate ? profile.lastLoginAt.toDate().toISOString() : new Date(profile.lastLoginAt).toISOString()) : null,
      createdAt: profile.createdAt ? (profile.createdAt.toDate ? profile.createdAt.toDate().toISOString() : new Date(profile.createdAt).toISOString()) : null,
    };

    return { summary, recentAttempts };
  });
}
