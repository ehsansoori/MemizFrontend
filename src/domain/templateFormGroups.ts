import type { TemplateFieldDef, TemplateFieldSide } from '@/types/deckProfile'
import type { TemplateFieldValues } from '@/domain/templateUtils'
import { getExamplesConfig, resolveFieldKind } from '@/domain/expandTemplateFields'

export type SimpleFormGroup = {
  type: 'simple'
  id: string
  sourceFieldId: string
  label: string
  side: TemplateFieldSide
  valueKey: string
  inputType: 'text' | 'longText' | 'image' | 'audio' | 'video' | 'tag'
}

export type RepeatableFormGroup = {
  type: 'repeatable'
  id: string
  sourceFieldId: string
  label: string
  side: TemplateFieldSide
  itemLabel: string
  valuePrefix: string
  translationPrefix: string
  includeTranslation: boolean
  addLabel: string
}

export type TemplateFormGroup = SimpleFormGroup | RepeatableFormGroup

export function isWordFormGroup(group: SimpleFormGroup): boolean {
  return group.valueKey === 'input' || group.label === 'Input'
}

function simpleValueKey(field: TemplateFieldDef): string {
  const kind = resolveFieldKind(field)
  if (kind === 'input') return 'input'
  if (kind === 'translation') return 'translation'
  if (kind === 'pronunciations') return 'pronunciations'
  if (kind === 'partOfSpeech') return 'partOfSpeech'
  return field.key
}

function simpleInputType(field: TemplateFieldDef): SimpleFormGroup['inputType'] {
  const kind = resolveFieldKind(field)
  if (kind === 'translation' || kind === 'pronunciations') return 'longText'
  return 'text'
}

export function getTemplateFormGroups(fields: TemplateFieldDef[]): TemplateFormGroup[] {
  return fields.flatMap((field): TemplateFormGroup[] => {
    const kind = resolveFieldKind(field)

    if (kind === 'examples') {
      const cfg = getExamplesConfig(field)
      return [
        {
          type: 'repeatable',
          id: field.id,
          sourceFieldId: field.id,
          label: field.label,
          side: field.side,
          itemLabel: 'Example',
          valuePrefix: 'example',
          translationPrefix: 'example_translation',
          includeTranslation: cfg.includeTranslation,
          addLabel: 'Add Example',
        },
      ]
    }

    return [
      {
        type: 'simple',
        id: field.id,
        sourceFieldId: field.id,
        label: field.label,
        side: field.side,
        valueKey: simpleValueKey(field),
        inputType: simpleInputType(field),
      },
    ]
  })
}

const indexPattern = (prefix: string) => new RegExp(`^${escapeRegExp(prefix)}_(\\d+)$`)

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getRepeatableIndices(values: TemplateFieldValues, valuePrefix: string): number[] {
  const pattern = indexPattern(valuePrefix)
  const indices = new Set<number>()
  for (const key of Object.keys(values)) {
    const match = pattern.exec(key)
    if (match) indices.add(Number(match[1]))
  }
  return [...indices].sort((a, b) => a - b)
}

export function nextRepeatableIndex(values: TemplateFieldValues, valuePrefix: string): number {
  const indices = getRepeatableIndices(values, valuePrefix)
  return indices.length === 0 ? 1 : Math.max(...indices) + 1
}

export function addRepeatableItem(
  values: TemplateFieldValues,
  group: RepeatableFormGroup,
): TemplateFieldValues {
  const index = nextRepeatableIndex(values, group.valuePrefix)
  return {
    ...values,
    [`${group.valuePrefix}_${index}`]: '',
    ...(group.includeTranslation ? { [`${group.translationPrefix}_${index}`]: '' } : {}),
  }
}

export function removeRepeatableItem(
  values: TemplateFieldValues,
  group: RepeatableFormGroup,
  index: number,
): TemplateFieldValues {
  const next = { ...values }
  delete next[`${group.valuePrefix}_${index}`]
  delete next[`${group.translationPrefix}_${index}`]
  return next
}

export type RepeatableItemValues = {
  index: number
  text: string
  translation?: string
}

export function readRepeatableItems(
  values: TemplateFieldValues,
  group: RepeatableFormGroup,
): RepeatableItemValues[] {
  return getRepeatableIndices(values, group.valuePrefix).map((index) => ({
    index,
    text: values[`${group.valuePrefix}_${index}`] ?? '',
    translation: group.includeTranslation
      ? values[`${group.translationPrefix}_${index}`] ?? ''
      : undefined,
  }))
}

export function formatRepeatableGroupForDisplay(
  group: RepeatableFormGroup,
  values: TemplateFieldValues,
): string | null {
  const items = readRepeatableItems(values, group).filter((item) => item.text.trim())
  if (items.length === 0) return null

  const blocks = items.map((item, i) => {
    const heading =
      items.length > 1 ? `${group.itemLabel} ${i + 1}` : group.itemLabel
    const lines = [heading, item.text.trim()]
    if (item.translation?.trim()) {
      lines.push(item.translation.trim())
    }
    return lines.join('\n')
  })

  return `${group.label}\n${blocks.join('\n\n')}`
}

export function formatSimpleGroupForDisplay(
  group: SimpleFormGroup,
  values: TemplateFieldValues,
): string | null {
  const text = values[group.valueKey]?.trim()
  return text || null
}
