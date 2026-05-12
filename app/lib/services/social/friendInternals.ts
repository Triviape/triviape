/**
 * Shared Firestore / Realtime DB helpers for social features.
 * Extracted from friendService (GUIDE 4.1) to keep domain modules small.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  and,
  or,
  documentId,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { db, realtimeDb } from '@/app/lib/firebase';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import type { PresenceStatus } from '@/app/types/social';

export async function batchGetUsers(userIds: string[]): Promise<Map<string, any>> {
  const result = new Map();
  const BATCH_SIZE = 10;
  const uniqueUserIds = [...new Set(userIds)];
  const batches: string[][] = [];

  for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
    batches.push(uniqueUserIds.slice(i, i + BATCH_SIZE));
  }

  const summarySnapshots = await Promise.all(
    batches.map((batch) => {
      const q = query(
        collection(db, COLLECTIONS.USER_PROFILE_SUMMARIES),
        where(documentId(), 'in', batch)
      );
      return getDocs(q);
    })
  );

  summarySnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((summaryDoc) => {
      const summaryData = summaryDoc.data();
      result.set(summaryDoc.id, {
        level: summaryData.level || 1,
        lastLoginAt: summaryData.lastLoginAt,
        quizzesTaken: summaryData.quizzesTaken || 0,
        averageScore: summaryData.averageScore || 0,
        favoriteCategory: summaryData.favoriteCategory,
        achievementsCount: summaryData.achievementsCount || 0,
        privacySettings: {
          shareActivityWithFriends: summaryData.shareActivityWithFriends,
        },
      });
    });
  });

  const missingUserIds = uniqueUserIds.filter((userId) => !result.has(userId));
  if (missingUserIds.length === 0) {
    return result;
  }

  const missingBatches: string[][] = [];
  for (let i = 0; i < missingUserIds.length; i += BATCH_SIZE) {
    missingBatches.push(missingUserIds.slice(i, i + BATCH_SIZE));
  }

  const userSnapshots = await Promise.all(
    missingBatches.map((batch) => {
      const q = query(collection(db, COLLECTIONS.USERS), where(documentId(), 'in', batch));
      return getDocs(q);
    })
  );

  const summaryBackfillWrites: Promise<void>[] = [];
  userSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((userDoc) => {
      const userData = userDoc.data();
      result.set(userDoc.id, userData);

      summaryBackfillWrites.push(
        setDoc(
          doc(db, COLLECTIONS.USER_PROFILE_SUMMARIES, userDoc.id),
          {
            level: userData.level || 1,
            lastLoginAt: userData.lastLoginAt || null,
            quizzesTaken: userData.quizzesTaken || 0,
            averageScore: userData.averageScore || 0,
            favoriteCategory: userData.favoriteCategory || null,
            achievementsCount: userData.achievements?.length || 0,
            shareActivityWithFriends: userData.privacySettings?.shareActivityWithFriends !== false,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      );
    });
  });

  await Promise.allSettled(summaryBackfillWrites);
  return result;
}

export async function getUsersOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
  try {
    const presenceRef = ref(realtimeDb, 'presence');
    const snapshot = await get(presenceRef);
    const presenceData = snapshot.val() || {};

    const now = Date.now();
    const result: Record<string, boolean> = {};

    userIds.forEach((userId) => {
      const presence = presenceData[userId];
      if (presence) {
        const lastSeen = new Date(presence.lastSeen).getTime();
        result[userId] = presence.isOnline && now - lastSeen < 5 * 60 * 1000;
      } else {
        result[userId] = false;
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting users online status:', error);
    return {};
  }
}

export async function getCurrentUserFriendIdsOptimized(userId: string): Promise<string[]> {
  const friendshipsQuery = query(
    collection(db, 'friendships'),
    or(where('userId1', '==', userId), where('userId2', '==', userId))
  );
  const snapshot = await getDocs(friendshipsQuery);
  return snapshot.docs.map((d) => {
    const friendship = d.data();
    return friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;
  });
}

export async function getExistingRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  const requests = await Promise.all([
    getDocs(
      query(
        collection(db, 'friend_requests'),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('status', 'in', ['pending', 'accepted'])
      )
    ),
    getDocs(
      query(
        collection(db, 'friend_requests'),
        where('fromUserId', '==', toUserId),
        where('toUserId', '==', fromUserId),
        where('status', 'in', ['pending', 'accepted'])
      )
    ),
  ]);

  return requests.some((snapshot) => !snapshot.empty);
}

export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendshipQuery = query(
    collection(db, 'friendships'),
    or(
      and(where('userId1', '==', userId1), where('userId2', '==', userId2)),
      and(where('userId1', '==', userId2), where('userId2', '==', userId1))
    )
  );

  const snapshot = await getDocs(friendshipQuery);
  return !snapshot.empty;
}

export async function getPendingRequestUserIds(
  userId: string
): Promise<Array<{ fromUserId: string; toUserId: string }>> {
  const requestsQuery = query(
    collection(db, 'friend_requests'),
    and(
      or(where('fromUserId', '==', userId), where('toUserId', '==', userId)),
      where('status', '==', 'pending')
    )
  );

  const snapshot = await getDocs(requestsQuery);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return { fromUserId: data.fromUserId, toUserId: data.toUserId };
  });
}

export async function batchGetMutualFriendsCounts(
  userId: string,
  friendIds: string[]
): Promise<Record<string, number>> {
  if (friendIds.length === 0) {
    return {};
  }

  const uniqueFriendIds = [...new Set(friendIds)];
  const userFriends = await getCurrentUserFriendIdsOptimized(userId);
  const userFriendsSet = new Set(userFriends);

  const BATCH_SIZE = 10;
  const allFriendshipsMap = new Map<string, Set<string>>();

  uniqueFriendIds.forEach((id) => allFriendshipsMap.set(id, new Set()));

  const batchRequests: Array<Promise<[QuerySnapshot<DocumentData>, QuerySnapshot<DocumentData>]>> = [];

  for (let i = 0; i < uniqueFriendIds.length; i += BATCH_SIZE) {
    const batch = uniqueFriendIds.slice(i, i + BATCH_SIZE);

    const query1 = query(collection(db, 'friendships'), where('userId1', 'in', batch));
    const query2 = query(collection(db, 'friendships'), where('userId2', 'in', batch));

    batchRequests.push(Promise.all([getDocs(query1), getDocs(query2)]));
  }

  const batchSnapshots = await Promise.all(batchRequests);

  batchSnapshots.forEach(([snapshot1, snapshot2]) => {
    snapshot1.docs.forEach((d) => {
      const data = d.data();
      const friendId = data.userId1;
      const otherId = data.userId2;
      if (allFriendshipsMap.has(friendId)) {
        allFriendshipsMap.get(friendId)!.add(otherId);
      }
    });

    snapshot2.docs.forEach((d) => {
      const data = d.data();
      const friendId = data.userId2;
      const otherId = data.userId1;
      if (allFriendshipsMap.has(friendId)) {
        allFriendshipsMap.get(friendId)!.add(otherId);
      }
    });
  });

  const result: Record<string, number> = {};
  uniqueFriendIds.forEach((friendId) => {
    const friendFriends = allFriendshipsMap.get(friendId) || new Set();
    let mutualCount = 0;
    friendFriends.forEach((id) => {
      if (userFriendsSet.has(id)) {
        mutualCount++;
      }
    });
    result[friendId] = mutualCount;
  });

  friendIds.forEach((friendId) => {
    if (result[friendId] === undefined) {
      result[friendId] = 0;
    }
  });

  return result;
}

export async function sendNotification(userId: string, notification: Record<string, unknown>): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
