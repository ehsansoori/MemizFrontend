import type { GeneratedCard } from '@/types/cards'

/** Optimistically update the displayed invalid word before API regeneration returns. */
export function withInvalidCardWord(
  card: GeneratedCard,
  word: string,
  opts?: { regenerating?: boolean },
): GeneratedCard {
  const trimmed = word.trim()
  return {
    ...card,
    sourceInput: trimmed,
    data: {
      ...card.data,
      word: trimmed,
    },
    invalid: card.invalid
      ? {
          ...card.invalid,
          originalWord: trimmed,
        }
      : undefined,
    isRegenerating: opts?.regenerating ?? card.isRegenerating,
    updatedAt: new Date().toISOString(),
  }
}
