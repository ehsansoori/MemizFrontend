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
  pronunciations: string[]
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

  sourceLanguage: string

  targetLanguage: string

  options: ApiCardGenerationOptionsDto

}



export interface ApiExampleDto {

  sentence: string

  translation?: string

}



export interface ApiPronunciationDto {

  accent: string

  phonetic: string

}



export interface ApiCardBackDto {

  input: string

  pronunciations: ApiPronunciationDto[]

  translation: string

  partOfSpeech: string[]

  examples: ApiExampleDto[]

  isValid: boolean

  suggestions: string[]

}



export interface ApiCardResponseDto {

  front: string

  back: ApiCardBackDto

}



/** POST /api/cards/generate response body. */

export type CardGenerationResultDto = ApiCardResponseDto[]

