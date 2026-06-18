import { resolveCardTemplate } from '@/domain/resolveDeckTemplate'
import {
  getTemplateFormGroups,
  isWordFormGroup,
  readRepeatableItems,
  type RepeatableFormGroup,
  type SimpleFormGroup,
  type TemplateFormGroup,
} from '@/domain/templateFormGroups'
import { cardDataToTemplateValues } from '@/domain/templateUtils'
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
  if (group.valueKey === 'phonetic') return 'phonetic'
  if (group.valueKey === 'partOfSpeech') return 'pos'
  if (
    group.valueKey === 'targetMeaning' ||
    group.valueKey === 'meaning' ||
    group.valueKey === 'englishMeaning' ||
    group.label === 'Meaning'
  ) {
    return 'meaning'
  }
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
  const template = resolveCardTemplate(card.templateId)
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
    card.data.word.trim() ||
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
  if (!text) return 'No meaning yet'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function savedCardMeaning(card: SavedCard): string {
  const { back } = getTemplateDisplaySegments(card)
  return (
    firstSimpleText(back, 'meaning') ||
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
  return parts.join('\n') || card.data.word
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
  return parts.join('\n\n') || savedCardMeaning(card) || 'No meaning yet'
}
