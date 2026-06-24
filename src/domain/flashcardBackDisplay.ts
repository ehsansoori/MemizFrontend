import type { GeneratedCardData } from '@/types/cards'
import {
  exampleSentence,
  exampleTranslation,
  normalizeGeneratedCardData,
} from '@/domain/languageCardData'

export type FlashcardBackModel = {
  input: string
  translation?: string
  pronunciations: { accent: string; phonetic: string }[]
  partOfSpeech: string[]
  examples: { sentence: string; translation?: string }[]
}

export function getFlashcardBackModel(data: GeneratedCardData): FlashcardBackModel {
  const normalized = normalizeGeneratedCardData(data)

  return {
    input: normalized.input,
    translation: normalized.translation,
    pronunciations: normalized.pronunciations ?? [],
    partOfSpeech: normalized.partOfSpeech ?? [],
    examples: normalized.examples
      .filter((ex) => exampleSentence(ex))
      .map((ex) => ({
        sentence: exampleSentence(ex),
        translation: exampleTranslation(ex),
      })),
  }
}

/** Whether to render the examples section (and optional empty-state warning). */
export function flashcardShowsExamplesSection(
  model: FlashcardBackModel,
  options?: { expectExamples?: boolean },
): boolean {
  if (model.examples.length > 0) return true
  return options?.expectExamples === true
}
