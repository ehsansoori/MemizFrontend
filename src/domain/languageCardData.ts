import type { ExampleSentenceDto, GeneratedCardData } from '@/types/cards'

/** Read input from current or legacy card data. */
export function cardInput(data: GeneratedCardData): string {
  return (data.input ?? data.word ?? '').trim()
}

/** Read example sentence from current or legacy shape. */
export function exampleSentence(example: ExampleSentenceDto): string {
  return (example.sentence ?? example.text ?? '').trim()
}

export function exampleTranslation(example: ExampleSentenceDto): string | undefined {
  return example.translation?.trim() || undefined
}

/** Normalize legacy persisted cards into the new language card shape. */
export function normalizeGeneratedCardData(data: GeneratedCardData): GeneratedCardData {
  const input = cardInput(data)
  const translation =
    data.translation?.trim() ||
    data.targetMeaning?.trim() ||
    data.englishMeaning?.trim() ||
    undefined

  const partOfSpeech =
    data.partOfSpeech?.filter(Boolean) ??
    data.partOfSpeechList?.filter(Boolean)

  const pronunciations =
    data.pronunciations?.filter((p) => p.phonetic?.trim()) ??
    (data.phonetic?.trim() ? [{ accent: '', phonetic: data.phonetic.trim() }] : undefined)

  const examples = (data.examples ?? []).map((ex) => ({
    sentence: exampleSentence(ex),
    translation: exampleTranslation(ex),
  }))

  return {
    input,
    translation,
    pronunciations,
    partOfSpeech,
    examples,
  }
}
