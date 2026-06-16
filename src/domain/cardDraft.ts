import type { ExampleSentenceDto, GeneratedCardData } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'
import {
  getDefinitionConfig,
  getExamplesConfig,
  resolveFieldKind,
} from '@/domain/expandTemplateFields'
import {
  cardDataToTemplateValues,
  templateValuesToCardData,
  templateValuesToDefinitions,
  templateValuesToFrontBack,
  type TemplateFieldValues,
} from '@/domain/templateUtils'

export type CardDraft = {
  data: GeneratedCardData
  definitions: ExampleSentenceDto[]
  customSlots: Record<string, string[]>
}

export function emptyCardDraft(template: CardTemplate): CardDraft {
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  const exampleCount = examplesField ? getExamplesConfig(examplesField).count : 0

  const definitionField = template.fields.find((f) => resolveFieldKind(f) === 'definition')
  const definitionCount = definitionField ? getDefinitionConfig(definitionField).count : 0

  return {
    data: {
      word: '',
      examples: Array.from({ length: exampleCount }, () => ({ text: '' })),
    },
    definitions: Array.from({ length: definitionCount }, () => ({ text: '' })),
    customSlots: {},
  }
}

export function generatedCardToDraft(
  data: GeneratedCardData,
  template: CardTemplate,
): CardDraft {
  const base = emptyCardDraft(template)
  const values = cardDataToTemplateValues(data, template)
  const definitions = templateValuesToDefinitions(template, values)

  const examples = [...data.examples]
  while (examples.length < base.data.examples.length) {
    examples.push({ text: '' })
  }

  const defs =
    definitions.length > 0
      ? definitions
      : base.definitions.length > 0
        ? data.englishMeaning
          ? [{ text: data.englishMeaning, translation: undefined }]
          : base.definitions
        : []

  while (defs.length < base.definitions.length) {
    defs.push({ text: '' })
  }

  return {
    data: {
      ...data,
      examples: examples.slice(0, Math.max(examples.length, base.data.examples.length)),
    },
    definitions: defs.slice(0, Math.max(defs.length, base.definitions.length)),
    customSlots: {},
  }
}

export function draftToTemplateValues(draft: CardDraft, template: CardTemplate): TemplateFieldValues {
  const values = cardDataToTemplateValues(draft.data, template)

  draft.definitions.forEach((def, i) => {
    const index = i + 1
    if (def.text.trim()) values[`definition_${index}`] = def.text
    if (def.translation?.trim()) values[`definition_translation_${index}`] = def.translation
  })

  for (const [fieldId, slots] of Object.entries(draft.customSlots)) {
    slots.forEach((text, i) => {
      if (!text.trim()) return
      const key = slots.length === 1 ? fieldId : `${fieldId}_${i + 1}`
      values[key] = text
    })
  }

  return values
}

export function draftToFrontBack(template: CardTemplate, draft: CardDraft) {
  return templateValuesToFrontBack(template, draftToTemplateValues(draft, template))
}

export function draftToCardData(template: CardTemplate, draft: CardDraft): GeneratedCardData {
  return templateValuesToCardData(template, draftToTemplateValues(draft, template))
}
