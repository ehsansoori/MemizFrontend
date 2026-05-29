import { db } from '@/storage/db'
import { storedToDeck, deckToStored } from '@/storage/mappers'
import { filterActive, markDeleted, markPending } from '@/storage/sync/conflict'
import type { Deck } from '@/types/cards'
import type { StoredDeck } from '@/storage/types'

export const deckRepository = {
  async getAll(): Promise<Deck[]> {
    const rows = filterActive(await db.decks.toArray())
    return rows.map(storedToDeck)
  },

  async getById(id: string): Promise<Deck | undefined> {
    const row = await db.decks.get(id)
    if (!row || row.syncStatus === 'deleted') return undefined
    return storedToDeck(row)
  },

  async put(deck: Deck): Promise<void> {
    const row = markPending(deckToStored(deck, 'pending'))
    await db.decks.put(row)
  },

  async putMany(decks: Deck[]): Promise<void> {
    const rows = decks.map((d) => markPending(deckToStored(d, 'pending')))
    await db.decks.bulkPut(rows)
  },

  async touchLastUsed(id: string): Promise<Deck | undefined> {
    const existing = await db.decks.get(id)
    if (!existing || existing.syncStatus === 'deleted') return undefined
    const t = new Date().toISOString()
    const updated: StoredDeck = markPending({
      ...existing,
      lastUsedAt: t,
      updatedAt: t,
    })
    await db.decks.put(updated)
    return storedToDeck(updated)
  },

  async softDelete(id: string): Promise<void> {
    const existing = await db.decks.get(id)
    if (!existing) return
    await db.decks.put(markDeleted(existing))
  },

  async getPendingSync(): Promise<StoredDeck[]> {
    const rows = await db.decks.toArray()
    return rows.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'modified')
  },
}
