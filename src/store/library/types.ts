import type { GeneratedCard, SavedCard } from '@/types/cards'

export type CommitToDeckInput =
  | { cardIds: string[]; deckId: string }
  | { cardIds: string[]; newDeckName: string }

export type CommitToDeckResult = {
  deckId: string
  deckName: string
  savedCards: SavedCard[]
}

export type CommitCardsSource = {
  cardsToCommit: GeneratedCard[]
  input: CommitToDeckInput
}
