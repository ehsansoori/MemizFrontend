/** --- Generation API DTOs (future backend) --- */

export type ToneOption =
  | 'formal'
  | 'casual'
  | 'academic'
  | 'business'
  | 'friendly'

export type DifficultyOption = 'beginner' | 'intermediate' | 'advanced'

export interface CardGenerationOptionsDto {
  /** Accent/source codes to request (from template). */
  pronunciations: string[]
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
  sentence: string
  translation?: string
  /** @deprecated Legacy persisted cards */
  text?: string
}

export interface CardPronunciationDto {
  accent: string
  phonetic: string
}

import type { StudyProgress } from '@/types/study'
import type { CardTemplate, DeckSettings, DeckTypeId } from '@/types/deckProfile'

/** --- Session & persistence domain models --- */

export type SessionSourceType = 'manual' | 'file' | 'ankiDeck' | 'api'

/** Canonical field identifiers for language card templates. */
export type CardFieldKey =
  | 'input'
  | 'translation'
  | 'pronunciations'
  | 'partOfSpeech'
  | 'examples'

export interface CardFieldLayout {
  id: string
  fieldType: CardFieldKey
  order: number
}

export interface GeneratedCardData {
  input: string
  translation?: string
  pronunciations?: CardPronunciationDto[]
  partOfSpeech?: string[]
  examples: ExampleSentenceDto[]
  /** @deprecated Legacy persisted cards */
  word?: string
  phonetic?: string
  partOfSpeechList?: string[]
  targetMeaning?: string
  englishMeaning?: string
  notes?: string
}

export interface GenerationMetadata {
  sourceLanguage: string
  targetLanguage: string
  tone: ToneOption
  difficulty: DifficultyOption
  pronunciations: string[]
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
  templateId?: string
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
  data: GeneratedCardData
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

export interface Deck {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
  deckTypeId?: DeckTypeId
  defaultTemplateId?: string
  /** @deprecated Use defaultTemplateId */
  templateId?: string
  settings?: DeckSettings
}

export interface SavedCard {
  id: string
  originalGeneratedCardId: string
  deckId: string
  templateId?: string
  /** Frozen template definition from the last save/generation — used for all card rendering. */
  templateSnapshot?: CardTemplate
  /** ISO timestamp of the last successful AI generation for this card. */
  lastGeneratedAt?: string
  /** Model/generation pipeline version at last AI generation. */
  lastGeneratedModelVersion?: string
  front: string
  back: string
  data: GeneratedCardData
  savedAt: string
  updatedAt: string
  study: StudyProgress
}
