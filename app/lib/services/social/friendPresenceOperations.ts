import { ref, set, onValue } from 'firebase/database';
import { realtimeDb } from '@/app/lib/firebase';
import type { PresenceStatus } from '@/app/types/social';

const presenceSubscriptions = new Map<string, () => void>();

export async function updatePresence(
  userId: string,
  isOnline: boolean,
  activity?: string
): Promise<void> {
  try {
    const presenceRef = ref(realtimeDb, `presence/${userId}`);
    const presenceData: PresenceStatus = {
      userId,
      isOnline,
      lastSeen: new Date().toISOString(),
      currentActivity: activity as PresenceStatus['currentActivity'],
    };

    await set(presenceRef, presenceData);
  } catch (error) {
    console.error('Error updating presence:', error);
    throw error;
  }
}

export function subscribeToFriendPresence(
  userId: string,
  friendIds: string[],
  callback: (presenceUpdates: Record<string, PresenceStatus>) => void
): () => void {
  const presenceState: Record<string, PresenceStatus> = {};
  const unsubscribers: (() => void)[] = [];

  const INDIVIDUAL_SUBSCRIBE_THRESHOLD = 50;

  if (friendIds.length <= INDIVIDUAL_SUBSCRIBE_THRESHOLD) {
    friendIds.forEach((friendId) => {
      const friendPresenceRef = ref(realtimeDb, `presence/${friendId}`);

      const unsubscribe = onValue(friendPresenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          presenceState[friendId] = data as PresenceStatus;
        } else {
          presenceState[friendId] = {
            userId: friendId,
            isOnline: false,
            lastSeen: new Date().toISOString(),
          };
        }
        callback({ ...presenceState });
      });

      unsubscribers.push(unsubscribe);
    });
  } else {
    const presenceRef = ref(realtimeDb, 'presence');
    let debounceTimeout: NodeJS.Timeout | null = null;
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() || {};

      friendIds.forEach((friendId) => {
        if (presenceData[friendId]) {
          presenceState[friendId] = presenceData[friendId];
        }
      });

      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        callback({ ...presenceState });
      }, 100);
    });

    unsubscribers.push(() => {
      unsubscribe();
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    });
  }

  const cleanup = () => {
    unsubscribers.forEach((unsub) => unsub());
  };

  presenceSubscriptions.set(userId, cleanup);
  return cleanup;
}

export function cleanupPresenceSubscriptions(): void {
  presenceSubscriptions.forEach((unsubscribe) => unsubscribe());
  presenceSubscriptions.clear();
}
