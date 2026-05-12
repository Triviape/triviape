import { collection, query, where, orderBy, getDocs, addDoc, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import type { FriendRequest, Friendship } from '@/app/types/social';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { measureFriendAction } from '../socialPerformanceMonitor';
import { getExistingRequest, sendNotification } from './friendInternals';

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
  message?: string
): Promise<FriendRequest> {
  return measureFriendAction(
    async () => {
      try {
        const existingRequest = await getExistingRequest(fromUserId, toUserId);
        if (existingRequest) {
          throw new Error('Friend request already exists or users are already friends');
        }

        const [fromUser, toUser] = await Promise.all([
          getDoc(doc(db, COLLECTIONS.USERS, fromUserId)),
          getDoc(doc(db, COLLECTIONS.USERS, toUserId)),
        ]);

        if (!fromUser.exists() || !toUser.exists()) {
          throw new Error('One or both users not found');
        }

        const fromUserData = fromUser.data();
        const toUserData = toUser.data();

        const friendRequest: Omit<FriendRequest, 'id'> = {
          fromUserId,
          toUserId,
          fromUserDisplayName: fromUserData.displayName || 'Anonymous',
          fromUserAvatarUrl: fromUserData.photoURL,
          toUserDisplayName: toUserData.displayName || 'Anonymous',
          toUserAvatarUrl: toUserData.photoURL,
          status: 'pending',
          message,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const requestRef = await addDoc(collection(db, 'friend_requests'), friendRequest);

        await sendNotification(toUserId, {
          type: 'friend_request',
          title: 'New Friend Request',
          message: `${fromUserData.displayName} wants to be your friend`,
          data: { requestId: requestRef.id, fromUserId },
        });

        return { ...friendRequest, id: requestRef.id };
      } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
      }
    },
    { action: 'send_friend_request', fromUserId, toUserId }
  );
}

export async function acceptFriendRequest(requestId: string): Promise<Friendship> {
  return measureFriendAction(
    async () => {
      try {
        const requestDoc = await getDoc(doc(db, 'friend_requests', requestId));
        if (!requestDoc.exists()) {
          throw new Error('Friend request not found');
        }

        const request = requestDoc.data() as FriendRequest;
        if (request.status !== 'pending') {
          throw new Error('Friend request is not pending');
        }

        await updateDoc(doc(db, 'friend_requests', requestId), {
          status: 'accepted',
          updatedAt: new Date().toISOString(),
        });

        const friendship: Omit<Friendship, 'id'> = {
          userId1: request.fromUserId,
          userId2: request.toUserId,
          user1DisplayName: request.fromUserDisplayName,
          user1AvatarUrl: request.fromUserAvatarUrl,
          user2DisplayName: request.toUserDisplayName,
          user2AvatarUrl: request.toUserAvatarUrl,
          createdAt: new Date().toISOString(),
          isBlocked: false,
          allowChallenges: true,
          shareActivity: true,
          notifyOnline: true,
        };

        const friendshipRef = await addDoc(collection(db, 'friendships'), friendship);

        await Promise.all([
          updateDoc(doc(db, COLLECTIONS.USERS, request.fromUserId), {
            friendIds: arrayUnion(request.toUserId),
          }),
          updateDoc(doc(db, COLLECTIONS.USERS, request.toUserId), {
            friendIds: arrayUnion(request.fromUserId),
          }),
        ]);

        await sendNotification(request.fromUserId, {
          type: 'friend_request_accepted',
          title: 'Friend Request Accepted',
          message: `${request.toUserDisplayName} accepted your friend request`,
          data: { friendshipId: friendshipRef.id, friendId: request.toUserId },
        });

        return { ...friendship, id: friendshipRef.id };
      } catch (error) {
        console.error('Error accepting friend request:', error);
        throw error;
      }
    },
    { action: 'accept_friend_request', requestId }
  );
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'declined',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error declining friend request:', error);
    throw error;
  }
}

export async function getFriendRequests(
  userId: string
): Promise<{ sent: FriendRequest[]; received: FriendRequest[] }> {
  try {
    const [sentQuery, receivedQuery] = [
      query(
        collection(db, 'friend_requests'),
        where('fromUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ),
      query(
        collection(db, 'friend_requests'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ),
    ];

    const [sentSnapshot, receivedSnapshot] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);

    const sent = sentSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));
    const received = receivedSnapshot.docs.map((d) => ({ ...d.data(), id: d.id } as FriendRequest));

    return { sent, received };
  } catch (error) {
    console.error('Error getting friend requests:', error);
    throw error;
  }
}
