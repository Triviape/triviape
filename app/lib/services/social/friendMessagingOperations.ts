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
  updateDoc,
} from 'firebase/firestore';
import { ref, set, onValue } from 'firebase/database';
import { db, realtimeDb } from '@/app/lib/firebase';
import type { Conversation, DirectMessage } from '@/app/types/social';
import { COLLECTIONS } from '@/app/lib/constants/collections';
import { areFriends, sendNotification } from './friendInternals';

export async function getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
  try {
    const existingQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId1)
    );

    const snapshot = await getDocs(existingQuery);
    const existing = snapshot.docs.find((d) => {
      const data = d.data();
      return data.participantIds.includes(userId2);
    });

    if (existing) {
      return { ...existing.data(), id: existing.id } as Conversation;
    }

    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USERS, userId1)),
      getDoc(doc(db, COLLECTIONS.USERS, userId2)),
    ]);

    const user1Data = user1Doc.data() || {};
    const user2Data = user2Doc.data() || {};

    const conversation: Omit<Conversation, 'id'> = {
      participantIds: [userId1, userId2],
      participant1DisplayName: user1Data.displayName || 'Anonymous',
      participant1AvatarUrl: user1Data.photoURL,
      participant2DisplayName: user2Data.displayName || 'Anonymous',
      participant2AvatarUrl: user2Data.photoURL,
      unreadCount: { [userId1]: 0, [userId2]: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const conversationRef = await addDoc(collection(db, 'conversations'), conversation);
    return { ...conversation, id: conversationRef.id };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(conversationsQuery);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Conversation));
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}

export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string
): Promise<DirectMessage> {
  try {
    const friends = await areFriends(senderId, recipientId);
    if (!friends) {
      throw new Error('Can only message friends');
    }

    const conversation = await getOrCreateConversation(senderId, recipientId);

    const senderDoc = await getDoc(doc(db, COLLECTIONS.USERS, senderId));
    const senderData = senderDoc.data() || {};

    const message: Omit<DirectMessage, 'id'> = {
      conversationId: conversation.id,
      senderId,
      senderDisplayName: senderData.displayName || 'Anonymous',
      senderAvatarUrl: senderData.photoURL,
      recipientId,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const messageRef = await addDoc(collection(db, 'messages'), message);

    await updateDoc(doc(db, 'conversations', conversation.id), {
      lastMessage: content.substring(0, 100),
      lastMessageAt: message.createdAt,
      lastMessageSenderId: senderId,
      [`unreadCount.${recipientId}`]: (conversation.unreadCount[recipientId] || 0) + 1,
      updatedAt: message.createdAt,
    });

    await sendNotification(recipientId, {
      type: 'message_received',
      title: 'New Message',
      message: `${senderData.displayName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      data: { conversationId: conversation.id, messageId: messageRef.id, senderId },
    });

    return { ...message, id: messageRef.id };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function getMessages(
  conversationId: string,
  limitCount = 50,
  _beforeMessageId?: string
): Promise<DirectMessage[]> {
  try {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as DirectMessage)).reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    const unreadQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(unreadQuery);
    const now = new Date().toISOString();

    await Promise.all(snapshot.docs.map((d) => updateDoc(d.ref, { isRead: true, readAt: now })));

    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: DirectMessage[]) => void
): () => void {
  const messagesRef = ref(realtimeDb, `conversations/${conversationId}/messages`);

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val() || {};
    const messages = Object.entries(data).map(([id, msg]) => ({
      id,
      ...(msg as Omit<DirectMessage, 'id'>),
    }));

    messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    callback(messages);
  });

  return unsubscribe;
}
