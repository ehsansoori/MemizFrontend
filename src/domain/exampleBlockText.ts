import { exampleSentence } from '@/domain/languageCardData'
import type { ExampleSentenceDto } from '@/types/cards'

/** Serialize examples into one multiline block for bulk editing. */
export function examplesToBlockText(
  examples: ExampleSentenceDto[],
  includeTranslation: boolean,
): string {
  return examples
    .filter((ex) => exampleSentence(ex) || ex.translation?.trim())
    .map((ex) => {
      const sentence = exampleSentence(ex)
      const translation = ex.translation?.trim() ?? ''
      if (includeTranslation && translation) {
        return `${sentence}\n${translation}`
      }
      return sentence
    })
    .join('\n\n')
}

/** Parse bulk-edited text back into structured examples (blank line separates entries). */
export function parseExamplesFromBlockText(
  text: string,
  count: number,
  includeTranslation: boolean,
): ExampleSentenceDto[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const parsed: ExampleSentenceDto[] = blocks.map((block) => {
    const lines = block.split('\n')
    const sentence = lines[0]?.trim() ?? ''
    const translation = includeTranslation
      ? lines
          .slice(1)
          .join('\n')
          .trim() || undefined
      : undefined
    return { sentence, translation }
  })

  return Array.from({ length: count }, (_, index) => parsed[index] ?? { sentence: '' })
}

export function hasVisibleExamples(examples: ExampleSentenceDto[]): boolean {
  return examples.some((ex) => exampleSentence(ex) || ex.translation?.trim())
}
