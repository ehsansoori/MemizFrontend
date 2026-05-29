import type { CardGenerationOptionsDto, GenerateCardsFormDto } from '@/types/cards'
import type { ApiGenerateCardsRequestDto } from '@/services/api/types/cardsApi.types'

export function parseInputTerms(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((w) => w.trim())
    .filter(Boolean)
}

export function toApiOptions(
  options: CardGenerationOptionsDto,
): ApiGenerateCardsRequestDto['options'] {
  return {
    includePhonetic: options.includePhonetic,
    includePartOfSpeech: options.includePartOfSpeech,
    includeTargetMeaning: options.includeTargetMeaning,
    includeEnglishMeaning: options.includeEnglishMeaning,
    includeExampleTranslations: options.includeExampleTranslations,
    exampleCount: options.exampleCount,
    tone: options.tone,
    difficultyLevel: options.difficulty,
  }
}

export function buildApiGenerateRequest(
  form: GenerateCardsFormDto,
  overrides?: { inputs?: string[] },
): ApiGenerateCardsRequestDto {
  const inputs = overrides?.inputs ?? parseInputTerms(form.input)
  return {
    inputs,
    inputType: 'word',
    sourceLanguage: form.sourceLanguage,
    targetLanguage: form.targetLanguage,
    domain: 'daily conversation',
    templateName: 'basic-vocabulary',
    dictionaryProvider: 'default',
    aiProvider: 'openai',
    options: toApiOptions(form.options),
  }
}
