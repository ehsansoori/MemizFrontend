import { filterAndRankCardsBySearch } from '@/domain/cardSearch'
import { cardInput } from '@/domain/languageCardData'
import type { SavedCard } from '@/types/cards'

export type DeckCardStatusFilter = 'all' | 'new' | 'learning' | 'mastered'

export const DECK_CARD_STATUS_FILTERS: { id: DeckCardStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'learning', label: 'Learning' },
  { id: 'mastered', label: 'Mastered' },
]

export function sortDeckCardsAlphabetically(cards: SavedCard[]): SavedCard[] {
  return [...cards].sort((a, b) =>
    cardInput(a.data).localeCompare(cardInput(b.data), undefined, { sensitivity: 'base' }),
  )
}

export function filterDeckCardsByStatus(
  cards: SavedCard[],
  filter: DeckCardStatusFilter,
): SavedCard[] {
  if (filter === 'all') return cards
  return cards.filter((c) => c.study.status === filter)
}

export function filterDeckCardsForBrowse(
  cards: SavedCard[],
  query: string,
  statusFilter: DeckCardStatusFilter,
): SavedCard[] {
  const byStatus = filterDeckCardsByStatus(cards, statusFilter)
  const searched = filterAndRankCardsBySearch(byStatus, query, 'all')
  if (query.trim()) return searched
  return sortDeckCardsAlphabetically(searched)
}

export function countDeckCardsByStatus(cards: SavedCard[]): Record<DeckCardStatusFilter, number> {
  const counts: Record<DeckCardStatusFilter, number> = {
    all: cards.length,
    new: 0,
    learning: 0,
    mastered: 0,
  }
  for (const card of cards) {
    const status = card.study.status
    if (status === 'new') counts.new += 1
    if (status === 'learning') counts.learning += 1
    if (status === 'mastered') counts.mastered += 1
  }
  return counts
}
