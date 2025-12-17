/**
 * Sync Queue Service
 * Manages offline operations and syncs them to Supabase when online
 */

const SYNC_QUEUE_KEY = 'shopos_sync_queue';

export type SyncOperationType = 
  | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT'
  | 'CREATE_SALE' | 'UPDATE_SALE'
  | 'CREATE_CUSTOMER' | 'UPDATE_CUSTOMER'
  | 'CREATE_CATEGORY' | 'UPDATE_CATEGORY'
  | 'CREATE_SUPPLIER' | 'UPDATE_SUPPLIER'
  | 'CREATE_EXPENSE' | 'UPDATE_EXPENSE'
  | 'CREATE_GIFT_CARD' | 'UPDATE_GIFT_CARD' | 'DELETE_GIFT_CARD'
  | 'CREATE_STOCK_MOVEMENT'
  | 'CREATE_DEBT_TRANSACTION'
  | 'CREATE_USER' | 'UPDATE_USER'
  | 'UPDATE_SETTINGS'
  | 'CREATE_ACTIVITY_LOG'
  | 'UPDATE_SUBSCRIPTION'
  | 'CREATE_PAYMENT'
  | 'CREATE_EXPENSE_CATEGORY'
  | 'CREATE_EXPENSE_TEMPLATE' | 'UPDATE_EXPENSE_TEMPLATE';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  data: any;
  timestamp: string;
  entityId?: string; // The ID of the entity being operated on
  retryCount: number;
}

export interface SyncQueueState {
  operations: SyncOperation[];
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
}

// Load sync queue from localStorage
export const loadSyncQueue = (): SyncQueueState => {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load sync queue:', error);
  }
  return {
    operations: [],
    lastSyncAttempt: null,
    lastSuccessfulSync: null
  };
};

// Save sync queue to localStorage
export const saveSyncQueue = (queue: SyncQueueState): void => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save sync queue:', error);
  }
};

// Generate unique operation ID
const generateOpId = (): string => {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Add operation to queue
export const queueOperation = (
  type: SyncOperationType,
  data: any,
  entityId?: string
): void => {
  const queue = loadSyncQueue();
  
  // Check for duplicate operations on same entity (avoid redundant syncs)
  // For updates, we can replace the previous pending update
  if (entityId && type.startsWith('UPDATE_')) {
    const existingIndex = queue.operations.findIndex(
      op => op.entityId === entityId && op.type === type
    );
    if (existingIndex >= 0) {
      // Replace with newer data
      queue.operations[existingIndex] = {
        ...queue.operations[existingIndex],
        data,
        timestamp: new Date().toISOString()
      };
      saveSyncQueue(queue);
      return;
    }
  }
  
  const operation: SyncOperation = {
    id: generateOpId(),
    type,
    data,
    timestamp: new Date().toISOString(),
    entityId,
    retryCount: 0
  };
  
  queue.operations.push(operation);
  saveSyncQueue(queue);
  console.log(`📋 Queued ${type} operation for sync`);
};

// Remove operation from queue after successful sync
export const removeOperation = (operationId: string): void => {
  const queue = loadSyncQueue();
  queue.operations = queue.operations.filter(op => op.id !== operationId);
  saveSyncQueue(queue);
};

// Mark operation as failed and increment retry count
export const markOperationFailed = (operationId: string): void => {
  const queue = loadSyncQueue();
  const operation = queue.operations.find(op => op.id === operationId);
  if (operation) {
    operation.retryCount += 1;
    // Remove operations that have failed too many times (max 5 retries)
    if (operation.retryCount >= 5) {
      console.warn(`⚠️ Removing operation ${operationId} after 5 failed retries`);
      queue.operations = queue.operations.filter(op => op.id !== operationId);
    }
  }
  saveSyncQueue(queue);
};

// Clear all operations (after full sync)
export const clearQueue = (): void => {
  const queue = loadSyncQueue();
  queue.operations = [];
  queue.lastSuccessfulSync = new Date().toISOString();
  saveSyncQueue(queue);
};

// Update last sync attempt
export const updateLastSyncAttempt = (): void => {
  const queue = loadSyncQueue();
  queue.lastSyncAttempt = new Date().toISOString();
  saveSyncQueue(queue);
};

// Update last successful sync
export const updateLastSuccessfulSync = (): void => {
  const queue = loadSyncQueue();
  queue.lastSuccessfulSync = new Date().toISOString();
  saveSyncQueue(queue);
};

// Get pending operations count
export const getPendingCount = (): number => {
  return loadSyncQueue().operations.length;
};

// Check if there are pending operations
export const hasPendingOperations = (): boolean => {
  return loadSyncQueue().operations.length > 0;
};

// Get all pending operations
export const getPendingOperations = (): SyncOperation[] => {
  return loadSyncQueue().operations;
};

