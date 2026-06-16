import type { GeneratedCardData } from '@/types/cards'
import type { CardTemplate, TemplateFieldDef } from '@/types/deckProfile'
import { isBasicTemplate } from '@/domain/cardTemplates'
import {
  getExamplesConfig,
  resolveFieldKind,
} from '@/domain/expandTemplateFields'
import {
  formatRepeatableGroupForDisplay,
  formatSimpleGroupForDisplay,
  getTemplateFormGroups,
  readRepeatableItems,
  type RepeatableFormGroup,
} from '@/domain/templateFormGroups'

export type TemplateFieldValues = Record<string, string>

const EXAMPLE_KEY = /^example_(\d+)$/

export function isExampleField(field: TemplateFieldDef): boolean {
  return EXAMPLE_KEY.test(field.key) || field.key === 'examples'
}

export function isExampleTranslationField(field: TemplateFieldDef): boolean {
  return /^example_translation_(\d+)$/.test(field.key) || field.key === 'exampleTranslation'
}

export function countTemplateExamples(template: CardTemplate): number {
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  if (examplesField) return getExamplesConfig(examplesField).count

  const numbered = template.fields.filter((f) => EXAMPLE_KEY.test(f.key)).length
  if (numbered > 0) return numbered
  return template.fields.some((f) => f.key === 'examples') ? 1 : 0
}

export function templateIncludesExampleTranslations(template: CardTemplate): boolean {
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  if (examplesField) return getExamplesConfig(examplesField).includeTranslation
  return template.fields.some(isExampleTranslationField)
}

function repeatableGroups(template: CardTemplate, valuePrefix: string): RepeatableFormGroup[] {
  return getTemplateFormGroups(template.fields).filter(
    (g): g is RepeatableFormGroup =>
      g.type === 'repeatable' && g.valuePrefix === valuePrefix,
  )
}

function readRepeatableExamples(
  values: TemplateFieldValues,
  group: RepeatableFormGroup,
): GeneratedCardData['examples'] {
  return readRepeatableItems(values, group)
    .filter((item) => item.text.trim())
    .map((item) => ({
      text: item.text.trim(),
      translation: item.translation?.trim() || undefined,
    }))
}

export function templateValuesToExamples(
  template: CardTemplate,
  values: TemplateFieldValues,
): GeneratedCardData['examples'] {
  const groups = repeatableGroups(template, 'example')
  if (groups.length > 0) {
    return groups.flatMap((group) => readRepeatableExamples(values, group))
  }

  const legacy = values.examples?.trim()
  if (legacy) {
    return [{ text: legacy, translation: values.exampleTranslation?.trim() || undefined }]
  }

  return []
}

export function templateValuesToDefinitions(
  template: CardTemplate,
  values: TemplateFieldValues,
): GeneratedCardData['examples'] {
  const groups = repeatableGroups(template, 'definition')
  return groups.flatMap((group) => readRepeatableExamples(values, group))
}

export function cardDataToTemplateValues(
  data: GeneratedCardData,
  template: CardTemplate,
): TemplateFieldValues {
  const values: TemplateFieldValues = {
    front: data.word,
    word: data.word,
    back: [data.targetMeaning, data.englishMeaning].filter(Boolean).join('\n'),
    meaning: data.targetMeaning ?? '',
    targetMeaning: data.targetMeaning ?? '',
    englishMeaning: data.englishMeaning ?? '',
    phonetic: data.phonetic ?? '',
    partOfSpeech: data.partOfSpeech ?? '',
    notes: data.notes ?? '',
    definition: data.targetMeaning ?? '',
    answer: data.targetMeaning ?? '',
    explanation: data.notes ?? '',
  }

  data.examples.forEach((ex, i) => {
    const index = i + 1
    values[`example_${index}`] = ex.text
    if (ex.translation) {
      values[`example_translation_${index}`] = ex.translation
    }
  })

  if (repeatableGroups(template, 'example').length === 0 && data.examples.length > 0) {
    values.examples = data.examples.map((e) => e.text).join('\n')
    values.exampleTranslation = data.examples
      .map((e) => e.translation)
      .filter(Boolean)
      .join('\n')
  }

  if (repeatableGroups(template, 'definition').length > 0 && data.englishMeaning) {
    values.definition_1 = data.englishMeaning
  } else if (data.englishMeaning) {
    values.definition = data.englishMeaning
  }

  return values
}

export function templateHasPartOfSpeech(template: CardTemplate): boolean {
  return template.fields.some(
    (f) =>
      resolveFieldKind(f) === 'tag' ||
      f.key.startsWith('part_of_speech') ||
      f.label.toLowerCase().includes('part of speech'),
  )
}

export function templateValuesToFrontBack(
  template: CardTemplate,
  values: TemplateFieldValues,
): { front: string; back: string } {
  if (isBasicTemplate(template)) {
    const front = values.word?.trim() ?? values.front?.trim() ?? ''
    const back = values.targetMeaning?.trim() ?? values.meaning?.trim() ?? values.back?.trim() ?? ''
    return { front, back }
  }

  const groups = getTemplateFormGroups(template.fields)
  const frontParts: string[] = []
  const backParts: string[] = []

  for (const group of groups) {
    if (group.type === 'repeatable') {
      const block = formatRepeatableGroupForDisplay(group, values)
      if (!block) continue
      if (group.side === 'front') frontParts.push(block)
      else backParts.push(block)
      continue
    }

    const text = formatSimpleGroupForDisplay(group, values)
    if (!text) continue

    if (group.side === 'front') {
      frontParts.push(group.valueKey === 'word' ? text : `${group.label}\n${text}`)
    } else if (group.valueKey === 'targetMeaning') {
      backParts.push(text)
    } else {
      backParts.push(`${group.label}\n${text}`)
    }
  }

  return {
    front: frontParts.join('\n') || values.front?.trim() || values.word?.trim() || '',
    back: backParts.join('\n\n') || values.back?.trim() || values.targetMeaning?.trim() || '',
  }
}

export function templateValuesToCardData(
  template: CardTemplate,
  values: TemplateFieldValues,
): GeneratedCardData {
  const { front, back } = templateValuesToFrontBack(template, values)
  const definitions = templateValuesToDefinitions(template, values)
  const firstDefinition = definitions[0]

  return {
    word: values.word ?? front.split('\n')[0] ?? front,
    targetMeaning: values.targetMeaning ?? values.meaning ?? back,
    englishMeaning:
      values.englishMeaning ??
      firstDefinition?.translation ??
      firstDefinition?.text ??
      values.definition ??
      values.answer,
    phonetic: values.phonetic,
    partOfSpeech: values.partOfSpeech ?? values.part_of_speech,
    notes: values.notes ?? values.explanation,
    examples: templateValuesToExamples(template, values),
  }
}
