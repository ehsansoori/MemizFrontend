import type { Deck, SavedCard } from '@/types/cards'
import type { CardTemplate, DeckTypeId } from '@/types/deckProfile'
import {
  BASIC_TEMPLATE_ID,
  CUSTOM_TEMPLATE_PREFIX,
  getBuiltinTemplate,
  getBuiltinTemplates,
} from '@/domain/cardTemplates'
import { cloneCardTemplate } from '@/domain/cardTemplateSnapshot'
import { normalizeTemplateId } from '@/domain/migrateTemplateIds'
import { alignCardDataToTemplate } from '@/domain/templateUtils'
import { listTemplatesForDeckType as filterTemplatesForDeckType } from '@/domain/templateDeckTypes'
import { customTemplateRepository } from '@/storage/customTemplateRepository'

export function resolveDeckDefaultTemplateId(
  deck: Pick<Deck, 'defaultTemplateId' | 'templateId'> | undefined,
): string {
  const raw = deck?.defaultTemplateId ?? deck?.templateId ?? BASIC_TEMPLATE_ID
  return normalizeTemplateId(raw) || BASIC_TEMPLATE_ID
}

/** True when two stored template ids resolve to the same template definition. */
export function templatesReferToSameTemplate(
  templateIdA: string | undefined,
  templateIdB: string | undefined,
): boolean {
  const a = normalizeTemplateId(templateIdA ?? BASIC_TEMPLATE_ID) || BASIC_TEMPLATE_ID
  const b = normalizeTemplateId(templateIdB ?? BASIC_TEMPLATE_ID) || BASIC_TEMPLATE_ID
  if (a === b) return true
  return resolveCardTemplate(a).id === resolveCardTemplate(b).id
}

/**
 * Template for rendering a saved card. Uses the card's frozen template snapshot.
 */
export function resolveDisplayTemplateForCard(card: SavedCard): CardTemplate {
  return resolveSavedCardTemplate(card)
}

export function alignCardDataForDisplay(card: SavedCard) {
  const template = resolveSavedCardTemplate(card)
  return alignCardDataToTemplate(template, card.data)
}

/**
 * Template id bound to a saved card (from snapshot or legacy templateId).
 */
export function resolveSavedCardTemplateId(card: SavedCard): string {
  const raw = card.templateSnapshot?.id ?? card.templateId ?? BASIC_TEMPLATE_ID
  return normalizeTemplateId(raw) || BASIC_TEMPLATE_ID
}

/** Frozen template for a saved card — never the deck's live template definition. */
export function resolveSavedCardTemplate(card: SavedCard): CardTemplate {
  if (card.templateSnapshot) {
    return cloneCardTemplate(card.templateSnapshot)
  }
  return resolveCardTemplate(resolveSavedCardTemplateId(card))
}

/** @deprecated Use resolveDeckDefaultTemplateId */
export function resolveDeckTemplateId(deck: Deck | undefined): string {
  return resolveDeckDefaultTemplateId(deck)
}

export function resolveCardTemplate(templateId: string | undefined): CardTemplate {
  const id = normalizeTemplateId(templateId ?? BASIC_TEMPLATE_ID) || BASIC_TEMPLATE_ID
  if (id.startsWith(CUSTOM_TEMPLATE_PREFIX)) {
    return customTemplateRepository.getById(id) ?? getBuiltinTemplate(BASIC_TEMPLATE_ID)!
  }
  return getBuiltinTemplate(id) ?? getBuiltinTemplate(BASIC_TEMPLATE_ID)!
}

export function resolveDeckDefaultTemplate(
  deck: Pick<Deck, 'defaultTemplateId' | 'templateId'> | undefined,
): CardTemplate {
  return resolveCardTemplate(resolveDeckDefaultTemplateId(deck))
}

/** @deprecated Use resolveDeckDefaultTemplate */
export function resolveDeckCardTemplate(
  deck: Pick<Deck, 'defaultTemplateId' | 'templateId'> | undefined,
): CardTemplate {
  return resolveDeckDefaultTemplate(deck)
}

export function listAllTemplates(): CardTemplate[] {
  return [...getBuiltinTemplates(), ...customTemplateRepository.getAll()]
}

/** Full catalog for template pickers. Selection is tracked separately via `value`. */
export function listTemplatesForPicker(): CardTemplate[] {
  return listAllTemplates()
}

export function listTemplatesForDeckType(deckTypeId: DeckTypeId | undefined): CardTemplate[] {
  return filterTemplatesForDeckType(deckTypeId)
}
