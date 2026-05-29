import { findInboxDeck } from '@/domain/inboxDeck'
import type { Deck } from '@/types/cards'

/** Resolve persisted active deck id to a valid deck, falling back to Inbox. */
export function resolveActiveDeckId(
  decks: Deck[],
  storedActiveDeckId: string | null,
): string | null {
  if (decks.length === 0) return null

  if (storedActiveDeckId) {
    const found = decks.find((d) => d.id === storedActiveDeckId)
    if (found) return found.id
  }

  return findInboxDeck(decks)?.id ?? decks[0]?.id ?? null
}

export function getActiveDeck(
  decks: Deck[],
  activeDeckId: string | null,
): Deck | undefined {
  if (!activeDeckId) return findInboxDeck(decks) ?? decks[0]
  return decks.find((d) => d.id === activeDeckId)
}
