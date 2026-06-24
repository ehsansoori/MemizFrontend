import { BASIC_LANGUAGE_TEMPLATE_ID } from '@/domain/templateIds'
import { getBuiltinTemplates } from '@/domain/cardTemplates'
import type { CardTemplate } from '@/types/deckProfile'
import type { DeckTypeId } from '@/types/deckProfile'

const MVP_DECK_TYPE: DeckTypeId = 'language_learning'

export function normalizeDeckTypeForTemplates(_deckTypeId: DeckTypeId | undefined): DeckTypeId {
  return MVP_DECK_TYPE
}

export function isTemplateCompatibleWithDeckType(
  templateId: string,
  deckTypeId: DeckTypeId | undefined,
): boolean {
  void deckTypeId
  return templateId === BASIC_LANGUAGE_TEMPLATE_ID
}

export function listTemplatesForDeckType(deckTypeId: DeckTypeId | undefined): CardTemplate[] {
  void deckTypeId
  return getBuiltinTemplates().filter((t) => t.id === BASIC_LANGUAGE_TEMPLATE_ID)
}

export function defaultTemplateIdForDeckType(deckTypeId: DeckTypeId | undefined): string {
  void deckTypeId
  return BASIC_LANGUAGE_TEMPLATE_ID
}
