import { normalizeStudyProgress } from '@/domain/studyProgress'
import { normalizeTemplateId } from '@/domain/migrateTemplateIds'
import { BASIC_TEMPLATE_ID } from '@/domain/templateIds'
import type { Deck, SavedCard } from '@/types/cards'
import type { StoredAppSettings, StoredCard, StoredDeck, SyncStatus } from '@/storage/types'

function deckDefaultTemplateId(deck: Deck): string | undefined {
  return deck.defaultTemplateId ?? deck.templateId
}

export function deckToStored(deck: Deck, syncStatus: SyncStatus = 'pending'): StoredDeck {
  const defaultTemplateId = deckDefaultTemplateId(deck)
  return {
    id: deck.id,
    name: deck.name,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    lastUsedAt: deck.lastUsedAt,
    deckTypeId: deck.deckTypeId,
    defaultTemplateId,
    templateId: defaultTemplateId,
    settings: deck.settings,
    syncStatus,
  }
}

export function storedToDeck(row: StoredDeck): Deck {
  const defaultTemplateId = normalizeTemplateId(row.defaultTemplateId ?? row.templateId)
  const templateId = normalizeTemplateId(row.templateId ?? row.defaultTemplateId)
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastUsedAt: row.lastUsedAt,
    deckTypeId: row.deckTypeId,
    defaultTemplateId,
    templateId,
    settings: row.settings,
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
    templateId: card.templateId,
    templateSnapshot: card.templateSnapshot,
    lastGeneratedAt: card.lastGeneratedAt,
    lastGeneratedModelVersion: card.lastGeneratedModelVersion,
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
    templateId: normalizeTemplateId(row.templateId) || BASIC_TEMPLATE_ID,
    templateSnapshot: row.templateSnapshot,
    lastGeneratedAt: row.lastGeneratedAt,
    lastGeneratedModelVersion: row.lastGeneratedModelVersion,
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
