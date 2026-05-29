export { db, MemizDatabase } from '@/storage/db'
export { storage, createStorageAdapter, type StorageAdapter } from '@/storage/adapter'
export type {
  SyncStatus,
  StorageMode,
  StoredDeck,
  StoredCard,
  StoredReviewHistory,
  SyncMetadata,
} from '@/storage/types'
export {
  markPending,
  markSynced,
  markDeleted,
  hasLocalChanges,
  resolveByUpdatedAt,
  shouldPushToRemote,
  filterActive,
  type ConflictResolution,
  type SyncConflict,
} from '@/storage/sync/conflict'
export { buildPendingSyncQueue } from '@/storage/sync/queue'
export { getStorageMode, isSyncEnabled } from '@/storage/mode'
