import {
  resolveSavedCardTemplateId,
  templatesReferToSameTemplate,
} from '@/domain/resolveDeckTemplate'
import type { SavedCard } from '@/types/cards'

/** Cards in a deck that render with the given template (by id or snapshot). */
export function countDeckCardsUsingTemplate(
  cards: SavedCard[],
  deckId: string,
  templateId: string,
  options?: { excludeCardId?: string },
): number {
  return cards.filter((card) => {
    if (card.deckId !== deckId) return false
    if (options?.excludeCardId && card.id === options.excludeCardId) return false
    return templatesReferToSameTemplate(resolveSavedCardTemplateId(card), templateId)
  }).length
}

export function deckHasOtherCardsUsingTemplate(
  cards: SavedCard[],
  deckId: string,
  templateId: string,
  excludeCardId?: string,
): boolean {
  return countDeckCardsUsingTemplate(cards, deckId, templateId, { excludeCardId }) > 0
}
