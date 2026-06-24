import { resolveSavedCardTemplate } from '@/domain/resolveDeckTemplate'
import {
  getTemplateFormGroups,
  isWordFormGroup,
  readRepeatableItems,
  type RepeatableFormGroup,
  type SimpleFormGroup,
  type TemplateFormGroup,
} from '@/domain/templateFormGroups'
import { cardDataToTemplateValues } from '@/domain/templateUtils'
import { cardInput } from '@/domain/languageCardData'
import type { SavedCard } from '@/types/cards'

export type FieldDisplayRole = 'word' | 'meaning' | 'phonetic' | 'pos' | 'notes' | 'body'

export type TemplateDisplaySegment =
  | { kind: 'simple'; id: string; role: FieldDisplayRole; text: string }
  | {
      kind: 'repeatable'
      id: string
      items: { text: string; translation?: string }[]
    }

function resolveSimpleRole(group: SimpleFormGroup): FieldDisplayRole {
  if (isWordFormGroup(group)) return 'word'
  if (group.valueKey === 'pronunciations') return 'phonetic'
  if (group.valueKey === 'partOfSpeech') return 'pos'
  if (group.valueKey === 'translation' || group.label === 'Translation') return 'meaning'
  if (group.valueKey === 'notes' || group.label === 'Note') return 'notes'
  return 'body'
}

function groupToSegment(
  group: TemplateFormGroup,
  values: ReturnType<typeof cardDataToTemplateValues>,
): TemplateDisplaySegment | null {
  if (group.type === 'repeatable') {
    const items = readRepeatableItems(values, group as RepeatableFormGroup)
      .filter((item) => item.text.trim())
      .map((item) => ({
        text: item.text.trim(),
        translation: item.translation?.trim() || undefined,
      }))
    if (items.length === 0) return null
    return { kind: 'repeatable', id: group.id, items }
  }

  const text = values[group.valueKey]?.trim()
  if (!text) return null
  return { kind: 'simple', id: group.id, role: resolveSimpleRole(group), text }
}

export function getTemplateDisplaySegments(card: SavedCard): {
  front: TemplateDisplaySegment[]
  back: TemplateDisplaySegment[]
} {
  const template = resolveSavedCardTemplate(card)
  const values = cardDataToTemplateValues(card.data, template)
  const front: TemplateDisplaySegment[] = []
  const back: TemplateDisplaySegment[] = []

  for (const group of getTemplateFormGroups(template.fields)) {
    const segment = groupToSegment(group, values)
    if (!segment) continue
    if (group.side === 'front') front.push(segment)
    else back.push(segment)
  }

  return { front, back }
}

/** All populated segments in template field order. */
export function getOrderedTemplateDisplaySegments(card: SavedCard): TemplateDisplaySegment[] {
  const template = resolveSavedCardTemplate(card)
  const values = cardDataToTemplateValues(card.data, template)
  const segments: TemplateDisplaySegment[] = []

  for (const group of getTemplateFormGroups(template.fields)) {
    const segment = groupToSegment(group, values)
    if (segment) segments.push(segment)
  }

  return segments
}

/**
 * Study layout: simple fields before the first repeatable group stay fixed;
 * repeatable groups (examples, etc.) and anything after scroll independently.
 */
export function splitStudyDisplaySegments(card: SavedCard): {
  sticky: TemplateDisplaySegment[]
  scrollable: TemplateDisplaySegment[]
} {
  const ordered = getOrderedTemplateDisplaySegments(card)
  const repeatableIndex = ordered.findIndex((segment) => segment.kind === 'repeatable')

  if (repeatableIndex >= 0) {
    return {
      sticky: ordered.slice(0, repeatableIndex),
      scrollable: ordered.slice(repeatableIndex),
    }
  }

  const wordIndex = ordered.findIndex(
    (segment) => segment.kind === 'simple' && segment.role === 'word',
  )
  if (wordIndex >= 0 && ordered.length > wordIndex + 1) {
    return {
      sticky: ordered.slice(0, wordIndex + 1),
      scrollable: ordered.slice(wordIndex + 1),
    }
  }

  return { sticky: ordered, scrollable: [] }
}

function firstSimpleText(segments: TemplateDisplaySegment[], role?: FieldDisplayRole): string {
  for (const segment of segments) {
    if (segment.kind !== 'simple') continue
    if (role && segment.role !== role) continue
    return segment.text
  }
  return ''
}

function firstRepeatableText(segments: TemplateDisplaySegment[]): string {
  for (const segment of segments) {
    if (segment.kind === 'repeatable' && segment.items[0]) {
      return segment.items[0].text
    }
  }
  return ''
}

/** Primary word from template front fields. */
export function savedCardWord(card: SavedCard): string {
  const { front } = getTemplateDisplaySegments(card)
  return (
    firstSimpleText(front, 'word') ||
    cardInput(card.data) ||
    firstSimpleText(front) ||
    'Untitled'
  )
}

/** First back-field preview line for browse rows (template order). */
export function savedCardMeaningPreview(card: SavedCard, maxLength = 64): string {
  const { back } = getTemplateDisplaySegments(card)
  const text =
    firstSimpleText(back, 'meaning') ||
    firstSimpleText(back) ||
    firstRepeatableText(back) ||
    ''
  if (!text) return 'No translation yet'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function savedCardMeaning(card: SavedCard): string {
  const { back } = getTemplateDisplaySegments(card)
  return (
    firstSimpleText(back, 'meaning') ||
    card.data.translation?.trim() ||
    card.data.targetMeaning?.trim() ||
    card.data.englishMeaning?.trim() ||
    firstSimpleText(back) ||
    firstRepeatableText(back) ||
    ''
  )
}

export function savedCardFrontText(card: SavedCard): string {
  const { front } = getTemplateDisplaySegments(card)
  const parts: string[] = []
  for (const segment of front) {
    if (segment.kind === 'simple') parts.push(segment.text)
    else parts.push(...segment.items.map((i) => i.text))
  }
  return parts.join('\n') || cardInput(card.data)
}

export function savedCardBackText(card: SavedCard): string {
  const { back } = getTemplateDisplaySegments(card)
  const parts: string[] = []
  for (const segment of back) {
    if (segment.kind === 'simple') {
      parts.push(segment.text)
    } else {
      for (const item of segment.items) {
        parts.push(item.translation ? `${item.text}\n${item.translation}` : item.text)
      }
    }
  }
  return parts.join('\n\n') || savedCardMeaning(card) || 'No translation yet'
}
