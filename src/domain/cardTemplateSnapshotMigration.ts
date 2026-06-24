import { stampCardTemplateSnapshot } from '@/domain/cardTemplateSnapshot'
import {
  resolveCardTemplate,
  resolveSavedCardTemplateId,
  templatesReferToSameTemplate,
} from '@/domain/resolveDeckTemplate'
import { storage } from '@/storage/adapter'
import type { SavedCard } from '@/types/cards'

/**
 * Persist a template snapshot on cards that still resolve by templateId only.
 * Call before changing a live template definition so existing cards stay frozen.
 */
export async function freezeDeckCardSnapshots(
  deckId: string,
  templateId: string,
): Promise<void> {
  const cards = await storage.cards.getByDeckId(deckId)
  const template = resolveCardTemplate(templateId)
  const updates: SavedCard[] = []

  for (const card of cards) {
    if (card.templateSnapshot) continue
    if (!templatesReferToSameTemplate(resolveSavedCardTemplateId(card), templateId)) continue
    updates.push(stampCardTemplateSnapshot(card, template))
  }

  if (updates.length > 0) {
    await storage.cards.putMany(updates)
  }
}

/** One-time backfill for cards saved before template snapshots existed. */
export async function migrateMissingCardTemplateSnapshots(): Promise<void> {
  const cards = await storage.cards.getAll()
  const updates: SavedCard[] = []

  for (const card of cards) {
    if (card.templateSnapshot) continue
    const template = resolveCardTemplate(resolveSavedCardTemplateId(card))
    updates.push(stampCardTemplateSnapshot(card, template))
  }

  if (updates.length > 0) {
    await storage.cards.putMany(updates)
  }
}
