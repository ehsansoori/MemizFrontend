import type { GeneratedCard } from '@/types/cards'

export type InvalidInputState = {
  originalWord: string
  suggestions: string[]
}

export function invalidInputFromGeneratedCard(card: GeneratedCard): InvalidInputState | null {
  if (!card.invalid) return null
  return {
    originalWord: card.invalid.originalWord,
    suggestions: card.invalid.suggestions,
  }
}
