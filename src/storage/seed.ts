import { ensureInboxDeck, sortDecksWithInboxFirst } from '@/domain/inboxDeck'
import { storage } from '@/storage/adapter'
import type { Deck } from '@/types/cards'

/** Bootstrap library: ensure Inbox exists, return decks with Inbox first. */
export async function bootstrapLibraryDecks(): Promise<Deck[]> {
  await ensureInboxDeck()
  const decks = await storage.decks.getAll()
  return sortDecksWithInboxFirst(decks)
}
