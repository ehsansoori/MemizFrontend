import type { DeckTypeId } from '@/types/deckProfile'

export type DeckTypeDefinition = {
  id: DeckTypeId
  label: string
  description: string
  supportsLanguageSettings: boolean
}

/** MVP: Language Learning only in create-deck flow. */
export const DECK_TYPES: DeckTypeDefinition[] = [
  {
    id: 'language_learning',
    label: 'Language Learning',
    description: 'Vocabulary, phrases, and pronunciation.',
    supportsLanguageSettings: true,
  },
]

export const DEFAULT_DECK_TYPE_ID: DeckTypeId = 'language_learning'

export function getDeckType(id: DeckTypeId | undefined): DeckTypeDefinition {
  return (
    DECK_TYPES.find((t) => t.id === id) ??
    DECK_TYPES[0]
  )
}

export function deckTypeSupportsLanguageSettings(id: DeckTypeId | undefined): boolean {
  return getDeckType(id).supportsLanguageSettings
}
