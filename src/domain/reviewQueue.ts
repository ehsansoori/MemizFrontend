import type { SavedCard } from '@/types/cards'

/** MVP review queues (no spaced repetition yet). */
export type ReviewQueueFilter = 'new' | 'review'

export function isNewCard(card: SavedCard): boolean {
  return card.study.status === 'new'
}

export function isReviewCard(card: SavedCard): boolean {
  return card.study.status === 'review'
}

export function filterCardsByQueue(
  cards: SavedCard[],
  queue: ReviewQueueFilter,
): SavedCard[] {
  return cards.filter((c) =>
    queue === 'new' ? isNewCard(c) : isReviewCard(c),
  )
}

export function countByQueue(cards: SavedCard[]): Record<ReviewQueueFilter, number> {
  let newCount = 0
  let reviewCount = 0
  for (const c of cards) {
    if (isNewCard(c)) newCount += 1
    else if (isReviewCard(c)) reviewCount += 1
  }
  return { new: newCount, review: reviewCount }
}
