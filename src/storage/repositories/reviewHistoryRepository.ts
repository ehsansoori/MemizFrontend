import { db } from '@/storage/db'
import { filterActive, markDeleted, markPending } from '@/storage/sync/conflict'
import type { StoredReviewHistory } from '@/storage/types'

export const reviewHistoryRepository = {
  async getAll(): Promise<StoredReviewHistory[]> {
    return filterActive(await db.reviewHistory.toArray())
  },

  async getByCardId(cardId: string): Promise<StoredReviewHistory[]> {
    return filterActive(
      await db.reviewHistory.where('cardId').equals(cardId).toArray(),
    )
  },

  async put(entry: StoredReviewHistory): Promise<void> {
    await db.reviewHistory.put(markPending(entry))
  },

  async putMany(entries: StoredReviewHistory[]): Promise<void> {
    await db.reviewHistory.bulkPut(entries.map((e) => markPending(e)))
  },

  async softDelete(id: string): Promise<void> {
    const existing = await db.reviewHistory.get(id)
    if (!existing) return
    await db.reviewHistory.put(markDeleted(existing))
  },

  async getPendingSync(): Promise<StoredReviewHistory[]> {
    const rows = await db.reviewHistory.toArray()
    return rows.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'modified')
  },
}
