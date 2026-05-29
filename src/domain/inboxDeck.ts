import { storage } from '@/storage/adapter'
import type { Deck } from '@/types/cards'

/** System default deck — single instance per library. */
export const INBOX_DECK_NAME = 'Inbox'

const INBOX_LOWER = INBOX_DECK_NAME.toLowerCase()

export function isInboxDeck(deck: Pick<Deck, 'name'>): boolean {
  return deck.name.trim().toLowerCase() === INBOX_LOWER
}

export function isReservedInboxName(name: string): boolean {
  return name.trim().toLowerCase() === INBOX_LOWER
}

export function sortDecksWithInboxFirst(decks: Deck[]): Deck[] {
  const inbox = decks.filter(isInboxDeck)
  const rest = decks.filter((d) => !isInboxDeck(d))
  const primary = inbox[0]
  return primary ? [primary, ...rest] : rest
}

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createInboxDeck(): Deck {
  const t = nowIso()
  return {
    id: newId(),
    name: INBOX_DECK_NAME,
    createdAt: t,
    updatedAt: t,
    lastUsedAt: t,
  }
}

/**
 * Guarantees exactly one Inbox deck exists; removes duplicate Inbox rows.
 * Call on app bootstrap before loading the library store.
 */
export async function ensureInboxDeck(): Promise<Deck> {
  const all = await storage.decks.getAll()
  const inboxes = all.filter(isInboxDeck)

  if (inboxes.length === 0) {
    const created = createInboxDeck()
    await storage.decks.put(created)
    return created
  }

  const sorted = [...inboxes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const keeper = sorted[0]

  for (let i = 1; i < sorted.length; i += 1) {
    await storage.decks.softDelete(sorted[i].id)
  }

  return keeper
}

export function findInboxDeck(decks: Deck[]): Deck | undefined {
  return decks.find(isInboxDeck)
}
