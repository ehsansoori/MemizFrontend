import type { GeneratedCardData, SavedCard } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'
import { cardInput, normalizeGeneratedCardData } from '@/domain/languageCardData'
import { getExamplesConfig, resolveFieldKind } from '@/domain/expandTemplateFields'
import {
  cardDataToTemplateValues,
  templateHasExamplesField,
  templateValuesToCardData,
  templateValuesToFrontBack,
  type TemplateFieldValues,
} from '@/domain/templateUtils'

export type CardDraft = {
  data: GeneratedCardData
}

export function emptyCardDraft(template: CardTemplate): CardDraft {
  const examplesField = template.fields.find((f) => resolveFieldKind(f) === 'examples')
  const exampleCount = examplesField ? getExamplesConfig(examplesField).count : 0

  return {
    data: {
      input: '',
      examples: Array.from({ length: exampleCount }, () => ({ sentence: '' })),
    },
  }
}

/** Keep front input, clear generated back content after cancel. */
export function discardGeneratedDraft(draft: CardDraft, template: CardTemplate): CardDraft {
  const empty = emptyCardDraft(template)
  return {
    data: {
      ...empty.data,
      input: draft.data.input,
    },
  }
}

export function generatedCardToDraft(
  data: GeneratedCardData,
  template: CardTemplate,
): CardDraft {
  if (!templateHasExamplesField(template)) {
    return {
      data: {
        ...normalizeGeneratedCardData(data),
        input: cardInput(data),
        examples: [],
      },
    }
  }

  const base = emptyCardDraft(template)
  const examples = [...data.examples]
  while (examples.length < base.data.examples.length) {
    examples.push({ sentence: '' })
  }

  return {
    data: {
      ...data,
      input: cardInput(data),
      examples: examples.slice(0, Math.max(examples.length, base.data.examples.length)),
    },
  }
}

export function savedCardToDraft(card: SavedCard, template: CardTemplate): CardDraft {
  return generatedCardToDraft(card.data, template)
}

export function draftToTemplateValues(draft: CardDraft, template: CardTemplate): TemplateFieldValues {
  return cardDataToTemplateValues(draft.data, template)
}

export function draftToFrontBack(template: CardTemplate, draft: CardDraft) {
  return templateValuesToFrontBack(template, draftToTemplateValues(draft, template))
}

export function draftToCardData(template: CardTemplate, draft: CardDraft): GeneratedCardData {
  const fromValues = templateValuesToCardData(template, draftToTemplateValues(draft, template))
  const merged: GeneratedCardData = {
    ...fromValues,
    pronunciations: draft.data.pronunciations ?? fromValues.pronunciations,
    partOfSpeech: draft.data.partOfSpeech ?? fromValues.partOfSpeech,
    translation: fromValues.translation ?? draft.data.translation,
    input: cardInput(draft.data) || fromValues.input,
  }
  if (!templateHasExamplesField(template)) {
    merged.examples = []
  }
  return merged
}
