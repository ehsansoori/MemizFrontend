import type { CardFieldKey, CardFieldLayout, GeneratedCardData } from '@/types/cards'
import { fieldTypesInOrder } from '@/utils/cardLayoutModel'

const LABELS: Record<CardFieldKey, string> = {
  word: 'Word',
  phonetic: 'Phonetic',
  partOfSpeech: 'Part of speech',
  targetMeaning: 'Target meaning',
  englishMeaning: 'English meaning',
  examples: 'Examples',
  exampleTranslations: 'Example translations',
  notes: 'Notes',
}

/** Plain-text lines for one card field (search, export). */
export function linesForField(
  data: GeneratedCardData,
  field: CardFieldKey,
): string[] {
  switch (field) {
    case 'word':
      return data.word ? [data.word] : []
    case 'phonetic':
      return data.phonetic ? [data.phonetic] : []
    case 'partOfSpeech':
      return data.partOfSpeech ? [data.partOfSpeech] : []
    case 'targetMeaning':
      return data.targetMeaning ? [data.targetMeaning] : []
    case 'englishMeaning':
      return data.englishMeaning ? [data.englishMeaning] : []
    case 'examples':
      return data.examples.length
        ? data.examples.map((e, i) => `${i + 1}. ${e.text}`)
        : []
    case 'exampleTranslations':
      return data.examples.length
        ? data.examples
            .map((e, i) =>
              e.translation ? `${i + 1}. ${e.translation}` : '',
            )
            .filter(Boolean)
        : []
    case 'notes':
      return data.notes?.trim() ? [data.notes.trim()] : []
    default:
      return []
  }
}

/** Plain-text block for clipboard, persistence snapshots, or previews. */
export function renderCardFaceText(
  data: GeneratedCardData,
  layout: CardFieldLayout[],
): string {
  const fields = fieldTypesInOrder(layout)
  const parts: string[] = []
  for (const f of fields) {
    const lines = linesForField(data, f)
    if (lines.length === 0) continue
    parts.push(`${LABELS[f]}\n${lines.join('\n')}`)
  }
  return parts.join('\n\n')
}

export function fieldLabel(field: CardFieldKey): string {
  return LABELS[field]
}

const LABEL_VALUES = new Set(Object.values(LABELS))

/**
 * Review/study display: drop field captions (e.g. "Word") and keep values only.
 */
export function cardFaceDisplayText(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const blocks = trimmed.split(/\n\n+/)
  const parts: string[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.length === 0) continue
    const first = lines[0]?.trim() ?? ''
    if (LABEL_VALUES.has(first) && lines.length > 1) {
      const body = lines.slice(1).join('\n').trim()
      if (body) parts.push(body)
    } else {
      const body = block.trim()
      if (body) parts.push(body)
    }
  }

  return parts.join('\n\n')
}
