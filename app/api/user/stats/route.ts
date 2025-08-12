import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { FirebaseAdminService } from '@/app/lib/firebaseAdmin';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const uid = session.user.id as string;
    const db = FirebaseAdminService.getFirestore();

    // Fetch user profile summary from users collection
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const profile = userDoc.data() || {};

    // Fetch recent quiz attempts
    const attemptsSnap = await db
      .collection('quiz_attempts')
      .where('userId', '==', uid)
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    const recentAttempts = attemptsSnap.docs.map((doc) => {
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

    return NextResponse.json({ summary, recentAttempts });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  }
}
