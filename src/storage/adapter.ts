import { isSyncEnabled } from '@/storage/mode'
import { cardRepository } from '@/storage/repositories/cardRepository'
import { deckRepository } from '@/storage/repositories/deckRepository'
import { reviewHistoryRepository } from '@/storage/repositories/reviewHistoryRepository'
import { settingsRepository } from '@/storage/repositories/settingsRepository'
import { buildPendingSyncQueue } from '@/storage/sync/queue'
import type { StorageMode } from '@/storage/types'

/**
 * Storage facade — UI and stores talk to this, not Dexie directly.
 * When sync ships, swap internals to read/write local + remote without changing callers.
 */
export type StorageAdapter = {
  readonly mode: StorageMode
  readonly syncEnabled: boolean
  decks: typeof deckRepository
  cards: typeof cardRepository
  reviewHistory: typeof reviewHistoryRepository
  settings: typeof settingsRepository
  getPendingSyncQueue: () => ReturnType<typeof buildPendingSyncQueueFromDb>
}

async function buildPendingSyncQueueFromDb() {
  const [decks, cards, history] = await Promise.all([
    deckRepository.getPendingSync(),
    cardRepository.getPendingSync(),
    reviewHistoryRepository.getPendingSync(),
  ])
  return buildPendingSyncQueue(decks, cards, history)
}

function createLocalAdapter(): StorageAdapter {
  return {
    mode: 'local-only',
    syncEnabled: false,
    decks: deckRepository,
    cards: cardRepository,
    reviewHistory: reviewHistoryRepository,
    settings: settingsRepository,
    getPendingSyncQueue: buildPendingSyncQueueFromDb,
  }
}

/** Future: wrap local repos with API sync coordinator. */
function createSyncAdapter(): StorageAdapter {
  return {
    mode: 'sync-enabled',
    syncEnabled: true,
    decks: deckRepository,
    cards: cardRepository,
    reviewHistory: reviewHistoryRepository,
    settings: settingsRepository,
    getPendingSyncQueue: buildPendingSyncQueueFromDb,
  }
}

export function createStorageAdapter(): StorageAdapter {
  return isSyncEnabled() ? createSyncAdapter() : createLocalAdapter()
}

/** Singleton used by the app today. */
export const storage = createStorageAdapter()
