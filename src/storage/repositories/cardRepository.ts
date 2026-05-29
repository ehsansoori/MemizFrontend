import { db } from '@/storage/db'
import { savedCardToStored, storedToSavedCard } from '@/storage/mappers'
import { filterActive, markDeleted, markPending } from '@/storage/sync/conflict'
import type { SavedCard } from '@/types/cards'
import type { StoredCard } from '@/storage/types'

export const cardRepository = {
  async getAll(): Promise<SavedCard[]> {
    const rows = filterActive(await db.cards.toArray())
    return rows.map(storedToSavedCard)
  },

  async getByDeckId(deckId: string): Promise<SavedCard[]> {
    const rows = filterActive(await db.cards.where('deckId').equals(deckId).toArray())
    return rows.map(storedToSavedCard)
  },

  async getById(id: string): Promise<SavedCard | undefined> {
    const row = await db.cards.get(id)
    if (!row || row.syncStatus === 'deleted') return undefined
    return storedToSavedCard(row)
  },

  async put(card: SavedCard): Promise<void> {
    const row = markPending(savedCardToStored(card, 'pending'))
    await db.cards.put(row)
  },

  async putMany(cards: SavedCard[]): Promise<void> {
    const rows = cards.map((c) => markPending(savedCardToStored(c, 'pending')))
    await db.cards.bulkPut(rows)
  },

  async softDelete(id: string): Promise<void> {
    const existing = await db.cards.get(id)
    if (!existing) return
    await db.cards.put(markDeleted(existing))
  },

  async countByDeck(): Promise<Map<string, number>> {
    const rows = filterActive(await db.cards.toArray())
    const m = new Map<string, number>()
    for (const c of rows) {
      m.set(c.deckId, (m.get(c.deckId) ?? 0) + 1)
    }
    return m
  },

  async getPendingSync(): Promise<StoredCard[]> {
    const rows = await db.cards.toArray()
    return rows.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'modified')
  },
}
