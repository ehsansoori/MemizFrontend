import type { CardFieldLayout, GeneratedCard, GeneratedCardData, GenerationMetadata } from '@/types/cards'
import type { GenerateCardsFormDto } from '@/types/cards'
import type { ApiCardResponseDto } from '@/services/api/types/cardsApi.types'
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
  const word = back.word?.trim() || row.front.trim()

  const examples = (back.examples ?? []).map((ex) => ({
    text: ex.sentence,
    translation: opts.includeExampleTranslations ? ex.translation : undefined,
  }))

  const data: GeneratedCardData = {
    word,
    examples,
  }

  if (opts.includePhonetic && back.phonetic) data.phonetic = back.phonetic
  if (opts.includePartOfSpeech && back.partOfSpeech) data.partOfSpeech = back.partOfSpeech
  if (opts.includeTargetMeaning && back.targetMeaning) {
    data.targetMeaning = back.targetMeaning
  } else if (opts.includeTargetMeaning && back.meaning) {
    data.targetMeaning = back.meaning
  }
  if (opts.includeEnglishMeaning && back.englishMeaning) {
    data.englishMeaning = back.englishMeaning
  }

  if (!opts.includeExampleTranslations && data.examples.length) {
    data.examples = data.examples.map(({ text }) => ({ text }))
  }

  return data
}

export function mapApiCardsToGeneratedCards(
  rows: ApiCardResponseDto[],
  form: GenerateCardsFormDto,
  layout: { frontLayout: CardFieldLayout[]; backLayout: CardFieldLayout[] },
  preserve?: { id: string; sourceInput: string }[],
): GeneratedCard[] {
  const meta = metadataFromForm(form)
  const t = nowIso()

  return rows.map((row, index) => {
    const sourceInput = preserve?.[index]?.sourceInput ?? row.front.trim()
    if (isInvalidApiCardResponse(row)) {
      const originalWord = row.back.word?.trim() || sourceInput
      return {
        id: preserve?.[index]?.id ?? newId(),
        sourceInput: originalWord,
        frontLayout: cloneLayoutForCard(layout.frontLayout),
        backLayout: cloneLayoutForCard(layout.backLayout),
        data: {
          word: originalWord,
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

/** Merge regenerated examples into existing card data. */
export function mergeExamplesFromApi(
  current: GeneratedCardData,
  row: ApiCardResponseDto,
  form: GenerateCardsFormDto,
): GeneratedCardData {
  const fresh = apiCardToGeneratedCardData(row, form)
  return { ...current, examples: fresh.examples }
}
