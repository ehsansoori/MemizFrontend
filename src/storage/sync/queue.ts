import type { EntityKind, SyncMetadata } from '@/storage/types'
import { shouldPushToRemote } from '@/storage/sync/conflict'

export type PendingSyncItem = {
  entity: EntityKind
  id: string
  syncStatus: SyncMetadata['syncStatus']
  updatedAt: string
}

/** Build a push queue from rows that need cloud sync (future API worker). */
export function buildPendingSyncQueue(
  decks: SyncMetadata[],
  cards: SyncMetadata[],
  reviewHistory: SyncMetadata[],
): PendingSyncItem[] {
  const items: PendingSyncItem[] = []

  for (const d of decks) {
    if (shouldPushToRemote(d)) {
      items.push({
        entity: 'deck',
        id: 'id' in d ? String((d as { id: string }).id) : '',
        syncStatus: d.syncStatus,
        updatedAt: d.updatedAt,
      })
    }
  }
  for (const c of cards) {
    if (shouldPushToRemote(c)) {
      items.push({
        entity: 'card',
        id: 'id' in c ? String((c as { id: string }).id) : '',
        syncStatus: c.syncStatus,
        updatedAt: c.updatedAt,
      })
    }
  }
  for (const r of reviewHistory) {
    if (shouldPushToRemote(r)) {
      items.push({
        entity: 'reviewHistory',
        id: 'id' in r ? String((r as { id: string }).id) : '',
        syncStatus: r.syncStatus,
        updatedAt: r.updatedAt,
      })
    }
  }

  return items.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
}
