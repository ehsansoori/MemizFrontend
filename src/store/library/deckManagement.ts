import { ensureInboxDeck, findInboxDeck, isReservedInboxName } from '@/domain/inboxDeck'
import { storage } from '@/storage/adapter'
import { bootstrapLibraryDecks } from '@/storage/seed'
import type { Deck } from '@/types/cards'

function nowIso(): string {
  return new Date().toISOString()
}

export type DeleteDeckMode = 'moveToInbox' | 'deleteCards'

export async function renameDeckInStorage(deckId: string, newName: string): Promise<Deck> {
  const trimmed = newName.trim()
  if (!trimmed) throw new Error('Deck name cannot be empty.')
  if (isReservedInboxName(trimmed)) {
    throw new Error('That name is reserved for the default Inbox deck.')
  }

  const existing = await storage.decks.getById(deckId)
  if (!existing) throw new Error('Deck not found.')

  const all = await storage.decks.getAll()
  const duplicate = all.find(
    (d) => d.id !== deckId && d.name.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  if (duplicate) throw new Error(`A deck named “${trimmed}” already exists.`)

  const t = nowIso()
  const updated: Deck = {
    ...existing,
    name: trimmed,
    updatedAt: t,
  }
  await storage.decks.put(updated)
  return updated
}

export async function deleteDeckInStorage(
  deckId: string,
  mode: DeleteDeckMode,
): Promise<void> {
  const existing = await storage.decks.getById(deckId)
  if (!existing) throw new Error('Deck not found.')

  const allDecks = await storage.decks.getAll()
  if (allDecks.length <= 1) {
    throw new Error('You must keep at least one deck.')
  }

  const inbox = await ensureInboxDeck()
  const cards = await storage.cards.getByDeckId(deckId)
  const t = nowIso()

  if (mode === 'moveToInbox') {
    for (const card of cards) {
      await storage.cards.put({
        ...card,
        deckId: inbox.id,
        updatedAt: t,
      })
    }
  } else {
    for (const card of cards) {
      await storage.cards.softDelete(card.id)
    }
  }

  await storage.decks.softDelete(deckId)
}

export async function reloadLibraryFromStorage(): Promise<{
  decks: Deck[]
  cards: Awaited<ReturnType<typeof storage.cards.getAll>>
}> {
  const decks = await bootstrapLibraryDecks()
  const cards = await storage.cards.getAll()
  return { decks, cards }
}

export async function createDeckInStorage(name: string): Promise<Deck> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Deck name is required.')
  if (isReservedInboxName(trimmed)) {
    const all = await storage.decks.getAll()
    if (findInboxDeck(all)) {
      throw new Error('A deck named “Inbox” already exists.')
    }
  }

  const all = await storage.decks.getAll()
  const duplicate = all.find(
    (d) => d.name.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  if (duplicate) throw new Error(`A deck named “${trimmed}” already exists.`)

  const t = nowIso()
  const deck: Deck = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: t,
    updatedAt: t,
    lastUsedAt: t,
  }
  await storage.decks.put(deck)
  return deck
}

export async function getInboxDeckForDelete(): Promise<Deck> {
  await ensureInboxDeck()
  const decks = await storage.decks.getAll()
  const inbox = findInboxDeck(decks)
  if (!inbox) throw new Error('Inbox deck is missing.')
  return inbox
}
