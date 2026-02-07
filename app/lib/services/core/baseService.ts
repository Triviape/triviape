/**
 * Core base service implementation used across app services.
 */

import { FirebaseError } from 'firebase/app';
import {
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
  Transaction,
  WriteBatch,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ErrorCategory, ErrorSeverity, logError } from '../../errorHandler';
import { ServiceError, ServiceErrorType, createServiceError } from './errorHandler';

export interface BaseService<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  create(data: CreateData): Promise<T>;
  read(id: string): Promise<T | null>;
  update(id: string, data: UpdateData): Promise<T>;
  delete(id: string): Promise<void>;
  list(filters?: Record<string, unknown>, options?: ListOptions): Promise<ListResult<T>>;
  exists(id: string): Promise<boolean>;
  batch(): BatchOperations<CreateData, UpdateData>;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  startAfter?: unknown;
}

export interface ListResult<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
  lastDoc?: unknown;
}

export interface BatchOperations<CreateData, UpdateData> {
  create(data: CreateData): BatchOperations<CreateData, UpdateData>;
  update(id: string, data: UpdateData): BatchOperations<CreateData, UpdateData>;
  delete(id: string): BatchOperations<CreateData, UpdateData>;
  commit(): Promise<void>;
}

export abstract class BaseServiceImplementation<T, CreateData = Partial<T>, UpdateData = Partial<T>>
  implements BaseService<T, CreateData, UpdateData> {
  protected abstract collectionName: string;
  protected abstract validateCreateData(data: CreateData): void;
  protected abstract validateUpdateData(data: UpdateData): void;
  protected abstract mapDocumentToEntity(doc: QueryDocumentSnapshot<DocumentData>): T;
  protected abstract mapEntityToDocument(entity: T): DocumentData;

  async create(data: CreateData): Promise<T> {
    try {
      this.validateCreateData(data);

      const docData = {
        ...this.mapEntityToDocument(data as unknown as T),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), docData);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Created document not found');
      }

      return this.mapDocumentToEntity(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw this.handleServiceError(error, 'create');
    }
  }

  async read(id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, id));
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapDocumentToEntity(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw this.handleServiceError(error, 'read');
    }
  }

  async update(id: string, data: UpdateData): Promise<T> {
    try {
      this.validateUpdateData(data);

      const docRef = doc(db, this.collectionName, id);
      const docData = {
        ...this.mapEntityToDocument(data as unknown as T),
        updatedAt: new Date(),
      };

      await updateDoc(docRef, docData);
      const updatedDoc = await getDoc(docRef);

      if (!updatedDoc.exists()) {
        throw new Error(`Document ${id} not found after update`);
      }

      return this.mapDocumentToEntity(updatedDoc as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw this.handleServiceError(error, 'update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      throw this.handleServiceError(error, 'delete');
    }
  }

  async list(filters?: Record<string, unknown>, options?: ListOptions): Promise<ListResult<T>> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters) {
        for (const [field, value] of Object.entries(filters)) {
          constraints.push(where(field, '==', value));
        }
      }

      if (options?.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }

      if (options?.startAfter !== undefined) {
        constraints.push(startAfter(options.startAfter));
      }

      const queryLimit = options?.limit;
      if (queryLimit) {
        constraints.push(limit(queryLimit + 1));
      }

      const snapshot = await getDocs(query(collection(db, this.collectionName), ...constraints));
      const mappedItems = snapshot.docs.map((document) =>
        this.mapDocumentToEntity(document as QueryDocumentSnapshot<DocumentData>)
      );

      const hasMore = !!queryLimit && mappedItems.length > queryLimit;
      const items = hasMore && queryLimit ? mappedItems.slice(0, queryLimit) : mappedItems;

      return {
        items,
        hasMore,
        lastDoc: hasMore
          ? snapshot.docs[snapshot.docs.length - 2] ?? null
          : snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null,
      };
    } catch (error) {
      throw this.handleServiceError(error, 'list');
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const docSnap = await getDoc(doc(db, this.collectionName, id));
      return docSnap.exists();
    } catch (error) {
      throw this.handleServiceError(error, 'exists');
    }
  }

  batch(): BatchOperations<CreateData, UpdateData> {
    const firestoreBatch = writeBatch(db);
    const operations: Array<() => void> = [];

    return {
      create: (data: CreateData) => {
        operations.push(() => {
          this.validateCreateData(data);
          const docRef = doc(collection(db, this.collectionName));
          firestoreBatch.set(docRef, {
            ...this.mapEntityToDocument(data as unknown as T),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
        return this.batchFromExisting(firestoreBatch, operations);
      },
      update: (id: string, data: UpdateData) => {
        operations.push(() => {
          this.validateUpdateData(data);
          firestoreBatch.update(doc(db, this.collectionName, id), {
            ...this.mapEntityToDocument(data as unknown as T),
            updatedAt: new Date(),
          });
        });
        return this.batchFromExisting(firestoreBatch, operations);
      },
      delete: (id: string) => {
        operations.push(() => {
          firestoreBatch.delete(doc(db, this.collectionName, id));
        });
        return this.batchFromExisting(firestoreBatch, operations);
      },
      commit: async () => {
        try {
          operations.forEach((operation) => operation());
          await firestoreBatch.commit();
        } catch (error) {
          throw this.handleServiceError(error, 'batch_commit');
        }
      },
    };
  }

  protected async executeTransaction<TResult>(
    operations: (transaction: Transaction) => Promise<TResult>
  ): Promise<TResult> {
    try {
      return await runTransaction(db, operations);
    } catch (error) {
      throw this.handleServiceError(error, 'transaction');
    }
  }

  protected createBatch(): WriteBatch {
    return writeBatch(db);
  }

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

    const message = error instanceof Error ? error.message : String(error);
    return createServiceError(
      `Service error during ${operation}: ${message}`,
      ServiceErrorType.UNKNOWN_ERROR,
      undefined,
      error instanceof Error ? error : new Error(message)
    );
  }

  protected logOperation(operation: string, metadata?: Record<string, unknown>): void {
    logError(new Error(`Service operation: ${operation}`), {
      category: ErrorCategory.API,
      severity: ErrorSeverity.INFO,
      context: {
        action: operation,
        additionalData: {
          service: this.constructor.name,
          collection: this.collectionName,
          ...metadata,
        },
      },
    });
  }

  private batchFromExisting(
    firestoreBatch: WriteBatch,
    operations: Array<() => void>
  ): BatchOperations<CreateData, UpdateData> {
    return {
      create: (data: CreateData) => {
        operations.push(() => {
          this.validateCreateData(data);
          const docRef = doc(collection(db, this.collectionName));
          firestoreBatch.set(docRef, {
            ...this.mapEntityToDocument(data as unknown as T),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        });
        return this.batchFromExisting(firestoreBatch, operations);
      },
      update: (id: string, data: UpdateData) => {
        operations.push(() => {
          this.validateUpdateData(data);
          firestoreBatch.update(doc(db, this.collectionName, id), {
            ...this.mapEntityToDocument(data as unknown as T),
            updatedAt: new Date(),
          });
        });
        return this.batchFromExisting(firestoreBatch, operations);
      },
      delete: (id: string) => {
        operations.push(() => {
          firestoreBatch.delete(doc(db, this.collectionName, id));
        });
        return this.batchFromExisting(firestoreBatch, operations);
      },
      commit: async () => {
        try {
          operations.forEach((operation) => operation());
          await firestoreBatch.commit();
        } catch (error) {
          throw this.handleServiceError(error, 'batch_commit');
        }
      },
    };
  }
}
