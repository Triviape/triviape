import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import type { Challenge, ChallengeStatus } from '@/app/types/social';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { areFriends, sendNotification } from './friendInternals';

async function createChallengeCompletedActivity(
  challenge: Challenge,
  winner: string | 'tie',
  fromScore: number,
  toScore: number
): Promise<void> {
  try {
    const activityData = {
      type: 'challenge_completed' as const,
      title: 'Challenge Completed',
      description:
        winner === 'tie'
          ? `${challenge.fromUserDisplayName} and ${challenge.toUserDisplayName} tied ${fromScore}-${toScore}`
          : winner === challenge.fromUserId
            ? `${challenge.fromUserDisplayName} defeated ${challenge.toUserDisplayName} ${fromScore}-${toScore}`
            : `${challenge.toUserDisplayName} defeated ${challenge.fromUserDisplayName} ${toScore}-${fromScore}`,
      data: {
        challengeId: challenge.id,
        quizTitle: challenge.quizTitle,
        fromUserScore: fromScore,
        toUserScore: toScore,
        winner,
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
    };

    await Promise.all([
      addDoc(collection(db, 'friend_activities'), {
        userId: challenge.fromUserId,
        userDisplayName: challenge.fromUserDisplayName,
        userAvatarUrl: null,
        ...activityData,
      }),
      addDoc(collection(db, 'friend_activities'), {
        userId: challenge.toUserId,
        userDisplayName: challenge.toUserDisplayName,
        userAvatarUrl: null,
        ...activityData,
      }),
    ]);
  } catch (error) {
    console.error('Error creating challenge activity:', error);
  }
}

export async function sendChallenge(
  fromUserId: string,
  toUserId: string,
  quizId: string,
  message?: string,
  options?: {
    timeLimit?: number;
    questionCount?: number;
    difficultyLevel?: string;
  }
): Promise<Challenge> {
  try {
    const friends = await areFriends(fromUserId, toUserId);
    if (!friends) {
      throw new Error('Users are not friends');
    }

    const quizDoc = await getDoc(doc(db, COLLECTIONS.QUIZZES, quizId));
    if (!quizDoc.exists()) {
      throw new Error('Quiz not found');
    }

    const quizData = quizDoc.data();
    const [fromUser, toUser] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, fromUserId)),
      getDoc(doc(db, COLLECTIONS.USERS, toUserId)),
    ]);

    const challenge: Omit<Challenge, 'id'> = {
      fromUserId,
      toUserId,
      fromUserDisplayName: fromUser.data()?.displayName || 'Anonymous',
      toUserDisplayName: toUser.data()?.displayName || 'Anonymous',
      quizId,
      quizTitle: quizData.title,
      categoryId: quizData.categoryId,
      status: 'pending',
      message,
      timeLimit: options?.timeLimit,
      questionCount: options?.questionCount,
      difficultyLevel: options?.difficultyLevel,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const challengeRef = await addDoc(collection(db, 'challenges'), challenge);

    await sendNotification(toUserId, {
      type: 'challenge_received',
      title: 'Challenge Received',
      message: `${challenge.fromUserDisplayName} challenged you to "${challenge.quizTitle}"`,
      data: { challengeId: challengeRef.id, fromUserId },
    });

    return { ...challenge, id: challengeRef.id };
  } catch (error) {
    console.error('Error sending challenge:', error);
    throw error;
  }
}

export async function getChallenges(
  userId: string,
  status?: ChallengeStatus[]
): Promise<{ sent: Challenge[]; received: Challenge[] }> {
  try {
    const sentQueryRef = query(
      collection(db, 'challenges'),
      where('fromUserId', '==', userId),
      ...(status ? [where('status', 'in', status)] : []),
      orderBy('createdAt', 'desc')
    );

    const receivedQueryRef = query(
      collection(db, 'challenges'),
      where('toUserId', '==', userId),
      ...(status ? [where('status', 'in', status)] : []),
      orderBy('createdAt', 'desc')
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQueryRef),
      getDocs(receivedQueryRef),
    ]);

    const sent = sentSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Challenge));
    const received = receivedSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Challenge));

    return { sent, received };
  } catch (error) {
    console.error('Error getting challenges:', error);
    throw error;
  }
}

export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  try {
    const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
    if (!challengeDoc.exists()) {
      return null;
    }
    return { ...challengeDoc.data(), id: challengeDoc.id } as Challenge;
  } catch (error) {
    console.error('Error getting challenge:', error);
    throw error;
  }
}

export async function respondToChallenge(
  challengeId: string,
  userId: string,
  response: 'accepted' | 'declined'
): Promise<Challenge> {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);

    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found');
    }

    const challenge = { ...challengeDoc.data(), id: challengeId } as Challenge;

    if (challenge.toUserId !== userId) {
      throw new Error('Not authorized to respond to this challenge');
    }

    if (challenge.status !== 'pending') {
      throw new Error('Challenge is no longer pending');
    }

    const updateData: Partial<Challenge> = {
      status: response,
      ...(response === 'accepted' && {
        acceptedAt: new Date().toISOString(),
        status: 'in_progress' as ChallengeStatus,
      }),
    };

    await updateDoc(challengeRef, updateData);

    await sendNotification(challenge.fromUserId, {
      type: response === 'accepted' ? 'challenge_accepted' : 'challenge_declined',
      title: response === 'accepted' ? 'Challenge Accepted!' : 'Challenge Declined',
      message:
        response === 'accepted'
          ? `${challenge.toUserDisplayName} accepted your challenge!`
          : `${challenge.toUserDisplayName} declined your challenge.`,
      data: { challengeId },
    });

    return { ...challenge, ...updateData, id: challengeId };
  } catch (error) {
    console.error('Error responding to challenge:', error);
    throw error;
  }
}

export async function updateChallengeScore(
  challengeId: string,
  userId: string,
  score: number,
  timeInSeconds: number
): Promise<Challenge> {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);

    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found');
    }

    const challenge = { ...challengeDoc.data(), id: challengeId } as Challenge;

    if (challenge.fromUserId !== userId && challenge.toUserId !== userId) {
      throw new Error('Not a participant in this challenge');
    }

    if (challenge.status !== 'in_progress' && challenge.status !== 'accepted') {
      throw new Error('Challenge is not in progress');
    }

    const isFromUser = challenge.fromUserId === userId;
    const updateData: Partial<Challenge> = isFromUser
      ? { fromUserScore: score, fromUserTime: timeInSeconds }
      : { toUserScore: score, toUserTime: timeInSeconds };

    const otherScore = isFromUser ? challenge.toUserScore : challenge.fromUserScore;
    if (otherScore !== undefined) {
      const fromScore = isFromUser ? score : challenge.fromUserScore!;
      const toScore = isFromUser ? challenge.toUserScore! : score;

      let winner: string | 'tie';
      if (fromScore > toScore) {
        winner = challenge.fromUserId;
      } else if (toScore > fromScore) {
        winner = challenge.toUserId;
      } else {
        const fromTime = isFromUser ? timeInSeconds : challenge.fromUserTime!;
        const toTime = isFromUser ? challenge.toUserTime! : timeInSeconds;
        winner =
          fromTime < toTime ? challenge.fromUserId : toTime < fromTime ? challenge.toUserId : 'tie';
      }

      updateData.status = 'completed';
      updateData.completedAt = new Date().toISOString();
      updateData.winner = winner;

      await Promise.all([
        sendNotification(challenge.fromUserId, {
          type: 'challenge_completed',
          title: 'Challenge Complete!',
          message:
            winner === 'tie'
              ? "It's a tie!"
              : winner === challenge.fromUserId
                ? 'Congratulations, you won!'
                : `${challenge.toUserDisplayName} won this round.`,
          data: { challengeId, winner, fromScore, toScore },
        }),
        sendNotification(challenge.toUserId, {
          type: 'challenge_completed',
          title: 'Challenge Complete!',
          message:
            winner === 'tie'
              ? "It's a tie!"
              : winner === challenge.toUserId
                ? 'Congratulations, you won!'
                : `${challenge.fromUserDisplayName} won this round.`,
          data: { challengeId, winner, fromScore, toScore },
        }),
      ]);

      await createChallengeCompletedActivity(challenge, winner, fromScore, toScore);
    }

    await updateDoc(challengeRef, updateData);
    return { ...challenge, ...updateData };
  } catch (error) {
    console.error('Error updating challenge score:', error);
    throw error;
  }
}

export async function cancelChallenge(challengeId: string, userId: string): Promise<void> {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    const challengeDoc = await getDoc(challengeRef);

    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found');
    }

    const challenge = challengeDoc.data() as Challenge;

    if (challenge.fromUserId !== userId) {
      throw new Error('Only the sender can cancel a challenge');
    }

    if (challenge.status !== 'pending') {
      throw new Error('Can only cancel pending challenges');
    }

    await deleteDoc(challengeRef);
  } catch (error) {
    console.error('Error canceling challenge:', error);
    throw error;
  }
}
