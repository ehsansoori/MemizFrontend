import type { CardFieldLayout, GeneratedCard, GeneratedCardData, GenerationMetadata } from '@/types/cards'
import type { GenerateCardsFormDto } from '@/types/cards'
import type { ApiCardResponseDto } from '@/services/api/types/cardsApi.types'
import { zipPronunciationsWithSources } from '@/domain/pronunciations'
import { cloneLayoutForCard } from '@/utils/cardLayoutModel'

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function metadataFromForm(form: GenerateCardsFormDto): GenerationMetadata {
  const o = form.options
  return {
    sourceLanguage: form.sourceLanguage,
    targetLanguage: form.targetLanguage,
    tone: o.tone,
    difficulty: o.difficulty,
    pronunciations: o.pronunciations,
    exampleCount: o.exampleCount,
    includePhonetic: o.includePhonetic,
    includePartOfSpeech: o.includePartOfSpeech,
    includeTargetMeaning: o.includeTargetMeaning,
    includeEnglishMeaning: o.includeEnglishMeaning,
    includeExampleTranslations: o.includeExampleTranslations,
  }
}

export function isInvalidApiCardResponse(row: ApiCardResponseDto): boolean {
  return row.back?.isValid === false
}

export function apiCardToGeneratedCardData(
  row: ApiCardResponseDto,
  form: GenerateCardsFormDto,
): GeneratedCardData {
  const { back } = row
  const opts = form.options
  const input = back.input?.trim() || row.front.trim()

  const examples = (back.examples ?? []).map((ex) => ({
    sentence: ex.sentence,
    translation: opts.includeExampleTranslations ? ex.translation : undefined,
  }))

  const data: GeneratedCardData = {
    input,
    examples,
  }

  if (opts.includePhonetic && back.pronunciations?.length) {
    const pronunciations = zipPronunciationsWithSources(opts.pronunciations, back.pronunciations)
    if (pronunciations.length > 0) data.pronunciations = pronunciations
  }

  if (opts.includePartOfSpeech && back.partOfSpeech?.length) {
    const parts = back.partOfSpeech.filter(Boolean)
    if (parts.length > 0) data.partOfSpeech = parts
  }

  if (opts.includeTargetMeaning && back.translation) {
    data.translation = back.translation
  }

  if (!opts.includeExampleTranslations && data.examples.length) {
    data.examples = data.examples.map(({ sentence }) => ({ sentence }))
  }

  return data
}

export function mapApiCardsToGeneratedCards(
  rows: ApiCardResponseDto[],
  form: GenerateCardsFormDto,
  layout: { frontLayout: CardFieldLayout[]; backLayout: CardFieldLayout[] },
  templateId: string,
  preserve?: { id: string; sourceInput: string }[],
): GeneratedCard[] {
  const meta = metadataFromForm(form)
  const t = nowIso()

  return rows.map((row, index) => {
    const sourceInput = preserve?.[index]?.sourceInput ?? row.front.trim()
    if (isInvalidApiCardResponse(row)) {
      const originalWord = row.back.input?.trim() || sourceInput
      return {
        id: preserve?.[index]?.id ?? newId(),
        sourceInput: originalWord,
        templateId,
        frontLayout: cloneLayoutForCard(layout.frontLayout),
        backLayout: cloneLayoutForCard(layout.backLayout),
        data: {
          input: originalWord,
          examples: [],
        },
        invalid: {
          isInvalid: true,
          suggestions: (row.back.suggestions ?? []).filter(Boolean),
          originalWord,
        },
        isEdited: false,
        isRegenerating: false,
        createdAt: t,
        updatedAt: t,
        generationMetadata: meta,
      }
    }
    return {
      id: preserve?.[index]?.id ?? newId(),
      sourceInput,
      templateId,
      frontLayout: cloneLayoutForCard(layout.frontLayout),
      backLayout: cloneLayoutForCard(layout.backLayout),
      data: apiCardToGeneratedCardData(row, form),
      invalid: undefined,
      isEdited: false,
      isRegenerating: false,
      createdAt: t,
      updatedAt: t,
      generationMetadata: meta,
    }
  })
}

export function mergeExamplesFromApi(
  current: GeneratedCardData,
  row: ApiCardResponseDto,
  form: GenerateCardsFormDto,
): GeneratedCardData {
  const fresh = apiCardToGeneratedCardData(row, form)
  return { ...current, examples: fresh.examples }
}
