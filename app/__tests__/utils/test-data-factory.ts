/**
 * Test Data Factory
 * 
 * This module provides utilities for generating consistent test data
 * and managing test data cleanup to ensure test isolation.
 */

import { v4 as uuidv4 } from 'uuid';
import { getFirestore, doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { initTestFirebase } from './firebase-test-utils';

// Track created resources for cleanup
interface TestResource {
  type: 'user' | 'document' | 'storage';
  id: string;
  path?: string;
  cleanup: () => Promise<void>;
}

// Store resources created during tests for cleanup
const testResources: TestResource[] = [];

/**
 * Generate a unique test ID
 * @param prefix Optional prefix for the ID
 * @returns A unique ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${uuidv4().substring(0, 8)}-${Date.now().toString().substring(8)}`;
}

/**
 * User data generator
 */
export function generateTestUserData(customData: Partial<TestUserData> = {}) {
  const userId = generateTestId('user');
  
  return {
    uid: userId,
    email: customData.email || `${userId}@example.com`,
    password: customData.password || 'Test@123456',
    displayName: customData.displayName || `Test User ${userId}`,
  };
}

/**
 * Profile data generator
 */
export function generateTestProfileData(userId: string, customData: Partial<TestProfileData> = {}) {
  return {
    id: userId,
    displayName: customData.displayName || `Test User ${userId}`,
    email: customData.email || `${userId}@example.com`,
    photoURL: customData.photoURL || null,
    level: customData.level || 1,
    xp: customData.xp || 0,
    coins: customData.coins || 100,
    createdAt: customData.createdAt || new Date().toISOString(),
    updatedAt: customData.updatedAt || new Date().toISOString(),
  };
}

/**
 * Game data generator
 */
export function generateTestGameData(customData: Partial<TestGameData> = {}) {
  const gameId = generateTestId('game');
  
  return {
    id: gameId,
    title: customData.title || `Test Game ${gameId}`,
    description: customData.description || 'This is a test game',
    createdBy: customData.createdBy || generateTestId('user'),
    createdAt: customData.createdAt || new Date().toISOString(),
    updatedAt: customData.updatedAt || new Date().toISOString(),
    isPublic: customData.isPublic ?? true,
    categories: customData.categories || ['test', 'general'],
    questions: customData.questions || [],
  };
}

/**
 * Create a test user in Firebase Auth
 */
export async function createTestUserInAuth(userData: TestUserData): Promise<string> {
  const { auth } = initTestFirebase();
  
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const uid = userCredential.user.uid;
    
    // Register for cleanup
    testResources.push({
      type: 'user',
      id: uid,
      cleanup: async () => {
        try {
          if (auth.currentUser && auth.currentUser.uid === uid) {
            await deleteUser(auth.currentUser);
          }
        } catch (error) {
          console.warn(`Failed to clean up test user ${uid}:`, error);
        }
      }
    });
    
    return uid;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Create a test document in Firestore
 */
export async function createTestDocument<T extends Record<string, any>>(
  collectionPath: string,
  data: T,
  documentId?: string
): Promise<string> {
  const { firestore } = initTestFirebase();
  
  try {
    const docId = documentId || generateTestId('doc');
    const docRef = doc(firestore, collectionPath, docId);
    
    await setDoc(docRef, {
      ...data,
      id: docId,
      testData: true, // Mark as test data for easier cleanup
      createdAt: data.createdAt || new Date().toISOString(),
    });
    
    // Register for cleanup
    testResources.push({
      type: 'document',
      id: docId,
      path: collectionPath,
      cleanup: async () => {
        try {
          await deleteDoc(doc(firestore, collectionPath, docId));
        } catch (error) {
          console.warn(`Failed to clean up test document ${collectionPath}/${docId}:`, error);
        }
      }
    });
    
    return docId;
  } catch (error) {
    console.error(`Error creating test document in ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Clean up all test resources created during tests
 */
export async function cleanupTestResources(): Promise<void> {
  console.log(`Cleaning up ${testResources.length} test resources...`);
  
  // Process resources in reverse order (LIFO)
  for (let i = testResources.length - 1; i >= 0; i--) {
    const resource = testResources[i];
    try {
      await resource.cleanup();
      console.log(`Cleaned up ${resource.type} ${resource.id}`);
    } catch (error) {
      console.warn(`Failed to clean up ${resource.type} ${resource.id}:`, error);
    }
  }
  
  // Clear the resources array
  testResources.length = 0;
}

/**
 * Clean up all test data in a collection
 */
export async function cleanupTestCollection(collectionPath: string): Promise<void> {
  const { firestore } = initTestFirebase();
  
  try {
    // Query for all documents marked as test data
    const q = query(collection(firestore, collectionPath), where('testData', '==', true));
    const querySnapshot = await getDocs(q);
    
    // Delete each document
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Cleaned up ${querySnapshot.size} test documents from ${collectionPath}`);
  } catch (error) {
    console.error(`Error cleaning up test collection ${collectionPath}:`, error);
  }
}

// Type definitions
export interface TestUserData {
  uid?: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface TestProfileData {
  id: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  level: number;
  xp: number;
  coins: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestGameData {
  id?: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  categories: string[];
  questions: any[];
} 