import type { GeneratedCardData } from '@/types/cards'
import type { CardTemplate, DeckSettings, DeckTypeId } from '@/types/deckProfile'
import type { StudyProgress } from '@/types/study'

/** Local-first sync lifecycle (ready for PostgreSQL / API sync later). */
export type SyncStatus = 'pending' | 'synced' | 'modified' | 'deleted'

export type StorageMode = 'local-only' | 'sync-enabled'

export interface SyncMetadata {
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
  /** Server id after first successful sync (future). */
  remoteId?: string
  /** Last known server revision for conflict detection (future). */
  remoteUpdatedAt?: string
}

export interface StoredDeck extends SyncMetadata {
  id: string
  name: string
  lastUsedAt?: string
  deckTypeId?: DeckTypeId
  defaultTemplateId?: string
  /** @deprecated Use defaultTemplateId */
  templateId?: string
  settings?: DeckSettings
}

export interface StoredCard extends SyncMetadata {
  id: string
  deckId: string
  originalGeneratedCardId: string
  templateId?: string
  templateSnapshot?: CardTemplate
  lastGeneratedAt?: string
  lastGeneratedModelVersion?: string
  front: string
  back: string
  data: GeneratedCardData
  savedAt: string
  study: StudyProgress
  /** Denormalized for IndexedDB queries (matches study.dueAt). */
  dueAt: string
}

export const APP_SETTINGS_ID = 'app' as const

export interface StoredAppSettings extends SyncMetadata {
  id: typeof APP_SETTINGS_ID
  activeDeckId: string | null
}

export interface StoredReviewHistory extends SyncMetadata {
  id: string
  cardId: string
  deckId: string
  reviewedAt: string
  /** e.g. again | hard | good | easy — optional until review UI exists */
  rating?: string
  elapsedMs?: number
}

export type EntityKind = 'deck' | 'card' | 'reviewHistory'
