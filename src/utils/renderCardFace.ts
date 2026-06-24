import type { CardFieldKey, CardFieldLayout, GeneratedCardData } from '@/types/cards'
import {
  cardInput,
  exampleSentence,
  exampleTranslation,
} from '@/domain/languageCardData'
import { formatPronunciationsForDisplay } from '@/domain/pronunciations'
import { fieldTypesInOrder } from '@/utils/cardLayoutModel'

const LABELS: Record<CardFieldKey, string> = {
  input: 'Input',
  translation: 'Translation',
  pronunciations: 'Pronunciations',
  partOfSpeech: 'Part of speech',
  examples: 'Examples',
}

/** Plain-text lines for one card field (search, export). */
export function linesForField(
  data: GeneratedCardData,
  field: CardFieldKey,
): string[] {
  switch (field) {
    case 'input':
      return cardInput(data) ? [cardInput(data)] : []
    case 'translation':
      return data.translation?.trim() ? [data.translation.trim()] : []
    case 'pronunciations':
      return data.pronunciations?.length ? formatPronunciationsForDisplay(data.pronunciations).split('\n') : []
    case 'partOfSpeech':
      return data.partOfSpeech?.length ? [data.partOfSpeech.join(' · ')] : []
    case 'examples':
      return data.examples.length
        ? data.examples
            .map((e, i) => {
              const sentence = exampleSentence(e)
              const tr = exampleTranslation(e)
              return tr ? `${i + 1}. ${sentence}\n${tr}` : `${i + 1}. ${sentence}`
            })
            .filter(Boolean)
        : []
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
 * Review/study display: drop field captions (e.g. "Input") and keep values only.
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
