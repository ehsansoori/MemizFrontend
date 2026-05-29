import { normalizeStudyProgress } from '@/domain/studyProgress'
import type { Deck, SavedCard } from '@/types/cards'
import type { StoredAppSettings, StoredCard, StoredDeck, SyncStatus } from '@/storage/types'

export function deckToStored(deck: Deck, syncStatus: SyncStatus = 'pending'): StoredDeck {
  return {
    id: deck.id,
    name: deck.name,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    lastUsedAt: deck.lastUsedAt,
    syncStatus,
  }
}

export function storedToDeck(row: StoredDeck): Deck {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastUsedAt: row.lastUsedAt,
  }
}

export function savedCardToStored(
  card: SavedCard,
  syncStatus: SyncStatus = 'pending',
): StoredCard {
  const study = normalizeStudyProgress(card.study, card.savedAt)
  return {
    id: card.id,
    deckId: card.deckId,
    originalGeneratedCardId: card.originalGeneratedCardId,
    front: card.front,
    back: card.back,
    data: card.data,
    savedAt: card.savedAt,
    createdAt: card.savedAt,
    updatedAt: card.updatedAt,
    study,
    dueAt: study.dueAt,
    syncStatus,
  }
}

export function storedToSavedCard(row: StoredCard): SavedCard {
  const study = normalizeStudyProgress(row.study, row.savedAt)
  return {
    id: row.id,
    deckId: row.deckId,
    originalGeneratedCardId: row.originalGeneratedCardId,
    front: row.front,
    back: row.back,
    data: row.data,
    savedAt: row.savedAt,
    updatedAt: row.updatedAt,
    study,
  }
}

export function storedActiveDeckId(settings: StoredAppSettings): string | null {
  return settings.activeDeckId
}
