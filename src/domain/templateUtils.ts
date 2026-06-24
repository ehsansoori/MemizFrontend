import type { GeneratedCardData } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'
import {
  exampleSentence,
  normalizeGeneratedCardData,
} from '@/domain/languageCardData'
import { formatPronunciationsForDisplay, parsePronunciationsFromText } from '@/domain/pronunciations'
import { getExamplesConfig, getPronunciationsConfig, resolveFieldKind } from '@/domain/expandTemplateFields'
import { getReviewBackBlocks, getTemplateCardBlocks } from '@/domain/templateCardBlocks'

export type TemplateFieldValues = Record<string, string>

export function countTemplateExamples(template: CardTemplate): number {
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  if (examplesField) return getExamplesConfig(examplesField).count
  return 0
}

export function templateHasExamplesField(template: CardTemplate): boolean {
  return template.fields.some((f) => resolveFieldKind(f) === 'examples')
}

/** True when the template renders an examples block on the card back. */
export function templateExpectsExamplesOnBack(template: CardTemplate): boolean {
  if (!templateHasExamplesField(template)) return false
  return getReviewBackBlocks(template).some((block) => block.type === 'examples')
}

/** Drop fields removed from the template so stale persisted data does not surface in UI. */
export function alignCardDataToTemplate(
  template: CardTemplate,
  data: GeneratedCardData,
): GeneratedCardData {
  const normalized = normalizeGeneratedCardData(data)
  if (templateHasExamplesField(template)) return normalized
  return { ...normalized, examples: [] }
}

export function templateIncludesExampleTranslations(template: CardTemplate): boolean {
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  if (examplesField) return getExamplesConfig(examplesField).includeTranslation
  return false
}

export function templateHasPartOfSpeech(template: CardTemplate): boolean {
  return template.fields.some((f) => resolveFieldKind(f) === 'partOfSpeech')
}

export function templateHasPronunciations(template: CardTemplate): boolean {
  return template.fields.some((f) => resolveFieldKind(f) === 'pronunciations')
}

export function getTemplatePronunciationSources(
  template: CardTemplate,
  sourceLanguage?: string,
): string[] {
  const field = template.fields.find((f) => resolveFieldKind(f) === 'pronunciations')
  if (!field) return []
  return getPronunciationsConfig(field, sourceLanguage).sources
}

export function templateHasTranslation(template: CardTemplate): boolean {
  return template.fields.some((f) => resolveFieldKind(f) === 'translation')
}

export function cardDataToTemplateValues(
  data: GeneratedCardData,
  template: CardTemplate,
): TemplateFieldValues {
  const normalized = alignCardDataToTemplate(template, data)
  const values: TemplateFieldValues = {
    input: normalized.input,
    translation: normalized.translation ?? '',
    pronunciations: formatPronunciationsForDisplay(normalized.pronunciations ?? []),
    partOfSpeech: (normalized.partOfSpeech ?? []).join(', '),
  }

  if (!templateHasExamplesField(template)) return values

  normalized.examples.forEach((ex, i) => {
    const index = i + 1
    values[`example_${index}`] = exampleSentence(ex)
    if (ex.translation) values[`example_translation_${index}`] = ex.translation
  })

  return values
}

export function templateValuesToFrontBack(
  template: CardTemplate,
  values: TemplateFieldValues,
): { front: string; back: string } {
  const { front, back } = getTemplateCardBlocks(template)
  const frontParts: string[] = []
  const backParts: string[] = []

  for (const block of front) {
    if (block.type === 'simple' && block.patchKey === 'input') {
      const text = values.input?.trim()
      if (text) frontParts.push(text)
    }
  }

  for (const block of back) {
    if (block.type === 'simple') {
      const text = values[block.patchKey]?.trim()
      if (text) backParts.push(text)
      continue
    }
    if (block.type === 'pronunciations') {
      const text = values.pronunciations?.trim()
      if (text) backParts.push(text)
      continue
    }
    if (block.type === 'examples') {
      for (let i = 1; i <= block.count; i++) {
        const sentence = values[`example_${i}`]?.trim()
        if (!sentence) continue
        const tr = values[`example_translation_${i}`]?.trim()
        backParts.push(tr ? `${sentence}\n${tr}` : sentence)
      }
    }
  }

  return {
    front: frontParts.join('\n') || values.input?.trim() || '',
    back: backParts.join('\n\n'),
  }
}

export function templateValuesToCardData(
  template: CardTemplate,
  values: TemplateFieldValues,
): GeneratedCardData {
  const { front, back } = templateValuesToFrontBack(template, values)
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  const exampleCount = examplesField ? getExamplesConfig(examplesField).count : 0
  const includeTranslation = examplesField
    ? getExamplesConfig(examplesField).includeTranslation
    : false

  const examples = Array.from({ length: exampleCount }, (_, i) => {
    const index = i + 1
    const sentence = values[`example_${index}`]?.trim() ?? ''
    const translation = includeTranslation
      ? values[`example_translation_${index}`]?.trim() || undefined
      : undefined
    return { sentence, translation }
  }).filter((ex) => ex.sentence || ex.translation)

  const posParts = values.partOfSpeech?.split(/\s*[,·]\s*/).filter(Boolean)
  const parsedPronunciations = parsePronunciationsFromText(values.pronunciations ?? '')

  return {
    input: values.input?.trim() || front.split('\n')[0]?.trim() || '',
    translation: values.translation?.trim() || back.split('\n')[0]?.trim() || undefined,
    pronunciations: parsedPronunciations.length > 0 ? parsedPronunciations : undefined,
    partOfSpeech: posParts && posParts.length > 0 ? posParts : undefined,
    examples,
  }
}

export function templateValuesToExamples(
  template: CardTemplate,
  values: TemplateFieldValues,
): GeneratedCardData['examples'] {
  return templateValuesToCardData(template, values).examples
}

/** @deprecated */
export function isBasicTemplate(_template: CardTemplate): boolean {
  return true
}

/** @deprecated */
export function isExampleField(): boolean {
  return false
}

/** @deprecated */
export function isExampleTranslationField(): boolean {
  return false
}

/** @deprecated */
export function templateValuesToDefinitions(): GeneratedCardData['examples'] {
  return []
}
