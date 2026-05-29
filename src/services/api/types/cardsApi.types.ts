/** Backend DTOs — mirror AnkiCardGenerator.Api contracts (JSON camelCase). */

export type ApiTone =
  | 'formal'
  | 'casual'
  | 'academic'
  | 'business'
  | 'friendly'
  | 'neutral'

export type ApiDifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ApiCardGenerationOptionsDto {
  includePhonetic: boolean
  includePartOfSpeech: boolean
  includeTargetMeaning: boolean
  includeEnglishMeaning: boolean
  includeExampleTranslations: boolean
  exampleCount: number
  tone: ApiTone
  difficultyLevel: ApiDifficultyLevel
}

export interface ApiGenerateCardsRequestDto {
  inputs: string[]
  inputType: string
  sourceLanguage: string
  targetLanguage: string
  domain: string
  templateName: string
  dictionaryProvider: string
  aiProvider: string
  options: ApiCardGenerationOptionsDto
}

export interface ApiExampleDto {
  sentence: string
  translation?: string
}

export interface ApiCardBackDto {
  word: string
  meaning?: string
  phonetic?: string
  partOfSpeech?: string
  targetMeaning?: string
  englishMeaning?: string
  examples: ApiExampleDto[]
  /** False when backend cannot validate the word. */
  isValid?: boolean
  suggestions?: string[]
}

export interface ApiCardResponseDto {
  front: string
  back: ApiCardBackDto
}

/** POST /api/cards/generate response body. */
export type CardGenerationResultDto = ApiCardResponseDto[]
