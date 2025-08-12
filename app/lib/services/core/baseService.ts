/**
 * Enhanced base service interface and implementation for standardizing service patterns
 */

import { FirebaseError } from 'firebase/app';
import { 
  DocumentData, 
  QueryDocumentSnapshot, 
  WriteBatch,
  runTransaction,
  Transaction,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ServiceError, ServiceErrorType, createServiceError } from './errorHandler';
import { ErrorCategory, ErrorSeverity, logError } from '../../errorHandler';

/**
 * Base service interface for all services
 */
export interface BaseService<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  create(data: CreateData): Promise<T>;
  read(id: string): Promise<T | null>;
  update(id: string, data: UpdateData): Promise<T>;
  delete(id: string): Promise<void>;
  list(filters?: Record<string, unknown>, options?: ListOptions): Promise<ListResult<T>>;
  exists(id: string): Promise<boolean>;
  batch(): BatchOperations<T>;
}

/**
 * List options for pagination and filtering
 */
export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  startAfter?: unknown;
}

/**
 * List result with pagination metadata
 */
export interface ListResult<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
  lastDoc?: unknown;
}

/**
 * Batch operations interface
 */
export interface BatchOperations<T> {
  create(data: CreateData): BatchOperations<T>;
  update(id: string, data: UpdateData): BatchOperations<T>;
  delete(id: string): BatchOperations<T>;
  commit(): Promise<void>;
}

/**
 * Enhanced base service implementation with common functionality
 */
export abstract class BaseServiceImplementation<T, CreateData = Partial<T>, UpdateData = Partial<T>> 
  implements BaseService<T, CreateData, UpdateData> {
  
  protected abstract collectionName: string;
  protected abstract validateCreateData(data: CreateData): void;
  protected abstract validateUpdateData(data: UpdateData): void;
  protected abstract mapDocumentToEntity(doc: QueryDocumentSnapshot<DocumentData>): T;
  protected abstract mapEntityToDocument(entity: T): DocumentData;
  
  /**
   * Create a new entity
   */
  async create(data: CreateData): Promise<T> {
    try {
      this.validateCreateData(data);
      
      const collectionRef = collection(db, this.collectionName);
      
      const docData = {
        ...(this.mapEntityToDocument(data as T)),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collectionRef, docData);
      const docSnap = await getDoc(docRef);
      
      return this.mapDocumentToEntity(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw this.handleServiceError(error, 'create');
    }
  }
  
  /**
   * Read an entity by ID
   */
  async read(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return this.mapDocumentToEntity(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw this.handleServiceError(error, 'read');
    }
  }
  
  /**
   * Update an entity
   */
  async update(id: string, data: UpdateData): Promise<T> {
    try {
      this.validateUpdateData(data);
      
      const docRef = doc(db, this.collectionName, id);
      
      const updateData = {
        ...(this.mapEntityToDocument(data as T)),
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, updateData);
      
      // Fetch updated document
      const updatedDoc = await getDoc(docRef);
      return this.mapDocumentToEntity(updatedDoc as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw this.handleServiceError(error, 'update');
    }
  }
  
  /**
   * Delete an entity
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleServiceError(error, 'delete');
    }
  }
  
  /**
   * List entities with optional filtering and pagination
   */
  async list(filters?: Record<string, unknown>, options?: ListOptions): Promise<ListResult<T>> {
    try {
      let queryRef = collection(db, this.collectionName) as any;
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([field, value]) => {
          queryRef = query(queryRef, where(field, '==', value));
        });
      }
      
      // Apply ordering
      if (options?.orderBy) {
        queryRef = query(queryRef, orderBy(options.orderBy.field, options.orderBy.direction));
      }
      
      // Apply pagination
      if (options?.startAfter) {
        queryRef = query(queryRef, startAfter(options.startAfter));
      }
      
      if (options?.limit) {
        queryRef = query(queryRef, limit(options.limit + 1)); // +1 to check if there are more
      }
      
      const snapshot = await getDocs(queryRef);
      const items = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => this.mapDocumentToEntity(doc));
      
      const hasMore = options?.limit ? items.length > options.limit : false;
      const resultItems = hasMore ? items.slice(0, options.limit!) : items;
      const lastDoc = hasMore && snapshot.docs.length > 1 ? snapshot.docs[snapshot.docs.length - 2] : null;
      
      return {
        items: resultItems,
        hasMore,
        lastDoc
      };
    } catch (error) {
      throw this.handleServiceError(error, 'list');
    }
  }
  
  /**
   * Check if an entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      throw this.handleServiceError(error, 'exists');
    }
  }
  
  /**
   * Create batch operations
   */
  batch(): BatchOperations<T> {
    const batch = new WriteBatchImplementation<T>(this);
    return batch;
  }
  
  /**
   * Execute operations within a transaction
   */
  protected async executeTransaction<TResult>(
    operations: (transaction: Transaction) => Promise<TResult>
  ): Promise<TResult> {
    try {
      return await runTransaction(db, operations);
    } catch (error) {
      throw this.handleServiceError(error, 'transaction');
    }
  }
  
  /**
   * Create a write batch for multiple operations
   */
  protected createBatch(): WriteBatch {
    return writeBatch(db);
  }
  
  /**
   * Handle service errors consistently
   */
  protected handleServiceError(error: unknown, operation: string): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }
    
    if (error instanceof FirebaseError) {
      return createServiceError(
        `Firebase error during ${operation}: ${error.message}`,
        ServiceErrorType.FIREBASE_ERROR,
        error.code,
        error
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createServiceError(
      `Service error during ${operation}: ${errorMessage}`,
      ServiceErrorType.UNKNOWN_ERROR,
      undefined,
      error instanceof Error ? error : new Error(errorMessage)
    );
  }
  
  /**
   * Log service operation for monitoring
   */
  protected logOperation(operation: string, metadata?: Record<string, unknown>): void {
    logError(new Error(`Service operation: ${operation}`), {
      category: ErrorCategory.API,
      severity: ErrorSeverity.INFO,
      context: {
        action: operation,
        additionalData: {
          service: this.constructor.name,
          collection: this.collectionName,
          ...metadata
        }
      }
    });
  }
}

/**
 * Write batch implementation for batch operations
 */
class WriteBatchImplementation<T> implements BatchOperations<T> {
  private batch: WriteBatch;
  private service: BaseServiceImplementation<T>;
  private operations: Array<() => void> = [];

  constructor(service: BaseServiceImplementation<T>) {
    this.batch = writeBatch(db);
    this.service = service;
  }

  create(data: CreateData): BatchOperations<T> {
    this.operations.push(() => {
      this.service.validateCreateData(data);
      const docData = {
        ...this.service.mapEntityToDocument(data as T),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const docRef = doc(db, this.service.collectionName);
      this.batch.set(docRef, docData);
    });
    return this;
  }

  update(id: string, data: UpdateData): BatchOperations<T> {
    this.operations.push(() => {
      this.service.validateUpdateData(data);
      const docRef = doc(db, this.service.collectionName, id);
      const updateData = {
        ...this.service.mapEntityToDocument(data as T),
        updatedAt: new Date()
      };
      this.batch.update(docRef, updateData);
    });
    return this;
  }

  delete(id: string): BatchOperations<T> {
    this.operations.push(() => {
      const docRef = doc(db, this.service.collectionName, id);
      this.batch.delete(docRef);
    });
    return this;
  }

  async commit(): Promise<void> {
    try {
      // Execute all operations
      this.operations.forEach(operation => operation());
      
      // Commit the batch
      await this.batch.commit();
    } catch (error) {
      throw this.service.handleServiceError(error, 'batch_commit');
    }
  }
}

// Import writeBatch from firebase/firestore
import { writeBatch } from 'firebase/firestore'; 