import Dexie, { type EntityTable } from 'dexie'
import type {
  StoredAppSettings,
  StoredCard,
  StoredDeck,
  StoredReviewHistory,
} from '@/storage/types'

export class MemizDatabase extends Dexie {
  decks!: EntityTable<StoredDeck, 'id'>
  cards!: EntityTable<StoredCard, 'id'>
  reviewHistory!: EntityTable<StoredReviewHistory, 'id'>
  settings!: EntityTable<StoredAppSettings, 'id'>

  constructor() {
    super('memiz')

    this.version(1).stores({
      decks: 'id, name, updatedAt, syncStatus, lastUsedAt',
      cards: 'id, deckId, updatedAt, syncStatus, savedAt',
      reviewHistory: 'id, cardId, deckId, reviewedAt, syncStatus',
    })

    this.version(2).stores({
      decks: 'id, name, updatedAt, syncStatus, lastUsedAt',
      cards: 'id, deckId, updatedAt, syncStatus, savedAt, dueAt',
      reviewHistory: 'id, cardId, deckId, reviewedAt, syncStatus',
      settings: 'id',
    })
  }
}

export const db = new MemizDatabase()
