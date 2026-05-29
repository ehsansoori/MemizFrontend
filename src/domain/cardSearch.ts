import { ALL_CARD_FIELD_KEYS } from '@/store/generatedSession/constants'
import type { CardFieldKey, GeneratedCardData, SavedCard } from '@/types/cards'
import { fieldLabel } from '@/utils/renderCardFace'

/** Which card field(s) to search in Review. */
export type ReviewSearchField = CardFieldKey | 'all'

export const REVIEW_SEARCH_FIELD_OPTIONS: { value: ReviewSearchField; label: string }[] =
  [
    { value: 'all', label: 'All fields' },
    ...ALL_CARD_FIELD_KEYS.map((key) => ({
      value: key,
      label: fieldLabel(key),
    })),
  ]

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFKC').trim()
}

/** Plain text for exactly one searchable field (no labels, no other fields). */
export function getFieldSearchText(
  data: GeneratedCardData,
  field: ReviewSearchField,
): string {
  switch (field) {
    case 'all': {
      const parts: string[] = [data.word]
      if (data.phonetic) parts.push(data.phonetic)
      if (data.partOfSpeech) parts.push(data.partOfSpeech)
      if (data.targetMeaning) parts.push(data.targetMeaning)
      if (data.englishMeaning) parts.push(data.englishMeaning)
      if (data.notes) parts.push(data.notes)
      for (const ex of data.examples) {
        parts.push(ex.text)
        if (ex.translation) parts.push(ex.translation)
      }
      return parts.join('\n')
    }
    case 'word':
      return data.word ?? ''
    case 'phonetic':
      return data.phonetic ?? ''
    case 'partOfSpeech':
      return data.partOfSpeech ?? ''
    case 'targetMeaning':
      return data.targetMeaning ?? ''
    case 'englishMeaning':
      return data.englishMeaning ?? ''
    case 'notes':
      return data.notes ?? ''
    case 'examples':
      return data.examples.map((e) => e.text).join('\n')
    case 'exampleTranslations':
      return data.examples
        .map((e) => e.translation ?? '')
        .filter(Boolean)
        .join('\n')
    default:
      return ''
  }
}

/** Split filter input into words (each must match the same field). */
export function tokenizeSearchQuery(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean)
}

/**
 * Case-insensitive match: each query token must appear as a prefix of a word
 * in the field text (typing "fi" matches "fish", not "dictionary").
 */
export function fieldTextMatchesQuery(
  fieldText: string,
  tokens: string[],
): boolean {
  if (tokens.length === 0) return true

  const normalized = normalizeText(fieldText)
  if (!normalized) return false

  const words = normalized.split(/[\s,.;·/]+/).filter(Boolean)

  return tokens.every((token) => {
    if (normalized.startsWith(token)) return true
    return words.some((word) => word.startsWith(token))
  })
}

/** Higher score = better prefix match (for ordering). */
function scoreFieldMatch(fieldText: string, tokens: string[]): number {
  if (!fieldTextMatchesQuery(fieldText, tokens)) return 0

  const normalized = normalizeText(fieldText)
  const words = normalized.split(/[\s,.;·/]+/).filter(Boolean)
  let score = 0

  for (const token of tokens) {
    if (normalized.startsWith(token)) {
      score += 100 - token.length
      continue
    }
    for (const word of words) {
      if (word.startsWith(token)) {
        score += 50 - Math.min(token.length, word.length)
        break
      }
    }
  }
  return score
}

export function scoreSavedCardSearch(
  card: SavedCard,
  tokens: string[],
  field: ReviewSearchField,
): number {
  if (tokens.length === 0) return 1
  const fieldText = getFieldSearchText(card.data, field)
  return scoreFieldMatch(fieldText, tokens)
}

/** Filter to cards matching every typed token in the selected field only. */
export function filterAndRankCardsBySearch(
  cards: SavedCard[],
  query: string,
  field: ReviewSearchField,
): SavedCard[] {
  const tokens = tokenizeSearchQuery(query)
  if (tokens.length === 0) return cards

  return cards
    .map((card) => ({
      card,
      score: scoreSavedCardSearch(card, tokens, field),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.card)
}
