import type { SyncMetadata } from '@/storage/types'

export type ConflictResolution = 'keep-local' | 'keep-remote' | 'merge' | 'manual'

export type SyncConflict<T extends SyncMetadata> = {
  kind: 'deck' | 'card' | 'reviewHistory'
  local: T
  remote: T
  detectedAt: string
}

/** True when local row was edited after last successful sync. */
export function hasLocalChanges(row: SyncMetadata): boolean {
  return row.syncStatus === 'pending' || row.syncStatus === 'modified'
}

/** Mark row dirty after a local write (before cloud push). */
export function markPending<T extends SyncMetadata>(row: T): T {
  const now = new Date().toISOString()
  return {
    ...row,
    syncStatus: row.syncStatus === 'synced' ? 'modified' : 'pending',
    updatedAt: now,
  }
}

/** After successful API upsert (future sync). */
export function markSynced<T extends SyncMetadata>(
  row: T,
  remote?: { id?: string; updatedAt?: string },
): T {
  const now = new Date().toISOString()
  return {
    ...row,
    syncStatus: 'synced',
    updatedAt: now,
    remoteId: remote?.id ?? row.remoteId,
    remoteUpdatedAt: remote?.updatedAt ?? row.remoteUpdatedAt,
  }
}

/** Tombstone for soft delete before remote ack (future). */
export function markDeleted<T extends SyncMetadata>(row: T): T {
  return {
    ...row,
    syncStatus: 'deleted',
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Pick winner by `updatedAt` when both sides changed (future pull/sync).
 * Returns resolution hint — caller applies merge policy.
 */
export function resolveByUpdatedAt<T extends SyncMetadata>(
  local: T,
  remote: T,
): ConflictResolution {
  const localTime = Date.parse(local.updatedAt)
  const remoteTime = Date.parse(remote.updatedAt)
  if (Number.isNaN(localTime) || Number.isNaN(remoteTime)) return 'manual'
  if (localTime === remoteTime) return 'keep-local'
  return localTime > remoteTime ? 'keep-local' : 'keep-remote'
}

export function shouldPushToRemote(row: SyncMetadata): boolean {
  return row.syncStatus === 'pending' || row.syncStatus === 'modified'
}

export function filterActive<T extends SyncMetadata>(rows: T[]): T[] {
  return rows.filter((r) => r.syncStatus !== 'deleted')
}
