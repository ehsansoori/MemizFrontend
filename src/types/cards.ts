/** --- Generation API DTOs (future backend) --- */

export type ToneOption =
  | 'formal'
  | 'casual'
  | 'academic'
  | 'business'
  | 'friendly'

export type DifficultyOption = 'beginner' | 'intermediate' | 'advanced'

export interface CardGenerationOptionsDto {
  includePhonetic: boolean
  includePartOfSpeech: boolean
  includeTargetMeaning: boolean
  includeEnglishMeaning: boolean
  includeExampleTranslations: boolean
  tone: ToneOption
  difficulty: DifficultyOption
  exampleCount: number
}

/** Generator form payload (UI → mapped to API DTO before POST). */
export interface GenerateCardsFormDto {
  input: string
  sourceLanguage: string
  targetLanguage: string
  options: CardGenerationOptionsDto
}

export interface ExampleSentenceDto {
  text: string
  translation?: string
}

import type { StudyProgress } from '@/types/study'

/** --- Session & persistence domain models --- */

export type SessionSourceType = 'manual' | 'file' | 'ankiDeck' | 'api'

/** Canonical field identifiers for card faces (also used as stable API keys). */
export type CardFieldKey =
  | 'word'
  | 'phonetic'
  | 'partOfSpeech'
  | 'targetMeaning'
  | 'englishMeaning'
  | 'examples'
  | 'exampleTranslations'
  | 'notes'

/**
 * One block in a visual layout (Notion / form-builder style).
 * `fieldType` is typed as CardFieldKey for safety; wire as string at API boundaries if needed.
 */
export interface CardFieldLayout {
  id: string
  fieldType: CardFieldKey
  order: number
}

export interface GeneratedCardData {
  word: string
  phonetic?: string
  partOfSpeech?: string
  targetMeaning?: string
  englishMeaning?: string
  examples: ExampleSentenceDto[]
  notes?: string
}

export interface GenerationMetadata {
  sourceLanguage: string
  targetLanguage: string
  tone: ToneOption
  difficulty: DifficultyOption
  exampleCount: number
  includePhonetic: boolean
  includePartOfSpeech: boolean
  includeTargetMeaning: boolean
  includeEnglishMeaning: boolean
  includeExampleTranslations: boolean
}

export interface GeneratedCard {
  id: string
  sourceInput: string
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
  data: GeneratedCardData
  /** Present only when backend marks this input as unknown/invalid. */
  invalid?: {
    isInvalid: true
    suggestions: string[]
    originalWord: string
  }
  isEdited: boolean
  isRegenerating: boolean
  createdAt: string
  updatedAt: string
  generationMetadata: GenerationMetadata
}

export interface GeneratedSession {
  sessionId: string
  createdAt: string
  updatedAt: string
  sourceType: SessionSourceType
  cards: GeneratedCard[]
}

/** User deck in the library (persistent). */
export interface Deck {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  /** Updated when a card is committed to this deck (for “recent” ordering). */
  lastUsedAt?: string
}

/** Persisted deck card (IndexedDB library + future Leitner). */
export interface SavedCard {
  id: string
  originalGeneratedCardId: string
  deckId: string
  front: string
  back: string
  data: GeneratedCardData
  savedAt: string
  updatedAt: string
  /** Spaced-repetition state (defaults applied on save). */
  study: StudyProgress
}
