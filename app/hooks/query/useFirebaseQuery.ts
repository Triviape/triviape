/**
 * Hook for optimizing Firebase queries with React Query
 */

'use client';

import { useOptimizedQuery, OptimizedQueryOptions } from './useOptimizedQuery';
import { useOptimizedInfiniteQuery, OptimizedInfiniteQueryOptions } from './useOptimizedInfiniteQuery';
import { useOptimizedMutation, OptimizedMutationOptions } from './useOptimizedMutation';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  DocumentReference,
  CollectionReference,
  DocumentData,
  QueryConstraint,
  Firestore,
  WithFieldValue
} from 'firebase/firestore';
import { getFirestoreDb } from '@/app/lib/firebase';
import { useCallback } from 'react';
import { memoizeWithCache } from '@/app/lib/cacheUtils';

/**
 * Options for Firebase document query
 */
export interface FirebaseDocumentOptions<T = DocumentData> {
  /**
   * Firestore instance (optional, will use default if not provided)
   */
  db?: Firestore;
  
  /**
   * Path to the document
   */
  path: string;
  
  /**
   * Transform function to convert document data
   */
  transform?: (data: DocumentData) => T;
  
  /**
   * Component name for performance monitoring
   */
  componentName?: string;
  
  /**
   * Whether to track performance
   */
  trackPerformance?: boolean;
}

/**
 * Options for Firebase collection query
 */
export interface FirebaseCollectionOptions<T = DocumentData> extends FirebaseDocumentOptions<T> {
  /**
   * Query constraints
   */
  constraints?: QueryConstraint[];
  
  /**
   * Whether to include document IDs in the result
   */
  includeIds?: boolean;
  
  /**
   * Page size for pagination
   */
  pageSize?: number;
}

/**
 * Hook for querying a Firestore document
 * @param options Document query options
 * @returns Query result
 */
export function useFirebaseDocument<T = DocumentData>(
  options: FirebaseDocumentOptions<T> & Omit<OptimizedQueryOptions<T | null, Error>, 'queryFn' | 'queryKey'>
) {
  const {
    db = getFirestoreDb(),
    path,
    transform,
    componentName = 'FirebaseDocument',
    trackPerformance = true,
    ...queryOptions
  } = options;
  
  // Create a memoized query function
  const fetchDocument = useCallback(async () => {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    
    if (transform) {
      return transform(data);
    }
    
    return data as T;
  }, [db, path, transform]);
  
  // Use the optimized query
  return useOptimizedQuery<T | null, Error>({
    queryKey: ['firestore', 'doc', path],
    queryFn: fetchDocument,
    componentName,
    queryName: `doc_${path.replace(/\//g, '_')}`,
    trackPerformance,
    ...queryOptions
  });
}

/**
 * Hook for querying a Firestore collection
 * @param options Collection query options
 * @returns Query result
 */
export function useFirebaseCollection<T = DocumentData>(
  options: FirebaseCollectionOptions<T> & Omit<OptimizedQueryOptions<T[], Error>, 'queryFn' | 'queryKey'>
) {
  const {
    db = getFirestoreDb(),
    path,
    constraints = [],
    transform,
    includeIds = true,
    componentName = 'FirebaseCollection',
    trackPerformance = true,
    ...queryOptions
  } = options;
  
  // Create a memoized query function
  const fetchCollection = useCallback(async () => {
    const collectionRef = collection(db, path);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const results: T[] = [];
    
    querySnapshot.forEach(doc => {
      let data = doc.data();
      
      if (includeIds) {
        data = { ...data, id: doc.id };
      }
      
      if (transform) {
        results.push(transform(data));
      } else {
        results.push(data as T);
      }
    });
    
    return results;
  }, [db, path, constraints, transform, includeIds]);
  
  // Use the optimized query
  return useOptimizedQuery<T[], Error>({
    queryKey: ['firestore', 'collection', path, constraints],
    queryFn: fetchCollection,
    componentName,
    queryName: `collection_${path.replace(/\//g, '_')}`,
    trackPerformance,
    ...queryOptions
  });
}

/**
 * Hook for paginated query of a Firestore collection
 * @param options Collection query options
 * @returns Infinite query result
 */
export function useFirebasePaginatedCollection<T = DocumentData>(
  options: FirebaseCollectionOptions<T> & Omit<OptimizedInfiniteQueryOptions<{
    items: T[];
    lastDoc: DocumentData | null;
    hasMore: boolean;
  }, Error>, 'queryFn' | 'queryKey' | 'getNextPageParam'>
) {
  const {
    db = getFirestoreDb(),
    path,
    constraints = [],
    transform,
    includeIds = true,
    pageSize = 10,
    componentName = 'FirebasePaginatedCollection',
    trackPerformance = true,
    ...queryOptions
  } = options;
  
  // Create a memoized query function
  const fetchPaginatedCollection = useCallback(async ({ pageParam = null }) => {
    const collectionRef = collection(db, path);
    
    // Create query with pagination
    let queryConstraints = [...constraints, limit(pageSize)];
    
    // Add startAfter if we have a pageParam (last document)
    if (pageParam) {
      queryConstraints.push(startAfter(pageParam));
    }
    
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const results: T[] = [];
    let lastDoc: DocumentData | null = null;
    
    querySnapshot.forEach(doc => {
      let data = doc.data();
      
      if (includeIds) {
        data = { ...data, id: doc.id };
      }
      
      if (transform) {
        results.push(transform(data));
      } else {
        results.push(data as T);
      }
      
      // Update lastDoc
      lastDoc = doc;
    });
    
    // Check if there are more items
    const hasMore = querySnapshot.size === pageSize;
    
    return {
      items: results,
      lastDoc,
      hasMore
    };
  }, [db, path, constraints, transform, includeIds, pageSize]);
  
  // Use the optimized infinite query
  return useOptimizedInfiniteQuery<{
    items: T[];
    lastDoc: DocumentData | null;
    hasMore: boolean;
  }, Error>({
    queryKey: ['firestore', 'paginated', path, constraints, pageSize],
    queryFn: fetchPaginatedCollection,
    getNextPageParam: (lastPage: { items: T[]; lastDoc: DocumentData | null; hasMore: boolean }) => 
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    componentName,
    queryName: `paginated_${path.replace(/\//g, '_')}`,
    trackPerformance,
    ...queryOptions
  });
}

/**
 * Hook for adding a document to a Firestore collection
 * @param options Mutation options
 * @returns Mutation result
 */
export function useFirebaseAddDocument<T = DocumentData>(
  options: {
    /**
     * Firestore instance (optional, will use default if not provided)
     */
    db?: Firestore;
    
    /**
     * Path to the collection
     */
    collectionPath: string;
    
    /**
     * Component name for performance monitoring
     */
    componentName?: string;
    
    /**
     * Whether to track performance
     */
    trackPerformance?: boolean;
  } & Omit<OptimizedMutationOptions<string, Error, T, unknown>, 'mutationFn' | 'mutationKey'>
) {
  const {
    db = getFirestoreDb(),
    collectionPath,
    componentName = 'FirebaseAddDocument',
    trackPerformance = true,
    ...mutationOptions
  } = options;
  
  // Create a memoized mutation function
  const addDocument = useCallback(async (data: T) => {
    const collectionRef = collection(db, collectionPath);
    const docRef = await addDoc(collectionRef, data as WithFieldValue<DocumentData>);
    return docRef.id;
  }, [db, collectionPath]);
  
  // Use the optimized mutation
  return useOptimizedMutation<string, Error, T>({
    mutationFn: addDocument,
    componentName,
    mutationName: `add_${collectionPath.replace(/\//g, '_')}`,
    trackPerformance,
    ...mutationOptions
  });
}

/**
 * Hook for setting a document in Firestore
 * @param options Mutation options
 * @returns Mutation result
 */
export function useFirebaseSetDocument<T = DocumentData>(
  options: {
    /**
     * Firestore instance (optional, will use default if not provided)
     */
    db?: Firestore;
    
    /**
     * Component name for performance monitoring
     */
    componentName?: string;
    
    /**
     * Whether to track performance
     */
    trackPerformance?: boolean;
  } & Omit<OptimizedMutationOptions<void, Error, { path: string; data: T; merge?: boolean }, unknown>, 'mutationFn' | 'mutationKey'>
) {
  const {
    db = getFirestoreDb(),
    componentName = 'FirebaseSetDocument',
    trackPerformance = true,
    ...mutationOptions
  } = options;
  
  // Create a memoized mutation function
  const setDocument = useCallback(async ({ path, data, merge = false }: { path: string; data: T; merge?: boolean }) => {
    const docRef = doc(db, path);
    await setDoc(docRef, data as WithFieldValue<DocumentData>, { merge });
  }, [db]);
  
  // Use the optimized mutation
  return useOptimizedMutation<void, Error, { path: string; data: T; merge?: boolean }>({
    mutationFn: setDocument,
    componentName,
    mutationName: 'set_document',
    trackPerformance,
    ...mutationOptions
  });
}

/**
 * Hook for updating a document in Firestore
 * @param options Mutation options
 * @returns Mutation result
 */
export function useFirebaseUpdateDocument<T = Partial<DocumentData>>(
  options: {
    /**
     * Firestore instance (optional, will use default if not provided)
     */
    db?: Firestore;
    
    /**
     * Component name for performance monitoring
     */
    componentName?: string;
    
    /**
     * Whether to track performance
     */
    trackPerformance?: boolean;
  } & Omit<OptimizedMutationOptions<void, Error, { path: string; data: T }, unknown>, 'mutationFn' | 'mutationKey'>
) {
  const {
    db = getFirestoreDb(),
    componentName = 'FirebaseUpdateDocument',
    trackPerformance = true,
    ...mutationOptions
  } = options;
  
  // Create a memoized mutation function
  const updateDocument = useCallback(async ({ path, data }: { path: string; data: T }) => {
    const docRef = doc(db, path);
    await updateDoc(docRef, data as any);
  }, [db]);
  
  // Use the optimized mutation
  return useOptimizedMutation<void, Error, { path: string; data: T }>({
    mutationFn: updateDocument,
    componentName,
    mutationName: 'update_document',
    trackPerformance,
    ...mutationOptions
  });
}

/**
 * Hook for deleting a document from Firestore
 * @param options Mutation options
 * @returns Mutation result
 */
export function useFirebaseDeleteDocument(
  options: {
    /**
     * Firestore instance (optional, will use default if not provided)
     */
    db?: Firestore;
    
    /**
     * Component name for performance monitoring
     */
    componentName?: string;
    
    /**
     * Whether to track performance
     */
    trackPerformance?: boolean;
  } & Omit<OptimizedMutationOptions<void, Error, string, unknown>, 'mutationFn' | 'mutationKey'>
) {
  const {
    db = getFirestoreDb(),
    componentName = 'FirebaseDeleteDocument',
    trackPerformance = true,
    ...mutationOptions
  } = options;
  
  // Create a memoized mutation function
  const deleteDocument = useCallback(async (path: string) => {
    const docRef = doc(db, path);
    await deleteDoc(docRef);
  }, [db]);
  
  // Use the optimized mutation
  return useOptimizedMutation<void, Error, string>({
    mutationFn: deleteDocument,
    componentName,
    mutationName: 'delete_document',
    trackPerformance,
    ...mutationOptions
  });
} 