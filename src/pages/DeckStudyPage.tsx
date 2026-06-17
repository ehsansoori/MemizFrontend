import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DeckCardEditSheet } from '@/components/deckDetails/DeckCardEditSheet'
import { StudyCardRow } from '@/components/deckStudy/StudyCardRow'
import { buildFacesFromData } from '@/domain/deckCardFaces'
import { filterAndRankCardsBySearch } from '@/domain/cardSearch'
import { useToast } from '@/providers/toastContext'
import { storage } from '@/storage/adapter'
import { useLibraryStore } from '@/store/library/libraryStore'
import type { SavedCard } from '@/types/cards'

type StatusFilter = 'all' | 'new' | 'learning' | 'mastered'

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'learning', label: 'Learning' },
  { id: 'mastered', label: 'Mastered' },
]

function filterByStatus(cards: SavedCard[], filter: StatusFilter): SavedCard[] {
  if (filter === 'all') return cards
  return cards.filter((c) => c.study.status === filter)
}

export function DeckStudyPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { showToast } = useToast()

  const decks = useLibraryStore((s) => s.decks)
  const allCards = useLibraryStore((s) => s.cards)
  const hydrated = useLibraryStore((s) => s.hydrated)
  const reload = useLibraryStore((s) => s.reload)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [editCard, setEditCard] = useState<SavedCard | null>(null)
  const [busy, setBusy] = useState(false)

  const deck = useMemo(
    () => (deckId ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  )

  const deckCards = useMemo(
    () => (deckId ? allCards.filter((c) => c.deckId === deckId) : []),
    [allCards, deckId],
  )

  const filteredCards = useMemo(() => {
    const byStatus = filterByStatus(deckCards, statusFilter)
    const searched = filterAndRankCardsBySearch(byStatus, query, 'all')
    if (query.trim()) return searched
    return [...searched].sort((a, b) =>
      a.data.word.localeCompare(b.data.word, undefined, { sensitivity: 'base' }),
    )
  }, [deckCards, statusFilter, query])

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: deckCards.length,
      new: 0,
      learning: 0,
      mastered: 0,
    }
    for (const card of deckCards) {
      const status = card.study.status
      if (status === 'new') counts.new += 1
      if (status === 'learning') counts.learning += 1
      if (status === 'mastered') counts.mastered += 1
    }
    return counts
  }, [deckCards])

  if (hydrated && !deck) {
    return <Navigate to="/decks" replace />
  }

  const handleDeleteCard = async (card: SavedCard) => {
    if (!window.confirm(`Delete “${card.data.word}”?`)) return
    setBusy(true)
    try {
      await storage.cards.softDelete(card.id)
      await reload()
      showToast('Card deleted.', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveCard = async (
    card: SavedCard,
    values: { word: string; targetMeaning: string; englishMeaning: string },
  ) => {
    setBusy(true)
    try {
      const data = {
        ...card.data,
        word: values.word,
        targetMeaning: values.targetMeaning || undefined,
        englishMeaning: values.englishMeaning || undefined,
      }
      const faces = buildFacesFromData({ ...card, data })
      await storage.cards.put({
        ...card,
        data,
        front: faces.front,
        back: faces.back,
        updatedAt: new Date().toISOString(),
      })
      await reload()
      showToast('Card updated.', 'success')
      setEditCard(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!deck) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-center text-[14px] text-slate-500">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-8 pt-4 sm:px-6">
      <div className="mb-5">
        <Link
          to={`/decks/${deckId}`}
          className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-accent"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          {deck.name}
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">Study</h1>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Browse and edit all cards in this deck.
        </p>
      </div>

      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards"
          aria-label="Search cards"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/25 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:bg-slate-800"
        />
      </div>

      <div
        className="mb-4 flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Card status filters"
      >
        {STATUS_FILTERS.map((tab) => {
          const active = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusFilter(tab.id)}
              className={[
                'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition',
                active
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              ].join(' ')}
            >
              {tab.label}
              <span
                className={[
                  'tabular-nums',
                  active ? 'text-white/80' : 'text-slate-400 dark:text-slate-500',
                ].join(' ')}
              >
                {statusCounts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {filteredCards.length === 0 ? (
        <div className="mt-12 flex flex-col items-center px-6 text-center">
          <p className="text-[15px] font-semibold text-slate-700 dark:text-slate-200">
            {deckCards.length === 0 ? 'No cards in this deck' : 'No cards match'}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {deckCards.length === 0
              ? 'Add cards from the deck page.'
              : 'Try another search or filter.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredCards.map((card) => (
            <li key={card.id}>
              <StudyCardRow
                card={card}
                disabled={busy}
                onEdit={() => setEditCard(card)}
                onDelete={() => void handleDeleteCard(card)}
              />
            </li>
          ))}
        </ul>
      )}

      <DeckCardEditSheet
        open={editCard !== null}
        card={editCard}
        busy={busy}
        onClose={() => setEditCard(null)}
        onSubmit={(card, values) => void handleSaveCard(card, values)}
      />
    </main>
  )
}
