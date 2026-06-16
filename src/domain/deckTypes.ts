import type { DeckTypeId } from '@/types/deckProfile'

export type DeckTypeDefinition = {
  id: DeckTypeId
  label: string
  description: string
  supportsLanguageSettings: boolean
}

export const DECK_TYPES: DeckTypeDefinition[] = [
  {
    id: 'language_learning',
    label: 'Language Learning',
    description: 'Vocabulary, phrases, and pronunciation.',
    supportsLanguageSettings: true,
  },
  {
    id: 'it_certification',
    label: 'IT Certification',
    description: 'CompTIA, AWS, and technical exams.',
    supportsLanguageSettings: false,
  },
  {
    id: 'medical',
    label: 'Medical',
    description: 'Terms, symptoms, and treatments.',
    supportsLanguageSettings: false,
  },
  {
    id: 'history',
    label: 'History',
    description: 'Events, dates, and figures.',
    supportsLanguageSettings: false,
  },
  {
    id: 'geography',
    label: 'Geography',
    description: 'Places, capitals, and maps.',
    supportsLanguageSettings: false,
  },
  {
    id: 'law',
    label: 'Law',
    description: 'Cases, statutes, and definitions.',
    supportsLanguageSettings: false,
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Any subject with your own template.',
    supportsLanguageSettings: false,
  },
]

export const DEFAULT_DECK_TYPE_ID: DeckTypeId = 'custom'

export function getDeckType(id: DeckTypeId | undefined): DeckTypeDefinition {
  return DECK_TYPES.find((t) => t.id === id) ?? DECK_TYPES.find((t) => t.id === 'custom')!
}

export function deckTypeSupportsLanguageSettings(id: DeckTypeId | undefined): boolean {
  return getDeckType(id).supportsLanguageSettings
}
